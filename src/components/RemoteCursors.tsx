import { useEffect, useState, useRef } from 'react';
import { useSceneStore } from '../store/sceneStore.ts';
import { useAuthStore } from '../store/authStore.ts';
import { updateCursor, deleteCursor } from '../lib/appwrite.ts'; // ✅ Используем централизованные функции
import { subscribeToCursorUpdates, type CursorData } from '../lib/realtime.ts';
import { generatedId } from '../utils/generated.js';

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
    
    const isCursorCreatedRef = useRef(false);
    const mousePositionRef = useRef({ x: 0, y: 0 });
    
    // ✅ Фолбэк для гостей: если нет аккаунта, генерируем временный ID
    const [guestId] = useState(() => generatedId());
    const userId = user?.$id || `guest_${guestId}`;
    const userName = user?.name || user?.email?.split('@')[0] || `Гость-${guestId.slice(0, 4)}`;

    useEffect(() => {
        // ✅ Убрали проверку !user, теперь работает и для анонимных гостей
        if (!online || !currentSceneId) return;

        const userColor = getUserColor(userId);

        // 1. Создаем документ курсора ОДИН РАЗ
        const createCursorOnce = async () => {
            if (isCursorCreatedRef.current) return;
            try {
                await updateCursor(currentSceneId, userId, userName, userColor, 0, 0);
                isCursorCreatedRef.current = true;
            } catch (error: unknown) {
                const err = error as Record<string, unknown>;
                if (err?.code === 409 || err?.code === '409') {
                    isCursorCreatedRef.current = true;
                } else {
                    console.error('Ошибка создания курсора:', error);
                }
            }
        };

        createCursorOnce();

        // ✅ 2. Throttle вместо debounce: отправляем не чаще раза в 80 мс
        let lastSent = 0;
        const handleMouseMove = (e: MouseEvent) => {
            mousePositionRef.current = { x: e.clientX, y: e.clientY };
            const now = Date.now();
            if (now - lastSent < 80) return;
            lastSent = now;
            
            if (!isCursorCreatedRef.current) return;
            
            updateCursor(currentSceneId, userId, userName, userColor, mousePositionRef.current.x, mousePositionRef.current.y)
                .catch(() => {});
        };

        // ✅ 3. Heartbeat: обновляем last_seen каждые 2 секунды, даже если мышь неподвижна
        const heartbeat = setInterval(() => {
            if (!isCursorCreatedRef.current) return;
            updateCursor(currentSceneId, userId, userName, userColor, mousePositionRef.current.x, mousePositionRef.current.y)
                .catch(() => {});
        }, 2000);

        window.addEventListener('mousemove', handleMouseMove);
        
        const handleBeforeUnload = () => {
            deleteCursor(currentSceneId, userId);
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            clearInterval(heartbeat);
            deleteCursor(currentSceneId, userId);
        };
    }, [online, currentSceneId, userId, userName]);

    // Подписка на чужие курсоры (без изменений)
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

    // Очистка "зависших" курсоров (без изменений)
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
            {Object.entries(cursors).map(([cursorUserId, cursor]) => {
                if (userId === cursorUserId) return null; // Не показываем свой курсор

                return (
                    <div
                        key={cursorUserId}
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