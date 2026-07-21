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
    selectedIds: string[],
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
    selectObject: (id: string ) => void,
    addToSelection: (id: string ) => void,
    clearSelection: () => void,
    setTransformMode: (mode: TransformMode) => void,
    duplicateObject: (id: string) => void,
    selectAll: () => void
        
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
        selectedIds: [...state.selectedIds],
        transformMode: state.transformMode
    }
}

export const useSceneStore = create<SceneStore>((set, get) => ({
    objects: [],
    selectedIds: [],
    transformMode: 'translate',
    past: [],
    future: [],
  
    addObj: (obj) => {
        const state = get()
        set({
            past: [...state.past.slice(-49), getCurrentState(state)],
            future: [],
            objects: [...state.objects, obj],
            selectedIds: [obj.id]
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
            selectedIds: state.selectedIds.filter((sid) => sid !== id)
        })
    },

    selectObject: (id) => set({selectedIds: [id]}),

    addToSelection: (id) => {
        const state = get()
        if (state.selectedIds.includes(id)){
            set ({selectedIds: state.selectedIds.filter(sid => sid !== id)})
        } else {
            set ({ selectedIds: [...state.selectedIds, id]})
        }
    },

    clearSelection: () => set({selectedIds: []}),
    
    clearScene: () => {
        const state = get()
        set({
            past: [...state.past.slice(-49), getCurrentState(state)],
            future: [],
            objects: [],
            selectedIds: []
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
                selectedIds: [newObj.id]
            })
        }
    },

    selectAll() {
        const state = get();
        const allIds = state.objects.map(obj => obj.id)
        set ({ selectedIds: allIds})
        
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