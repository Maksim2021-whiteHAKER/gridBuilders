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

type TransformMode = 'translate' | 'rotate' | 'scale'

interface SceneState {
    objects: SceneObject[],
    selectedId: string | null,
    transformMode: TransformMode
}

interface SceneStore extends SceneState {
    // История
    past: SceneState[],
    future: SceneState[],
    
    // Действия
    addObj: (obj: SceneObject) => void,
    updateObj: (id: string, updates: Partial<SceneObject>) => void,
    deleteObj: (id: string) => void,
    clearScene: () => void,
    selectObject: (id: string | null) => void,
    setTransformMode: (mode: TransformMode) => void,
    duplicateObject: (id: string) => void,
    
    // Undo/Redo
    undo: () => void,
    redo: () => void,
    canUndo: () => boolean,
    canRedo: () => boolean
}

// ✅ Внутренняя функция — не попадает в публичный API
function getCurrentState(state: SceneStore): SceneState {
    return {
        objects: [...state.objects],
        selectedId: state.selectedId,
        transformMode: state.transformMode
    }
}

export const useSceneStore = create<SceneStore>((set, get) => ({
    objects: [],
    selectedId: null,
    transformMode: 'translate',
    past: [],
    future: [],
  
    addObj: (obj) => {
        const state = get()
        set({
            past: [...state.past.slice(-49), getCurrentState(state)],
            future: [],
            objects: [...state.objects, obj],
            selectedId: obj.id
        })
    },

    updateObj: (id, update) => {
        const state = get()
        set({
            past: [...state.past.slice(-49), getCurrentState(state)],
            future: [],
            objects: state.objects.map((o) => 
                o.id === id ? {...o, ...update} : o
            )
        })
    },

    deleteObj: (id) => {
        const state = get()
        set({
            past: [...state.past.slice(-49), getCurrentState(state)],
            future: [],
            objects: state.objects.filter((o) => o.id !== id),
            selectedId: state.selectedId === id ? null : state.selectedId
        })
    },

    selectObject: (id) => set({selectedId: id}),
    
    clearScene: () => {
        const state = get()
        set({
            past: [...state.past.slice(-49), getCurrentState(state)],
            future: [],
            objects: [],
            selectedId: null
        })
    },

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
            set({
                past: [...state.past.slice(-49), getCurrentState(state)],
                future: [],
                objects: [...state.objects, newObj],
                selectedId: newObj.id
            })
        }
    },

    undo: () => {
        const state = get()
        if (state.past.length === 0) return
        
        const previousState = state.past[state.past.length - 1]
        const currentState = getCurrentState(state)
        
        set({
            ...previousState,
            past: state.past.slice(0, -1),
            future: [currentState, ...state.future]
        })
    },

    redo: () => {
        const state = get()
        if (state.future.length === 0) return
        
        const nextState = state.future[0]
        const currentState = getCurrentState(state)
        
        set({
            ...nextState,
            past: [...state.past, currentState],
            future: state.future.slice(1)
        })
    },

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0
}))