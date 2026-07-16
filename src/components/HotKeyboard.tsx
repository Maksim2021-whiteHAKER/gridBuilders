// src/components/HotKeyboard.tsx
import { useEffect } from "react";
import { useSceneStore } from "../store/sceneStore";

export function KeyboardShortcuts(){
    const { selectedIds, deleteObj, duplicateObject, setTransformMode, aselectObject, selectObject, undo, redo, selectAll } = useSceneStore()

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

            if ((e.ctrlKey || e.metaKey) && e.key === 'z'){
                e.preventDefault()
                undo()
                return
            }           

            if ((e.ctrlKey || e.metaKey) && e.key === 'y'){
                e.preventDefault()
                redo()
                return
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'a'){
                e.preventDefault();
                selectAll();
                return
            }

            if (selectedIds.length === 0) return

            switch (e.key.toLowerCase()){
                case 'w': setTransformMode('translate'); break;
                case 'r': setTransformMode('rotate'); break;
                case 's': setTransformMode('scale'); break;
                case 'delete': deleteObj(selectedIds[0]); break;
                case 'd': e.preventDefault(); duplicateObject(selectedIds[0]); break
            }
            if (e.key === 'Escape'){
                aselectObject();
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedIds, deleteObj, duplicateObject, setTransformMode, selectObject])

    return null
}