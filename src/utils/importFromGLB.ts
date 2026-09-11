// src/utils/importFromGLB.ts
import { GLTFLoader } from 'three/examples/jsm/Addons.js'
import type { SceneObject } from '../store/sceneStore'
import { generatedId } from './generatedId';
import { Mesh } from 'three/src/objects/Mesh.js'
import { MeshStandardMaterial } from 'three';

export function importFromGLB(file: File, onImport: (objects: SceneObject[]) => void, onError: (error: string) => void) {
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const loader = new GLTFLoader();
            
            loader.parse(
                arrayBuffer, '', (gtlf) => {
                    const objects: SceneObject[] = [];
                    
                    gtlf.scene.traverse((child) => {
                        if (child instanceof Mesh) {
                            const mesh = child as Mesh;
                            const obj = convertMeshToObject(mesh);
                            if (obj) {
                                objects.push(obj);
                            }                           
                        }
                    });

                    if (objects.length > 0) {
                        onImport(objects);
                    } else {
                        onError("в файле не найдено 3D объектов")
                    }
                }, (error) => {
                    console.error("Ошибка анализа GLB: "+error)
                    onError("Ошибка при чтении GLB файла: "+error.message)
                }
            )
        } catch (error: unknown) {
            if (error instanceof Error) onError("Ошибка при загрузке файла" + error.message)
        }
    };

    reader.onerror = () => {
        onError("Не удалось прочитать файл")
    }

    reader.readAsArrayBuffer(file)
}

function convertMeshToObject(mesh: Mesh): SceneObject | null {
    const geometry = mesh.geometry;
    let type: SceneObject['type'];


    switch (geometry.type) {
        case 'BoxGeometry': type = 'box'; break;
        case 'SphereGeometry': type = 'sphere'; break;
        case 'CylinderGeometry': type = 'cylinder'; break;
        case 'TorusGeometry': type = 'tor'; break;
        case 'ConeGeometry': {
            const isPyramid = (mesh.userData as { isPyramid?: boolean })?.isPyramid === true;
            type = isPyramid ? 'pyramid' : 'cone';
            break;
        }
        default: type = 'box'; break;
    }
  
    const material = mesh.material as MeshStandardMaterial;
    let color = "#bf8ff3";
    let opacity = 1.0;
    let metalness = 0.0;
    let roughness = 0.6;
    let wireframe = false;

    if (material) {
        if (material.color) color = "#" + material.color.getHexString();
        if (material.opacity !== undefined) opacity = material.opacity;
        if (material.metalness !== undefined) metalness = material.metalness;
        if (material.roughness !== undefined) roughness = material.roughness;
        if (material.wireframe !== undefined) wireframe = material.wireframe;
    }

    const position = mesh.position.toArray();
    const rotation = mesh.rotation.toArray();
    const scale = mesh.scale.toArray()

    return {
        id: generatedId(),
        type,
        position: [position[0], position[1], position[2]],
        rotation: [rotation[0], rotation[1], rotation[2]],
        scale: [scale[0], scale[1], scale[2]],
        color,
        opacity,
        metalness,
        roughness,
        wireframe,
        useGradient: false,
        gradientColors: ["#ffffff", "#000001"],
        gradientType: 'linear',
        gradientAngle: 0,
    };
}