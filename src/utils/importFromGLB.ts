// src/utils/importFromGLB.ts
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/Addons.js'
import type { SceneObject } from '../store/sceneStore'
import { generatedId } from '../components/ToolBar';

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
                        if (child instanceof THREE.Mesh) {
                            const mesh = child as THREE.Mesh;
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
        } catch (e: any) { 
            onError("Ошибка при загрузке файла"+e.message)
        }
    };

    reader.onerror = () => {
        onError("Не удалось прочитать файл")
    }

    reader.readAsArrayBuffer(file)
}

function convertMeshToObject(mesh: THREE.Mesh): SceneObject | null {
    let type: SceneObject['type'] = 'box';
    const geometry = mesh.geometry;

    if (geometry.type === 'BoxGeometry') type = 'box';
    else if (geometry.type === 'SphereGeometry') type = 'sphere';
    else if (geometry.type === 'CylinderGeometry') type = 'cylinder';
    else if (geometry.type === 'ConeGeometry') {
        const coneGeom = geometry as THREE.ConeGeometry

        type = (coneGeom as any).radialSegments === 4 ? 'pyramid' : 'cone';
    }
    else if (geometry.type === 'TorusGeometry') type = 'tor';
    else type = 'box';

    const material = mesh.material as THREE.MeshStandardMaterial;
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