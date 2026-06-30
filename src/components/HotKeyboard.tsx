// src/components/HotKeyboard.tsx
import { useEffect } from "react";
import { useSceneStore } from "../store/sceneStore";

export function KeyboardShortcuts(){
    const { selectedId, deleteObj, duplicateObject, setTransformMode, selectObject } = useSceneStore()

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
            if (!selectedId) return

            switch (e.key.toLowerCase()){
                case 'w': setTransformMode('translate'); break;
                case 'r': setTransformMode('rotate'); break;
                case 's': setTransformMode('scale'); break;
                case 'delete': deleteObj(selectedId); break;
                case 'd': e.preventDefault(); duplicateObject(selectedId); break
            }
            if (e.key === 'Escape'){
                selectObject(null);
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedId, deleteObj, duplicateObject, setTransformMode, selectObject])

    return null
}