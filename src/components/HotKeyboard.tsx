import { useEffect } from "react";
import { useSceneStore } from "../store/sceneStore";
import { useThree } from "@react-three/fiber";
import * as THREE from 'three'
import { useDeviceType } from "../hooks/useDeviceType";
import type { OrbitControls } from "three/examples/jsm/Addons.js";
import { calculateCenter } from "../utils/calculateCenter";

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
    }, [selectedIds, deleteObj, duplicateObject, setTransformMode, clearSelection, undo, redo, selectAll, objects, controls]);

    return null;
}

export function CameraFocusAuto() {
    const controls = useThree((state) => state.controls) as OrbitControls | null; 
    const { selectedIds, objects } = useSceneStore();
    const deviceType = useDeviceType();
    const isSmall = deviceType === 'tablet' || deviceType === 'mobile'

    useEffect(() => {
        if ( isSmall && selectedIds.length > 0 && objects.length > 0) {
            const timeoutId = setTimeout(() => {
                const center = calculateCenter(selectedIds, objects);
                 if (center) {
                    controls?.target.set(center.x, center.y, center.z);
                    controls?.update()
                 } else {
                    console.warn('[AutoFocus] Не удалось сфокусироваться: center или controls отсутствуют');
                }
            }, 200); // Увеличил задержку до 200мс для надёжности
            
            return () => clearTimeout(timeoutId);
        }
    }, [selectedIds, controls, isSmall, objects]);
    return null;
}