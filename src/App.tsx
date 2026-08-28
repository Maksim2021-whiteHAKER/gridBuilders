// src/App.tsx
import { useEffect, useState } from 'react';
import { PropertiesPanel } from './components/PropertiesPanel.tsx';
import { Scene_GB } from './components/Scene.tsx';
import { ToolBar } from './components/ToolBar.tsx';
import { useDeviceType } from './hooks/useDeviceType.ts';
import { MobileTutorial } from './components/tutorials/MobileTutorial.tsx';
import { CameraControls } from './components/CameraControls.tsx';
import { useAuthStore } from './store/authStore';
import { AuthModal } from './components/AuthModal';
import { ProjectModal } from './components/ProjectModal.tsx';
import { FullscreenOrientation } from './components/FullscreenOrientation.tsx';
import { getPublicScene } from './lib/appwrite'; // ✅ Импортируем функцию
import { useSceneStore } from './store/sceneStore';

function App() {
    const deviceType = useDeviceType();
    const { checkUser, user, signOut, isLoading } = useAuthStore();
    const { setObjects } = useSceneStore(); // ✅ Для загрузки сцены
    
    const [showTutorial, setShowTutorial] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false); // ✅ Режим просмотра
    const [publicSceneName, setPublicSceneName] = useState('');
    
    const isSmall = deviceType === 'tablet' || deviceType === 'mobile';
    let localSt = "gridbuilders_tutorial_seen";

    useEffect(() => {
        // ✅ Проверяем URL на наличие ?view=SCENE_ID
        const params = new URLSearchParams(window.location.search);
        const viewId = params.get('view');

        if (viewId) {
            // Режим просмотра публичной сцены
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
                    // Перенаправляем на главную
                    window.history.replaceState({}, '', window.location.origin);
                    setIsReadOnly(false);
                });
        } else {
            // Обычный режим — проверяем авторизацию
            checkUser();
            
            if (isSmall) {
                const hasSeenTutorial = localStorage.getItem(localSt);
                if (!hasSeenTutorial) {
                    setShowTutorial(true);
                }
            }
        }
    }, [checkUser, isSmall, setObjects]);

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

    const closeTutorial = () => {
        localStorage.setItem(localSt, "true");
        setShowTutorial(false);
    };

    return (
        <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
            {/* Показываем модалки ТОЛЬКО если не режим просмотра */}
            {!isReadOnly && (
                <>
                    {showTutorial && <MobileTutorial onClose={closeTutorial} />}
                    {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
                    {showProjectModal && <ProjectModal onClose={() => setShowProjectModal(false)} />}
                    {isSmall && <FullscreenOrientation />}
                </>
            )}

            <Scene_GB />

            {/* Инструменты ТОЛЬКО если не режим просмотра */}
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

            {/* ✅ Индикатор режима просмотра */}
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
                    <button
                        onClick={() => window.location.href = '/'}
                        style={{
                            marginLeft: 12,
                            padding: '4px 12px',
                            background: '#aa3bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: 12,
                            cursor: 'pointer',
                            fontSize: 12
                        }}
                    >
                        ✕ Закрыть
                    </button>
                </div>
            )}
        </div>
    );
}

export default App;