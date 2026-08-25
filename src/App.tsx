// src/App.tsx
import { PropertiesPanel } from './components/PropertiesPanel.tsx'
import { Scene_GB } from './components/Scene.tsx'
import { ToolBar } from './components/ToolBar.tsx'
import { useDeviceType } from './hooks/useDeviceType.ts'
import { useEffect, useState } from 'react'
import { MobileTutorial } from './components/tutorials/MobileTutorial.tsx'
import { CameraControls } from './components/CameraControls.tsx'
import { useAuthStore } from './store/authStore'
import { AuthModal } from './components/AuthModal'
import { ProjectModal } from './components/ProjectModal.tsx'

function App(){
    const deviceType = useDeviceType();
    const { checkUser, user, signOut, isLoading } = useAuthStore()
    const [showTutorial, setShowTutorial] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const isSmall = deviceType === 'tablet' || deviceType === 'mobile'

    let localSt = "gridbuilders_tutorial_seen"

    useEffect(() => {
        checkUser()
        if (isSmall){
            const hasSeenTutorial = localStorage.getItem(localSt)
            if (!hasSeenTutorial) {
                setShowTutorial(true);
            }
        }
    }, [isSmall, checkUser])

    if (isLoading) {
        return (
            <div 
                style={{
                    width: "100vw", height: "100vh", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    background: "#0a0b15", color: "white", fontSize: 18
                }}>
                    Загрузка Сетевых строителей...
            </div>
        )
    }

    const closeTutorial = () => {
        localStorage.setItem(localSt, "true")
        setShowTutorial(false)
    }

    return (
        <div style={{width: "100vw", height: "100vh", overflow: "hidden"}}>
            {showTutorial && <MobileTutorial onClose={closeTutorial}/>}
            {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)}/>}
            {showProjectModal && <ProjectModal onClose={() => setShowProjectModal(false)} />}
                <Scene_GB />
                <ToolBar 
                    onAuthClick={() => setShowAuthModal(true)}
                    user={user}
                    onSignOut={signOut}
                    onOpenProjects={() => setShowProjectModal(true) }
                     />
                <PropertiesPanel />
            {isSmall && (
                <>
                    <CameraControls />
                </>
            )}
        </div>

    )
}

export default App