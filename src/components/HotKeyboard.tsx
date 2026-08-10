import { useEffect } from "react";
import { useSceneStore } from "../store/sceneStore";
import { useThree } from "@react-three/fiber";
import * as THREE from 'three'

export function calculateCenter(selectedIds: string[], objects: any[]) {
    const selectedObjects = objects.filter((obj) => selectedIds.includes(obj.id));
    if (selectedObjects.length === 0) return;

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const obj of selectedObjects) {
        minX = Math.min(minX, obj.position[0]);
        minY = Math.min(minY, obj.position[1]);
        minZ = Math.min(minZ, obj.position[2]);
        maxX = Math.max(maxX, obj.position[0]);
        maxY = Math.max(maxY, obj.position[1]);
        maxZ = Math.max(maxZ, obj.position[2]);
    }

    return {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2,
        z: (minZ + maxZ) / 2
    }
}

export function KeyboardShortcuts() {
    const controls = useThree((state) => state.controls) as unknown as {
        target: THREE.Vector3;
        update: () => void;
    };
    const { selectedIds, deleteObj, duplicateObject, setTransformMode, clearSelection, undo, redo, selectAll, objects } = useSceneStore();
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Игнорируем ввод текста в полях
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            const ctrlOrCmd = e.ctrlKey || e.metaKey;

            if (e.key.toLocaleLowerCase() === 'f' && selectedIds.length > 0 && controls){
                const center = calculateCenter(selectedIds, objects);
                if (center) {
                    controls.target.set(center.x, center.y, center.z)
                    controls.update();
                }
                return;
            }

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
                case 'w':'ц'; setTransformMode('translate'); return;
                case 'r':'к'; setTransformMode('rotate'); return;
                case 's':'ы'; setTransformMode('scale'); return;
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
    }, [selectedIds, deleteObj, duplicateObject, setTransformMode, clearSelection, undo, redo, selectAll, objects, controls]);

    return null;
}