// src/components/ProjectModal.tsx
import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useSceneStore } from "../store/sceneStore";
import { loadScene, saveScene, deleteScene, loadScenes, renameScene } from "../lib/appwrite";

export function ProjectModal({ onClose }: { onClose: () => void }) {
    const user = useAuthStore((state) => state.user);
    const { setObjects } = useSceneStore();

    const [scenes, setScenes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [sceneName, setSceneName] = useState("Моя сцена");
    const [isSaving, setIsSaving] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

    if (!user) return null;

    useEffect(() => {
        fetchScenes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchScenes = async () => {
        setIsLoading(true);
        setError("");
        try {
            const data = await loadScenes(user.$id);
            // Сортировка
            const sorted = sortBy === 'date' 
                ? data.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                : data.sort((a: any, b: any) => a.name.localeCompare(b.name));
            setScenes(sorted);
        } catch (err: any) {
            setError("Ошибка загрузки списка проектов: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const save = async () => {
        if (!sceneName.trim()) {
            setError("Введите название сцены");
            return;
        }
        setIsSaving(true);
        setError("");
        try {
            const currentObjects = useSceneStore.getState().objects;
            await saveScene(user.$id, sceneName, { objects: currentObjects });
            setSceneName("Моя сцена");
            await fetchScenes();
        } catch (err: any) {
            setError("Ошибка сохранения: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const load = async (scene: any) => {
        setActionLoading(scene.id);
        setError("");
        try {
            const loaded = await loadScene(scene.id);
            setObjects(loaded.data.objects || []);
            onClose();
        } catch (err: any) {
            setError("Ошибка загрузки сцены: " + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRename = async (id: string) => {
        if (!editName.trim()) {
            setEditingId(null);
            return;
        }
        setActionLoading(id);
        try {
            await renameScene(id, editName);
            setEditingId(null);
            await fetchScenes();
        } catch (err: any) {
            setError("Ошибка переименования: " + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const deleteById = async (id: string) => {
        if (!confirm("Вы точно уверены? 🤔 (Обратить это действие будет невозможно)")) return;
        
        setActionLoading(id);
        try {
            await deleteScene(id);
            await fetchScenes();
        } catch (err: any) {
            setError("Ошибка удаления сцены: " + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)', zIndex: 5000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: 'rgba(20, 21, 31, 0.98)',
                padding: 24, borderRadius: 12, border: '1px solid #2e303a',
                width: '100%', maxWidth: 600, maxHeight: '80vh',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                display: 'flex', flexDirection: 'column'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ margin: 0, color: '#e4e4e7', fontSize: 18, fontWeight: 600 }}>📁 Мои проекты</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 20, cursor: 'pointer' }}>❌</button>
                </div>

                {error && (
                    <div style={{ color: '#ff5f56', fontSize: 13, marginBottom: 12, padding: 10, background: 'rgba(255, 95, 86, 0.1)', borderRadius: 6, border: '1px solid rgba(255, 95, 86, 0.3)' }}>
                        {error}
                    </div>
                )}

                {/* Блок сохранения */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #2e303a' }}>
                    <input
                        type="text"
                        placeholder="Название новой сцены"
                        value={sceneName}
                        onChange={(e) => setSceneName(e.target.value)}
                        disabled={isSaving}
                        style={{
                            flex: 1, padding: '10px 12px', background: '#0a0b15', border: '1px solid #2e303a',
                            borderRadius: 6, color: 'white', fontSize: 14, outline: 'none'
                        }}
                    />
                    <button
                        onClick={save}
                        disabled={isSaving}
                        style={{
                            padding: '10px 16px', background: isSaving ? '#7a2bb8' : '#aa3bff',
                            color: 'white', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600,
                            cursor: isSaving ? 'wait' : 'pointer', whiteSpace: 'nowrap'
                        }}
                    >
                        {isSaving ? 'Сохранение...' : '💾 Сохранить'}
                    </button>
                </div>

                {/* Сортировка */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <button
                        onClick={() => setSortBy('date')}
                        style={{
                            padding: '6px 12px',
                            background: sortBy === 'date' ? '#aa3bff' : '#14151f',
                            color: 'white', border: '1px solid #2e303a', borderRadius: 6,
                            fontSize: 12, cursor: 'pointer'
                        }}
                    >
                        📅 По дате
                    </button>
                    <button
                        onClick={() => setSortBy('name')}
                        style={{
                            padding: '6px 12px',
                            background: sortBy === 'name' ? '#aa3bff' : '#14151f',
                            color: 'white', border: '1px solid #2e303a', borderRadius: 6,
                            fontSize: 12, cursor: 'pointer'
                        }}
                    >
                        🔤 По имени
                    </button>
                </div>

                {/* Список проектов */}
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
                    {isLoading ? (
                        <div style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>Загрузка проектов...</div>
                    ) : scenes.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>У вас пока нет сохраненных проектов</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {scenes.map((scene) => (
                                <div key={scene.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '12px', background: '#14151f', border: '1px solid #2e303a', borderRadius: 8
                                }}>
                                    {/* Превью */}
                                    {scene.screenshot ? (
                                        <img 
                                            src={scene.screenshot} 
                                            alt={scene.name}
                                            style={{
                                                width: 60, height: 60, objectFit: 'cover',
                                                borderRadius: 6, border: '1px solid #2e303a'
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: 60, height: 60, background: '#0a0b15',
                                            borderRadius: 6, display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', color: '#6b7280', fontSize: 24
                                        }}>
                                            🎨
                                        </div>
                                    )}

                                    {/* Информация */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {editingId === scene.id ? (
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                onBlur={() => handleRename(scene.id)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleRename(scene.id)}
                                                autoFocus
                                                style={{
                                                    width: '100%', padding: '4px 8px',
                                                    background: '#0a0b15', border: '1px solid #aa3bff',
                                                    borderRadius: 4, color: 'white', fontSize: 14, outline: 'none'
                                                }}
                                            />
                                        ) : (
                                            <div 
                                                onClick={() => { setEditingId(scene.id); setEditName(scene.name); }}
                                                style={{ 
                                                    color: '#e4e4e7', fontSize: 14, fontWeight: 600, 
                                                    marginBottom: 4, cursor: 'pointer',
                                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                                }}
                                                title="Нажмите для переименования"
                                            >
                                                {scene.name}
                                            </div>
                                        )}
                                        <div style={{ color: '#6b7280', fontSize: 11 }}>
                                            Обновлено: {new Date(scene.updatedAt).toLocaleString('ru-RU')}
                                        </div>
                                    </div>

                                    {/* Кнопки */}
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            onClick={() => load(scene)}
                                            disabled={actionLoading === scene.id}
                                            style={{
                                                padding: '6px 12px', background: '#2e303a', color: '#48FF73',
                                                border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600,
                                                cursor: actionLoading === scene.id ? 'wait' : 'pointer'
                                            }}
                                        >
                                            {actionLoading === scene.id ? '...' : '📂 Загрузить'}
                                        </button>
                                        <button
                                            onClick={() => deleteById(scene.id)}
                                            disabled={actionLoading === scene.id}
                                            style={{
                                                padding: '6px 12px', background: '#2e303a', color: '#FF5F56',
                                                border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600,
                                                cursor: actionLoading === scene.id ? 'wait' : 'pointer'
                                            }}
                                        >
                                            {actionLoading === scene.id ? '...' : '🗑️'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}