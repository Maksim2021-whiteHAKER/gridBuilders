// src/components/RemoteCursors.tsx
import { useEffect, useState, useRef } from 'react';
import { useSceneStore } from '../store/sceneStore.ts';
import { useAuthStore } from '../store/authStore.ts';
import { subscribeToCursorUpdates, type CursorData } from '../lib/realtime.ts';
import { databases, DATA_BASE, CURSORS_COLLECTION } from '../lib/appwrite.ts';

function getUserColor(userId: string) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
}

export function RemoteCursors() {
    const { online, currentSceneId } = useSceneStore();
    const { user } = useAuthStore();
    const [cursors, setCursors] = useState<Record<string, CursorData>>({});
    const unsubscribeRef = useRef<(() => void) | null>(null);
    
    // Флаг: создан ли уже документ моего курсора
    const isCursorCreatedRef = useRef(false);
    const mousePositionRef = useRef({ x: 0, y: 0 });
    const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!online || !currentSceneId || !user) return;

        const userColor = getUserColor(user.$id);
        const userName = user.name || user.email?.split('@')[0] || 'Гость';
        const cursorId = `${currentSceneId.substring(0, 18)}_${user.$id.substring(0, 17)}`;

        // ✅ 1. Создаем документ курсора ОДИН РАЗ при монтировании
        const createCursorOnce = async () => {
            if (isCursorCreatedRef.current) return;
            
            try {
                await databases.createDocument(DATA_BASE, CURSORS_COLLECTION, cursorId, {
                    scene_id: currentSceneId,
                    user_id: user.$id,
                    user_name: userName,
                    color: userColor,
                    x: 0,
                    y: 0,
                    last_seen: new Date().toISOString()
                });
                isCursorCreatedRef.current = true;
            } catch (error: any) {
                // Если уже существует (409), просто помечаем как созданный
                if (error?.code === 409) {
                    isCursorCreatedRef.current = true;
                } else {
                    console.error('Ошибка создания курсора:', error);
                }
            }
        };

        createCursorOnce();

        // ✅ 2. Отслеживаем движение мыши и ОБНОВЛЯЕМ существующий документ
        const handleMouseMove = (e: MouseEvent) => {
            mousePositionRef.current = { x: e.clientX, y: e.clientY };

            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }

            updateTimeoutRef.current = setTimeout(async () => {
                if (!isCursorCreatedRef.current) return;

                try {
                    // Просто обновляем координаты (никаких 409!)
                    await databases.updateDocument(DATA_BASE, CURSORS_COLLECTION, cursorId, {
                        x: mousePositionRef.current.x,
                        y: mousePositionRef.current.y,
                        last_seen: new Date().toISOString()
                    });
                } catch (error) {
                    console.error('Ошибка обновления курсора:', error);
                }
            }, 50);
        };

        window.addEventListener('mousemove', handleMouseMove);
        
        const handleBeforeUnload = () => {
            databases.deleteDocument(DATA_BASE, CURSORS_COLLECTION, cursorId).catch(() => {});
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
            databases.deleteDocument(DATA_BASE, CURSORS_COLLECTION, cursorId).catch(() => {});
        };
    }, [online, currentSceneId, user]);

    // Подписка на чужие курсоры
    useEffect(() => {
        if (!online || !currentSceneId) return;

        unsubscribeRef.current = subscribeToCursorUpdates(currentSceneId, (update) => {
            setCursors(prev => {
                const payload = update.payload;
                if (!payload) return prev; 

                const newCursors = { ...prev };
                if (update.event === 'delete') {
                    delete newCursors[payload.user_id];
                } else {
                    newCursors[payload.user_id] = payload;
                }
                return newCursors;
            });
        });

        return () => {
            if (unsubscribeRef.current) unsubscribeRef.current();
        };
    }, [online, currentSceneId]);

    // Очистка "зависших" курсоров
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setCursors(prev => {
                const cleaned: Record<string, CursorData> = {};
                let changed = false;
                for (const [id, cursor] of Object.entries(prev)) {
                    const lastSeen = new Date(cursor.last_seen).getTime();
                    if (now - lastSeen < 5000) { 
                        cleaned[id] = cursor;
                    } else {
                        changed = true;
                    }
                }
                return changed ? cleaned : prev;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    if (!online || Object.keys(cursors).length === 0) return null;

    return (
        <>
            {Object.entries(cursors).map(([userId, cursor]) => {
                if (user && userId === user.$id) return null;

                return (
                    <div
                        key={userId}
                        style={{
                            position: 'fixed',
                            left: cursor.x,
                            top: cursor.y,
                            pointerEvents: 'none',
                            zIndex: 9999,
                            transform: 'translate(0, 0)',
                            transition: 'left 0.1s linear, top 0.1s linear',
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))' }}>
                            <path 
                                d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.35Z" 
                                fill={cursor.color} 
                                stroke="white" 
                                strokeWidth="1.5"
                            />
                        </svg>
                        <div style={{
                            position: 'absolute',
                            top: 20,
                            left: 15,
                            background: cursor.color,
                            color: '#fff',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}>
                            {cursor.user_name}
                        </div>
                    </div>
                );
            })}
        </>
    );
}