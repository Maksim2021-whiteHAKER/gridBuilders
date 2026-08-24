// src/App.tsx
import { PropertiesPanel } from './components/PropertiesPanel.tsx'
import { Scene_GB } from './components/Scene.tsx'
import { ToolBar } from './components/ToolBar.tsx'
import { useDeviceType } from './hooks/useDeviceType.ts'
import { useEffect, useState } from 'react'
import { MobileTutorial } from './components/tutorials/MobileTutorial.tsx'
import { CameraControls } from './components/CameraControls.tsx'

function App(){
    const deviceType = useDeviceType();
    const [showTutorial, setShowTutorial] = useState(false);
    const isSmall = deviceType === 'tablet' || deviceType === 'mobile'

    let localSt = "gridbuilders_tutorial_seen"

    useEffect(() => {
        if (isSmall){
            const hasSeenTutorial = localStorage.getItem(localSt)
            if (!hasSeenTutorial) {
                setShowTutorial(true);
            }
        }
    }, [isSmall])

    const closeTutorial = () => {
        localStorage.setItem(localSt, "true")
        setShowTutorial(false)
    }

    return (
        <div style={{width: "100vw", height: "100vh", overflow: "hidden"}}>
            {showTutorial && <MobileTutorial onClose={closeTutorial}/>}
                <Scene_GB />
                <ToolBar />
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