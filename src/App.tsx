// src/App.tsx
import { KeyboardShortcuts } from './components/HotKeyboard.tsx'
import { PropertiesPanel } from './components/PropertiesPanel.tsx'
import { Scene_GB } from './components/Scene.tsx'
import { ToolBar } from './components/ToolBar.tsx'

function App(){
    return(
        <>
            <Scene_GB />
            <ToolBar />
            <PropertiesPanel />
            <KeyboardShortcuts />
        </>

    )
}

export default App