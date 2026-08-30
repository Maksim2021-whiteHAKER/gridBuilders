// src/utils/exportToGLB.ts
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/Addons.js'

export async function exportToGLB(objects: any, scene_name: string = "scene") {
    const tempScene = new THREE.Scene();
    const texturePromises: Promise<void>[] = [];

    objects.forEach((objData: any) => {
        const { mesh, texturePromise } = createMeshFromData(objData)
        if (mesh) {
            tempScene.add(mesh)
            if (texturePromise) {
                texturePromises.push(texturePromise)
            }
        }
    });

    await Promise.all(texturePromises)

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

    tempScene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose()
            if (obj.material instanceof THREE.Material) {
                obj.material.dispose();
            }
        }
    })
}

function createMeshFromData(objData: any): {mesh: THREE.Mesh | null, texturePromise?: Promise<void> } {
    let geometry: THREE.BufferGeometry | null = null
    const size = 512;

    switch (objData.type) {
        case 'box': geometry = new THREE.BoxGeometry(1, 1, 1); break;
        case 'sphere': geometry = new THREE.SphereGeometry(0.5, 32, 32); break;
        case 'cylinder': geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32 ); break;
        case 'cone': geometry = new THREE.ConeGeometry(0.5, 1, 10, 32); break;
        case 'tor': geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 32); break;
        case 'pyramid': geometry = new THREE.ConeGeometry(0.5, 1, 4, 1); break;
        default: return {mesh: null}
    }

    const hasTexture = objData.useGradient || objData.textureUrl;
    
    const material = new THREE.MeshStandardMaterial({ 
        color: hasTexture ? 0xffffff : (objData.color || '#bf8ff3'),
        transparent: objData.opacity !== undefined && objData.opacity < 1,
        opacity: objData.opacity !== undefined ? objData.opacity : 1.0,
        metalness: objData.metalness || 0.0, 
        roughness: objData.roughness || 0.5,
        wireframe: objData.wireframe || false,
        side: THREE.DoubleSide
    });

    let texturePromise: Promise<void> | undefined;

    if (objData.useGradient && objData.gradientColors && objData.gradientColors.length >= 2) {
        const canvas = document.createElement("canvas"); // Исправлено: создаем новый canvas
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d');

        if (ctx) {
            let grad: CanvasGradient;
            if (objData.gradientType === "radial") {
                grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
            } else {
                const rad = (objData.gradientAngle || 0) * Math.PI / 180
                grad = ctx.createLinearGradient(
                    256 - Math.cos(rad) * 256, 256 - Math.sin(rad) * 256,
                    256 + Math.cos(rad) * 256, 256 + Math.sin(rad) * 256
                );
            }

            objData.gradientColors.forEach((color: string, i: number) => {
                const stop = objData.gradientColors.length === 1 ? 0 : i / (objData.gradientColors.length - 1);
                grad.addColorStop(stop, color)
            });

            ctx.fillStyle = grad
            ctx.fillRect(0, 0, size, size)
        };

        material.map = new THREE.CanvasTexture(canvas);
        material.color.set(0xffffff); // Сбрасываем цвет в белый для текстур

    } else if (objData.textureUrl) {
        texturePromise = new Promise((resolve, reject) => {
            new THREE.TextureLoader().load(objData.textureUrl, (loadedTex) => {
                material.map = loadedTex
                material.color.set(0xffffff); // Сбрасываем цвет в белый для текстур
                resolve()
            }, undefined, (error) => {
                console.error("Ошибка загрузки текстуры: "+ error);
                reject(error)
            });
        })        
    } else if (objData.color) {
        const canvas = document.createElement("canvas"); // Исправлено: создаем новый canvas
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d');

        if (ctx) {
            ctx.fillStyle = objData.color
            ctx.fillRect(0, 0, size, size)
        }

        material.map = new THREE.CanvasTexture(canvas)
    }

    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(objData.position[0], objData.position[1], objData.position[2]);
    mesh.rotation.set(objData.rotation[0], objData.rotation[1], objData.rotation[2]);

    const [sx, sy, sz] = objData.scale
    mesh.scale.set(sx, sy, sz)

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return {mesh, texturePromise};
}