// src/App.tsx
import { useEffect, useState } from 'react';
import { PropertiesPanel } from './components/PropertiesPanel.tsx';
import { Scene_GB } from './components/Scene.tsx';
import { ToolBar } from './components/ToolBar.tsx';
import { useDeviceType } from './hooks/useDeviceType.ts';
import { CameraControls } from './components/CameraControls.tsx';
import { useAuthStore } from './store/authStore.ts';
import { FullscreenOrientation } from './components/FullscreenOrientation.tsx';
import { getPublicScene, loadScene, makeRoomShared } from './lib/appwrite';
import { useSceneStore } from './store/sceneStore.ts';
import { lazy, Suspense } from 'react';
import { WebGLGuard } from './components/WebGLGuard.tsx';
import { SceneErrorBoundary } from './components/SceneErrorBoundary.tsx';

const AuthModal = lazy(() => import('./components/modals/AuthModal.tsx').then(module => ({default: module.AuthModal})))
const ProjectModal = lazy(() => import('./components/modals/ProjectModal.tsx').then(module => ({default: module.ProjectModal})))
const MobileTutorial = lazy(() => import('./components/tutorials/MobileTutorial.tsx').then(module => ({default: module.MobileTutorial})))

// ✅ Хук для туториала — выносит setState из основного тела компонента
function useTutorial(isSmall: boolean) {
    const [showTutorial, setShowTutorial] = useState(false);
    const localSt = "gridbuilders_tutorial_seen";

    useEffect(() => {
        if (!isSmall) return;
        const hasSeenTutorial = localStorage.getItem(localSt);
        if (!hasSeenTutorial) {
            requestAnimationFrame(() => setShowTutorial(true));
        }
    }, [isSmall, localSt]);

    const closeTutorial = () => {
        localStorage.setItem(localSt, "true");
        setShowTutorial(false);
    };

    return { showTutorial, closeTutorial };
}

// ✅ Хук для публичной сцены — выносит setIsReadOnly из основного useEffect
function usePublicScene() {
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [publicSceneName, setPublicSceneName] = useState('');
    const { setObjects } = useSceneStore();

    const params = new URLSearchParams(window.location.search);
    const viewId = params.get('view');
    const roomId = params.get('room') || params.get('komnataEdit');
    
    useEffect(() => {
        if (!viewId || roomId) return;
            getPublicScene(viewId)
                .then((scene) => {
                    setIsReadOnly(true);
                    setObjects(scene.data);
                    setPublicSceneName(scene.name);
                    console.log(`Загружена публичная сцена: ${scene.name}`);
                })
                .catch((err) => {
                    console.error(err);
                    alert("❌ Ошибка: Сцена не найдена или не является публичной.\n\n" + err.message);
                    window.history.replaceState({}, '', window.location.pathname);
                    setIsReadOnly(false);
                });
    }, [viewId, roomId, setObjects]);
    
    return { isReadOnly, publicSceneName };
}

function useRoomScene() {
    const { setObjects } = useSceneStore();
    const [roomId] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('room') || params.get('komnataEdit');        
    });

    useEffect(() => {
        if (!roomId) return;
        let cancelled = false;
        getPublicScene(roomId)
            .then((scene) => {
                if (cancelled) return
                setObjects(scene.data);
                useSceneStore.getState().startCollab(roomId);
            })
            .catch((err: unknown) => {
                if (cancelled) return
                console.error(err);
                alert('❌ Комната недоступна: ' + (err as Error).message);
                window.history.replaceState({}, '', window.location.pathname);
            });
        return () => { cancelled = true}
    }, [roomId, setObjects])

    return { roomId }
}

