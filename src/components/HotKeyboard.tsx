// src/components/HotKeyboard.tsx
import { useEffect } from "react";
import { useSceneStore } from "../store/sceneStore";

export function KeyboardShortcuts(){
    const { selectedIds, deleteObj, duplicateObject, setTransformMode, clearSelection, selectObject, undo, redo, selectAll, addToSelection } = useSceneStore()

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

            const ctrlOrCmd = e.ctrlKey || e.metaKey;

            if (ctrlOrCmd && e.key === 'z'){
                e.preventDefault()
                undo()
                return
            }           

            if (ctrlOrCmd && e.key === 'y'){
                e.preventDefault()
                redo()
                return
            }

            if (ctrlOrCmd && e.key === 'a'){
                e.preventDefault();
                selectAll();
                return
            }

            if (selectedIds.length === 0) return

            const primId = selectedIds[0]

            switch (e.key.toLowerCase()){
                case 'w': setTransformMode('translate'); break;
                case 'r': setTransformMode('rotate'); break;
                case 's': setTransformMode('scale'); break;
                case 'delete': deleteObj(primId); break;
                case 'd': e.preventDefault(); duplicateObject(primId); break
            }

            if (ctrlOrCmd){
                addToSelection(primId)
            }

            if (e.key === 'Escape'){
                clearSelection();
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedIds, deleteObj, duplicateObject, setTransformMode, selectObject])

    return null
}