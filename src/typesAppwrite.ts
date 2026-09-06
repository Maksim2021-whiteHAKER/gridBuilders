// src/typesAppwrite.ts
import type { SceneObject } from "./store/sceneStore";

export interface SceneListItem {
    id: string;
    name: string;
    data: SceneObject[];
    screenshot: string | null;
    createdAt: string;  
    updatedAt: string;
    isPublic: boolean;
}
  