function App() {
    const deviceType = useDeviceType();
    const { checkUser, user, signOut, isLoading } = useAuthStore();
    const { setObjects } = useSceneStore();

    // ✅ Туториал и публичная сцена — через хуки, setState больше не в основном теле
    const { showTutorial, closeTutorial } = useTutorial(
        deviceType === 'tablet' || deviceType === 'mobile'
    );
    const { isReadOnly, publicSceneName } = usePublicScene();
    useRoomScene();

    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);

    const currentSceneId = useSceneStore((state) => state.currentSceneId);
    const isSmall = deviceType === 'tablet' || deviceType === 'mobile';

    const openCollabScene = async (sceneId: string) => {
        try {
            const scene = await loadScene(sceneId);
            setObjects(scene.data);
            useSceneStore.getState().startCollab(sceneId);
            window.history.replaceState({}, '', '?room=' + sceneId)
        } catch (error: unknown) {
            console.error("Ошибка загрузки сцены: " + error);
        }
    };

    const closeCollabScene = () => {
        useSceneStore.getState().stopCollab();
        setObjects([]);
        window.history.replaceState({}, '', window.location.pathname);
    };

    // ✅ Эффект авторизации — checkUser теперь в зависимостях
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('view')) return;

        checkUser();
    }, [checkUser]);

    useEffect(() => {
        document.getElementById('boot-loader')?.remove()
    }, []);

    if (isLoading && !isReadOnly) {
        return (
            <div style={{
                width: "100vw", height: "100vh", display: "flex",
                alignItems: "center", justifyContent: "center",
                background: "#0a0b15", color: "white", fontSize: 18
            }}>
                Загрузка Сетевых строителей...
            </div>
        );
    }

    return (
        <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
            {!isReadOnly && (
                <>
                    {showTutorial && (
                        <Suspense fallback={<div className="loading-spinner">Загрузка инструкции...</div>}>
                            <MobileTutorial onClose={closeTutorial} />
                        </Suspense>
                    )}
                    {showAuthModal && (
                        <Suspense fallback={<div className="loading-spinner">Загрузка...</div>}>
                            <AuthModal onClose={() => setShowAuthModal(false)} />
                        </Suspense>
                    )}
                    {showProjectModal && (
                        <Suspense fallback={<div className="loading-spinner">Загрузка проектов...</div>}>
                            <ProjectModal
                                onClose={() => setShowProjectModal(false)}
                                onOpenCollab={(sceneId) => {
                                    openCollabScene(sceneId);
                                    setShowProjectModal(false);
                                }}
                            />
                        </Suspense>
                    )}
                    {isSmall && <FullscreenOrientation />}
                </>
            )}

            <SceneErrorBoundary>
                <WebGLGuard>
                    <Scene_GB />
                </WebGLGuard>
            </SceneErrorBoundary>

            {!isReadOnly && currentSceneId && (
                <div className="collab-indicator">
                    <span className="ci-text">Совместный режим <span className='ci-icon'>🟢</span></span>
                    <button className="collab-indi-link" onClick={() => {
                        const owner = useAuthStore.getState().user;
                        if (!owner) { alert('Сначала войди в аккаунт'); return; }
                        makeRoomShared(currentSceneId, owner.$id)
                            .then(() => navigator.clipboard.writeText(
                                `${window.location.origin}${window.location.pathname}?room=${currentSceneId}`
                            ))
                            .then(() => alert('🔗 Ссылка-комната скопирована! Отправь её напарнику.'))
                            .catch((e: unknown) => alert('Ошибка: ' + (e as Error).message));
                    }}>🔗 Ссылка-комната</button>
                    <button className="collab-indi-close" onClick={closeCollabScene}>✕ Закрыть</button>
                </div>
            )}

            {!isReadOnly && (
                <>
                    <ToolBar
                        onAuthClick={() => setShowAuthModal(true)}
                        user={user}
                        onSignOut={signOut}
                        onOpenProjects={() => setShowProjectModal(true)}
                    />
                    <PropertiesPanel />
                    {isSmall && <CameraControls />}
                </>
            )}

            {isReadOnly && (
                <div style={{
                    position: 'fixed',
                    top: 20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(20, 21, 31, 0.95)',
                    color: '#48FF73',
                    padding: '12px 24px',
                    borderRadius: 20,
                    fontSize: 14,
                    fontWeight: 600,
                    border: '2px solid #48FF73',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                }}>
                    👁️ {publicSceneName || 'Публичная сцена'}
                    <button className="closeBtn" onClick={() => window.location.href = '/'}>
                        ✕ Закрыть
                    </button>
                </div>
            )}
        </div>
    );
}

export default App;