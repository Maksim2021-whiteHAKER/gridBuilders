// /src/store/sceneStore.ts
import { create } from "zustand";

export interface SceneObject {
    id: string,
    type: 'box' | 'sphere' | 'cylinder' | 'cone' | 'tor' | 'pyramid',
    position: [number, number, number],
    rotation: [number, number, number],
    scale: [number, number, number],
    color: string
}

interface SceneStore {
    objects: SceneObject[],
    addObj: (obj: SceneObject) => void,
    updateObj: (id: string, updates: Partial<SceneObject>) => void,
    deleteObj: (id: string) => void,
    clearScene: () => void
}

export const useSceneStore = create<SceneStore>((set) => ({
    objects: [],
    
    addObj: (obj) => set((state) => ({
        objects: [...state.objects, obj]
    })),

    updateObj: (id, update) => set((state) => ({
        objects: state.objects.map((o) => 
            o.id === id ? {...o, ...update} : o
        )
    })),

    deleteObj: (id) => set((state) => ({
        objects: state.objects.filter((o) => o.id !== id)
    })),
    
    clearScene: () => set({objects: []}) 

}));