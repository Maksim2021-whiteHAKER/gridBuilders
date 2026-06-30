// /src/store/sceneStore.ts
import type { TransformControlsMode } from "three/examples/jsm/Addons.js";
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
    transformMode: TransformControlsMode,
    addObj: (obj: SceneObject) => void,
    updateObj: (id: string, updates: Partial<SceneObject>) => void,
    deleteObj: (id: string) => void,
    clearScene: () => void,
    selectObject: (id: string | null) => void
    setTransformMode: (mode: TransformControlsMode) => void;
    duplicateObject: (id: string) => void;
}

export const useSceneStore = create<SceneStore>((set, get) => ({
    objects: [],
    selectedId: null,
    transformMode: 'translate',
  
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
    
    clearScene: () => set({objects: [], selectedId: null}),

    setTransformMode: (mode) => set({transformMode: mode}),

    duplicateObject: (id) => {
        const state = get()
        const obj = state.objects.find(o => o.id === id)
        if (obj) {
            const newObj: SceneObject = {
                ...obj,
                id: crypto.randomUUID(),
                position: [
                    obj.position[0] + 2,
                    obj.position[1],
                    obj.position[2]
                ]
            }
            set((state) => ({
                objects: [...state.objects, newObj],
                selectedId: newObj.id
            }))
        }
    }

}));