import { useEffect } from "react";
import { useSceneStore } from "../store/sceneStore";

export function KeyboardShortcuts() {
    const { 
        selectedIds, deleteObj, duplicateObject, setTransformMode, clearSelection, undo, redo, selectAll } = useSceneStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Игнорируем ввод текста в полях
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            const ctrlOrCmd = e.ctrlKey || e.metaKey;

            // 1. Глобальные хоткеи (работают всегда)
            if (ctrlOrCmd && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                undo();
                return;
            }           

            if (ctrlOrCmd && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                redo();
                return;
            }

            if (ctrlOrCmd && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                selectAll();
                return;
            }

            // 2. Хоткеи режимов трансформации (работают всегда, даже без выделения)
            switch (e.key.toLowerCase()) {
                case 'w': setTransformMode('translate'); return;
                case 'r': setTransformMode('rotate'); return;
                case 's': setTransformMode('scale'); return;
            }

            // 3. Хоткеи, требующие выделения
            if (selectedIds.length === 0) return;

            switch (e.key.toLowerCase()) {
                case 'delete':
                case 'backspace':
                    e.preventDefault(); // Защита от возврата назад в браузере
                    // ✅ Удаляем ВСЕ выделенные объекты
                    selectedIds.forEach(id => deleteObj(id));
                    break;
                    
                case 'd':
                    if (ctrlOrCmd) {
                        e.preventDefault();
                        // ✅ Дублируем ВСЕ выделенные объекты
                        // (Примечание: убедись, что твоя функция duplicateObject в сторе корректно работает в цикле)
                        selectedIds.forEach(id => duplicateObject(id));
                    }
                    break;
            }

            // 4. Снятие выделения
            if (e.key === 'Escape') {
                clearSelection();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        
        return () => { 
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedIds, deleteObj, duplicateObject, setTransformMode, clearSelection, undo, redo, selectAll]);

    return null;
}