// src/App.tsx
import { useEffect, useState } from 'react';
import { PropertiesPanel } from './components/PropertiesPanel.tsx';
import { Scene_GB } from './components/Scene.tsx';
import { ToolBar } from './components/ToolBar.tsx';
import { useDeviceType } from './hooks/useDeviceType.ts';
import { MobileTutorial } from './components/tutorials/MobileTutorial.tsx';
import { CameraControls } from './components/CameraControls.tsx';
import { useAuthStore } from './store/authStore';
import { AuthModal } from './components/modals/AuthModal.tsx';
import { ProjectModal } from './components/modals/ProjectModal.tsx';
import { FullscreenOrientation } from './components/FullscreenOrientation.tsx';
import { getPublicScene, loadScene } from './lib/appwrite';
import { useSceneStore } from './store/sceneStore';

// ✅ Хук для туториала — выносит setState из основного тела компонента
function useTutorial(isSmall: boolean) {
    const [showTutorial, setShowTutorial] = useState(false);
    const localSt = "gridbuilders_tutorial_seen";

    useEffect(() => {
        if (!isSmall) return;
        const hasSeenTutorial = localStorage.getItem(localSt);
        if (!hasSeenTutorial) {
            setShowTutorial(true);
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

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const viewId = params.get('view');

        if (viewId) {
            setIsReadOnly(true);
            getPublicScene(viewId)
                .then((scene) => {
                    setObjects(scene.data.objects || []);
                    setPublicSceneName(scene.name);
                    console.log(`Загружена публичная сцена: ${scene.name}`);
                })
                .catch((err) => {
                    console.error(err);
                    alert("❌ Ошибка: Сцена не найдена или не является публичной.\n\n" + err.message);
                    window.history.replaceState({}, '', window.location.origin);
                    setIsReadOnly(false);
                });
        }
    }, [setObjects]);

    return { isReadOnly, publicSceneName };
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

    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);

    const currentSceneId = useSceneStore((state) => state.currentSceneId);
    const isSmall = deviceType === 'tablet' || deviceType === 'mobile';

    const openCollabScene = async (sceneId: string) => {
        try {
            const scene = await loadScene(sceneId);
            setObjects(scene.data);
            useSceneStore.getState().setCurrentSceneId(sceneId);
            useSceneStore.getState().setOnline(true);
        } catch (error: unknown) {
            console.error("Ошибка загрузки сцены: " + error);
        }
    };

    const closeCollabScene = () => {
        useSceneStore.getState().setCurrentSceneId(null);
        useSceneStore.getState().setOnline(false);
        setObjects([]);
    };

    // ✅ Эффект авторизации — checkUser теперь в зависимостях
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('view')) return;

        checkUser();
    }, [checkUser]);

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
                    {showTutorial && <MobileTutorial onClose={closeTutorial} />}
                    {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
                    {showProjectModal && (
                        <ProjectModal
                            onClose={() => setShowProjectModal(false)}
                            onOpenCollab={(sceneId) => {
                                openCollabScene(sceneId);
                                setShowProjectModal(false);
                            }}
                        />
                    )}
                    {isSmall && <FullscreenOrientation />}
                </>
            )}

            <Scene_GB />

            {!isReadOnly && currentSceneId && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: 20, left: "50%",
                        transform: 'translateX(-50%)',
                        background: "rgba(72, 255, 115, 0.9)",
                        color: "#0a0b15", padding: "8px 16px",
                        borderRadius: 20,
                        fontSize: 13, fontWeight: 600,
                        zIndex: 1500,
                        display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                    Совместный режим 🟢
                    <button className="closeBtn" onClick={closeCollabScene}>
                        ✕ Закрыть
                    </button>
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