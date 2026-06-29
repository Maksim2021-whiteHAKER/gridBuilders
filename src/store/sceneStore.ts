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
    selectedId: string | null,
    addObj: (obj: SceneObject) => void,
    updateObj: (id: string, updates: Partial<SceneObject>) => void,
    deleteObj: (id: string) => void,
    clearScene: () => void,
    selectObject: (id: string | null) => void
}

export const useSceneStore = create<SceneStore>((set) => ({
    objects: [],
    selectedId: null,
  
    addObj: (obj) => set((state) => ({
        objects: [...state.objects, obj],
        selectedId: obj.id
    })),

    updateObj: (id, update) => set((state) => ({
        objects: state.objects.map((o) => 
            o.id === id ? {...o, ...update} : o
        )
    })),

    deleteObj: (id) => set((state) => ({
        objects: state.objects.filter((o) => o.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId
    })),

    selectObject: (id) => set({selectedId: id}),
    
    clearScene: () => set({objects: [], selectedId: null})

}));