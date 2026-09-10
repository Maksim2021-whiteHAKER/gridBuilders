// src/utils/exportToGLB.ts
import { BoxGeometry, SphereGeometry, CylinderGeometry, ConeGeometry, TorusGeometry, Color, Mesh, BufferGeometry, MeshStandardMaterial, DoubleSide, CanvasTexture, TextureLoader, Scene, DirectionalLight, Material} from 'three'
import { GLTFExporter } from 'three/examples/jsm/Addons.js'
import type { SceneObject } from '../store/sceneStore';

export function createMeshFromData(objData: SceneObject): {mesh: Mesh | null, texturePromise?: Promise<void> } {
    let geometry: BufferGeometry;
    const size = 512;

    switch (objData.type) {
        case 'box': geometry = new BoxGeometry(1, 1, 1); break;
        case 'sphere': geometry = new SphereGeometry(0.5, 32, 32); break;
        case 'cylinder': geometry = new CylinderGeometry(0.5, 0.5, 1, 32 ); break;
        case 'cone': geometry = new ConeGeometry(0.5, 1, 10, 32); break;
        case 'tor': geometry = new TorusGeometry(0.5, 0.2, 16, 32); break;
        case 'pyramid': geometry = new ConeGeometry(0.5, 1, 4, 1); break;
        default: return {mesh: null} 
    }

    const hasTexture = objData.useGradient || objData.textureUrl;

    const baseColorHex = typeof objData.color === 'string'
        ? new Color(objData.color).getHex()
        : 0xbf8ff3;
    
    const material = new MeshStandardMaterial({ 
        color: hasTexture ? 0xffffff : baseColorHex,
        transparent: objData.opacity !== undefined && objData.opacity < 1,
        opacity: objData.opacity ?? 1.0,
        metalness: objData.metalness ?? 0.0, 
        roughness: objData.roughness ?? 0.5,
        wireframe: !!objData.wireframe,
        side: DoubleSide
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

            const colors = objData.gradientColors;
            objData.gradientColors.forEach((color: string, i: number) => {
                const stop = colors.length === 1 ? 0 : i / (colors.length - 1);
                grad.addColorStop(stop, color)
            });

            ctx.fillStyle = grad
            ctx.fillRect(0, 0, size, size)
        };

        material.map = new CanvasTexture(canvas);
        material.color.set(0xffffff); // Сбрасываем цвет в белый для текстур

    } else if (objData.textureUrl) {
        const url = objData.textureUrl;
        texturePromise = new Promise((resolve, reject) => {
            new TextureLoader().load(url, (loadedTex) => {
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

        material.map = new CanvasTexture(canvas)
    }

    const mesh = new Mesh(geometry, material);

    mesh.position.set(objData.position[0], objData.position[1], objData.position[2]);
    mesh.rotation.set(objData.rotation[0], objData.rotation[1], objData.rotation[2]);

    const [sx, sy, sz] = objData.scale
    mesh.scale.set(sx, sy, sz)

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return {mesh, texturePromise};
}

export async function exportToGLB(objects: SceneObject[], scene_name: string = "scene") {
    const tempScene = new Scene();
    const texturePromises: Promise<void>[] = [];

    for (const objData of objects) {
        const { mesh, texturePromise } = createMeshFromData(objData)
        if (mesh) {
            tempScene.add(mesh)
            if (texturePromise) {
                texturePromises.push(texturePromise)
            }
        }
    }

    await Promise.all(texturePromises).catch((err) => {
        console.error('Ошибка при загрузке текстур перед экспортом:', err);
        throw err;
    })

    const directionalLight = new DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    tempScene.add(directionalLight)

    const exporter = new GLTFExporter();

    return new Promise<void>((resolve, reject) => {       
        exporter.parse(
            tempScene, (result) => {
                try {
                    const blob = new Blob([result as unknown as ArrayBuffer], {type: 'application/octet-stream'});
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");   
                    link.href = url;
                    link.download = `${scene_name || 'gridbuilders_scene'}.glb`;
                    document.body.appendChild(link)
                    link.click();
                    document.body.removeChild(link)
                    URL.revokeObjectURL(url)
                    disposeScene(tempScene);
                    resolve()
                } catch (e) {
                    disposeScene(tempScene);
                    reject(e as Error)
                }
            }, (error) => {
                console.error("Ошибка экспорта в GLB: " + error)
                disposeScene(tempScene);
                reject(new Error("Произошла ошибка экспорта в GLB"))
            }, {
                binary: true,
                includeCustomExtensions: false,
                forceIndices: true,
                truncateDrawRange: true,
                animations: [],
                onlyVisible: true,
            }
        );
    })
}

function disposeScene(scene: Scene) {
    scene.traverse((obj) => {
        if (obj instanceof Mesh) {
            obj.geometry.dispose()
            const mat = obj.material
            if (mat instanceof MeshStandardMaterial) {
                if (mat.map) mat.map.dispose()
                mat.dispose()
            } else if (mat instanceof Material) {
                mat.dispose()
            }
        }
    })
}