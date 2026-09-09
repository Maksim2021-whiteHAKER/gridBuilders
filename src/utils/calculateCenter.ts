// src/utils/calculateCenter.ts
import type { SceneObject } from "../store/sceneStore";

export function calculateCenter(selectedIds: string[], objects: SceneObject[]) {
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