// src/utils/importFromOBJ.ts
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/Addons.js'
import type { SceneObject } from '../store/sceneStore'
import { generatedId } from '../components/ToolBar';

export function importFromOBJ(
    file: File, 
    onImport: (objects: SceneObject[], rawGroup: THREE.Group) => void, // ✅ Добавили второй параметр
    onError: (error: string) => void
) {
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const text = e.target?.result as string;
            const loader = new OBJLoader();

            const group = loader.parse(text);
            const objects: SceneObject[] = [];
            
            group.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    const mesh = child as THREE.Mesh;
                    const obj: SceneObject = {
                        id: generatedId(),
                        type: 'box',
                        position: [mesh.position.x, mesh.position.y, mesh.position.z],
                        rotation: [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z],
                        scale: [mesh.scale.x, mesh.scale.y, mesh.scale.z],
                        color: '#bf8ff3',
                        opacity: 1.0,
                        metalness: 0.0,
                        roughness: 0.6,
                        wireframe: false,
                        useGradient: false,
                        gradientColors: ["#ffffff", "#000001"],
                        gradientType: 'linear',
                        gradientAngle: 0,
                    }
                    objects.push(obj)
                }                    
            });
            
            if (objects.length > 0) {
                onImport(objects, group); // ✅ Теперь типы совпадают
            } else {
                onError("В OBJ файле не найдено 3D-Моделей")
            }
        } catch (e: any) { 
            onError("Ошибка при чтении OBJ файла: " + e.message) 
        }
    };

    reader.onerror = () => { 
        onError("Не удалось прочитать файл") 
    }

    reader.readAsText(file)
}