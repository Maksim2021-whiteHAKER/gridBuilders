// src/utils/exportToGLB.ts
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/Addons.js'

export function exportToGLB(objects: any, scene_name: string = "scene") {
    const tempScene = new THREE.Scene();

    objects.forEach((objData: any) => {
        const mesh = createMeshFromData(objData)
        if (mesh) {
            tempScene.add(mesh)
        }
    });

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;

    tempScene.add(directionalLight)

    const exporter = new GLTFExporter();

    exporter.parse(
        tempScene, (result) => {
            const blob = new Blob([result as ArrayBuffer], {type: 'application/octet-stream'});
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `${scene_name || 'gridbuilders_scene'}.glb`;
            document.body.appendChild(link)
            link.click();
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        }, (error) => {
            console.error("Ошибка экспорта в GLB: "+error)
            alert("Произошла ошибка экспорта в GLB")
        }, {
            binary: true,
            includeCustomExtensions: false,
            forceIndices: true,
            truncateDrawRange: true,
            animations: [],
            onlyVisible: true,
        }
    );
}

function createMeshFromData(objData: any): THREE.Mesh | null {
    let geometry: THREE.BufferGeometry | null = null

    switch (objData.type) {
        case 'box': geometry = new THREE.BoxGeometry(1, 1, 1); break;
        case 'sphere': geometry = new THREE.SphereGeometry(0.5, 32, 32); break;
        case 'cylinder': geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32 ); break;
        case 'cone': geometry = new THREE.ConeGeometry(0.5, 1, 10, 32); break;
        case 'tor': geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 32); break;
        case 'pyramid': geometry = new THREE.ConeGeometry(0.5, 1, 4, 1); break;
        default: return null
    }

    const material = new THREE.MeshStandardMaterial({ 
        color: objData.color || '#bf8ff3',
        transparent: objData.opacity !== undefined && objData.opacity < 1,
        opacity: objData.opacity !== undefined ? objData.opacity : 1.0,
        metalness: objData.metalness || 0.0, roughness: objData.roughness || 0.5,
        wireframe: objData.wireframe || false,
        side: THREE.DoubleSide
    })

    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(objData.position[0], objData.position[1], objData.position[2]);
    mesh.rotation.set(objData.rotation[0], objData.rotation[1], objData.rotation[2]);

    const [sx, sy, sz] = objData.scale
    mesh.scale.set(sx, sy, sz)

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
}