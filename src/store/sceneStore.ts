// /src/store/sceneStore.ts
import { create } from "zustand";
import { version } from "../../package.json"
import { exportToRoblox } from "../utils/exportToRBXM";
import { exportToGLB } from "../utils/exportToGLB";
import { importFromGLB as importGLBUtils } from "../utils/importFromGLB";
import { importFromOBJ as importOBJUtils } from "../utils/importFromOBJ";
import * as THREE from 'three'

export interface SceneObject {
    id: string,
    type: 'box' | 'sphere' | 'cylinder' | 'cone' | 'tor' | 'pyramid' | 'text',
    position: [number, number, number],
    rotation: [number, number, number],
    scale: [number, number, number],
    color: string,
    opacity: number,
    metalness: number,
    roughness: number,
    wireframe: boolean,
    textureUrl?: string,
    text?: string,
    fontSize?: number,
    maxWidth?: number,
    textAllign?: 'left' | 'center' | 'right'
}

type TransformMode = 'translate' | 'rotate' | 'scale'

interface SceneState {
    objects: SceneObject[],
    selectedIds: string[],
    transformMode: TransformMode,
    snapEnabled: boolean
    gridSize: number
}

interface SceneStore extends SceneState {
    // История
    past: SceneState[],
    future: SceneState[],
    controls: any,
    camera: THREE.Camera | null,
    lastSaved: number | null,
    rawMeshes: THREE.Object3D[],

    setCamera: (camera: THREE.Camera | null) => void
    setControls: (controls: any) => void,   
    
    // Действия
    addObj: (obj: SceneObject) => void,
    updateObj: (id: string, updates: Partial<SceneObject>, skipHistory?: boolean) => void,
    setObjects: (newObjects: any[]) => void,
    deleteObj: (id: string) => void,
    clearScene: () => void,
    selectObject: (id: string ) => void,
    addToSelection: (id: string ) => void,
    clearSelection: () => void,
    setTransformMode: (mode: TransformMode) => void,
    duplicateObject: (id: string) => void,
    selectAll: () => void,

    toggleSnap: () => void,
    setGridSize: (size: number) => void,

    // Сохранение\загрузка
    saveToLocalStorage: () => void,
    loadFromLocalStorage: () => void,
    exportJSON: () => void,
    exportRBXM: () => void,
    exportGLB: () => void,
    importJSON: (jsonString: string) => boolean,
    importGLB: (file: File, callback: (success: boolean) => void) => void; 
    importOBJ: (file: File, callback: (success: boolean) => void) => void; 
        
    // Undo/Redo
    undo: () => void,
    redo: () => void,
    canUndo: () => boolean,
    canRedo: () => boolean
}

const loadInitialState = (): Partial<SceneState> => {
    try {
        const saved = localStorage.getItem('gridbuilders_scene');
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                objects: parsed.objects || [],
                selectedIds: [],
                transformMode: parsed.transformMode || 'translate',
                snapEnabled: parsed.snapEnabled !== undefined ? parsed.snapEnabled : true,
                gridSize: parsed.gridSize || 1.0,
            };
        } 
    } catch (e) {
        console.error("Провалена загрузка из Локального хранилища: "+e)
    }
    return {};
}

const initialState = loadInitialState();

// ✅ Внутренняя функция — не попадает в публичный API
function getCurrentState(state: SceneStore): SceneState {
    return {
        objects: [...state.objects],
        selectedIds: [...state.selectedIds],
        transformMode: state.transformMode,
        snapEnabled: state.snapEnabled,
        gridSize: state.gridSize
    }
}

export const useSceneStore = create<SceneStore>((set, get) => ({
    objects: initialState.objects || [],
    selectedIds: [],
    transformMode: initialState.transformMode || 'translate',
    snapEnabled: initialState.snapEnabled !== undefined ? initialState.snapEnabled : true,
    gridSize: initialState.gridSize || 1.0,
    past: [],
    future: [],   
    lastSaved: null,
    rawMeshes: [],

    controls: null,
    camera: null,
    setCamera: (camera) => set({ camera }),
    setControls: (controls) => set({ controls }),
  
    addObj: (obj) => {
        const state = get()
        set({
            past: [...state.past.slice(-49), getCurrentState(state)],
            future: [],
            objects: [...state.objects, {
                ...obj,
                opacity: 1.0,
                metalness: 0.0,
                roughness: 0.5,
                wireframe: false,
                textureUrl: undefined,
                text: obj.type === 'text' ? (obj.text || "Текст") : undefined,
                fontSize: obj.type === 'text' ? (obj.fontSize || 0.5) : undefined,
                maxWidth: obj.type === 'text' ? 12 : undefined,
                textAllign: obj.type === 'text' ? 'center' : undefined
            }],
            selectedIds: [obj.id]
        })
        get().saveToLocalStorage();
    },

    setObjects: (newObjects: any[]) => set({
        objects: newObjects,
        selectedIds: [],
        past: [],
        future: []
    }),

    updateObj: (id, update, skipHistory = false) => {
        const state = get()
        if (skipHistory){
            set({
                objects: state.objects.map((o) => 
                    o.id === id ? {...o, ...update} : o
                )
            })
        } else {
            set({
                past: [...state.past.slice(-49), getCurrentState(state)],
                future: [],
                objects: state.objects.map((o) => 
                    o.id === id ? {...o, ...update} : o
                )
            })
        }
        get().saveToLocalStorage();
    },

    deleteObj: (id) => {
        const state = get()
        set({
            past: [...state.past.slice(-49), getCurrentState(state)],
            future: [],
            objects: state.objects.filter((o) => o.id !== id),
            selectedIds: state.selectedIds.filter((sid) => sid !== id)
        })
        get().saveToLocalStorage();
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
        get().saveToLocalStorage();
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
            get().saveToLocalStorage();
        }
    },

    selectAll() {
        const state = get();
        const allIds = state.objects.map(obj => obj.id)
        set ({ selectedIds: allIds})
        
    },

    toggleSnap() {
       const state = get();
       set({snapEnabled: !state.snapEnabled}) 
       get().saveToLocalStorage();
    },

    setGridSize: (size: number) => {
        set({gridSize: size})
        get().saveToLocalStorage();
    },

    //сохран и загруз
    saveToLocalStorage: () => {
        const state = get();
        const sceneData = {
           objects: state.objects,
           transformMode: state.transformMode,
           snapEnabled: state.snapEnabled,
           gridSize: state.gridSize,
           savedAt: new Date().toISOString()
        };
        try {
            localStorage.setItem('gridbuilders_scene', JSON.stringify(sceneData))
            set({ lastSaved: Date.now() })
        } catch (e) {
            console.error("Провал сохранения в Локальное хранилище: " + e);
        }
    },

    loadFromLocalStorage: () => {
        try {
            const saved = localStorage.getItem('gridbuilders_scene');
            if (saved) {
                const parsed = JSON.parse(saved);
                set({
                    objects: parsed.objects || [],
                    selectedIds: [],
                    transformMode: parsed.transformMode || 'translate',
                    snapEnabled: parsed.snapEnabled !== undefined ? parsed.snapEnabled : true,
                    gridSize: parsed.gridSize || 1.0,
                    past: [],
                    future: [],
                });
            } 
        } catch (e) {
            console.error("Провалена загрузка из Локального хранилища: " + e)
        }
    },

    exportJSON: () => {
        const state = get();
        const sceneData = {
            version: version,
            exportedAt: new Date().toISOString(), 
            objects: state.objects,
            transformMode: state.transformMode,
            snapEnabled: state.snapEnabled,
            gridSize: state.gridSize
        }
        const json = JSON.stringify(sceneData, null, 2);
        const blob = new Blob([json], {type: 'application/json'});
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `gridbuilders_scene_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url)
    },

    exportRBXM: () => {
        const state = get();
        exportToRoblox(state.objects);
    },

    exportGLB: () => {
        const state = get()
        exportToGLB(state.objects, `gridbuilders_scene_${Date.now()}`)
    },

    importJSON: (jsonString: string) => {
        try {
            const parsed = JSON.parse(jsonString);
            if (!parsed.objects || !Array.isArray(parsed.objects)){
                throw new Error("Неверный формат сцены");
            }
            const state = get();
            set({
                past: [...state.past.slice(-49), getCurrentState(state)],
                future: [],
                objects: parsed.objects,
                selectedIds: [],
                transformMode: parsed.transformMode || 'translate',
                snapEnabled: parsed.snapEnabled !== undefined ? parsed.snapEnabled : true,
                gridSize: parsed.gridSize || 1.0,            
            })
            get().saveToLocalStorage();
            return true;
        } catch (e) {
            console.error("Провал JSON импорта: " + e);
            return false;
        }
    },    
    
    importGLB: (file: File, callback: (success: boolean) => void) => {
        const state = get();
        importGLBUtils(
            file, (objects) => {
                set({
                    past: [...state.past.slice(-49), getCurrentState(state)],
                    future: [],
                    objects: [...state.objects, ...objects],
                    selectedIds: objects.length > 0 ? [objects[0].id] : [],                   
                })
                get().saveToLocalStorage();
                callback(true);
            }, (error) => {
                console.error(error);
                alert(error)
                callback(false)
            }
        )
    },

    importOBJ: (file: File, callback: (success: boolean) => void) => {
        const state = get();
        importOBJUtils(
            file, (objects, rawGroup) => {
                set({
                    past: [...state.past.slice(-49), getCurrentState(state)],
                    future: [],
                    objects: [...state.objects, ...objects],
                    rawMeshes: [...state.rawMeshes, rawGroup],
                    selectedIds: objects.length > 0 ? [objects[0].id] : [],                   
                })
                get().saveToLocalStorage();
                callback(true);
            }, (error) => {
                console.error(error);
                alert(error)
                callback(false)
            }
        )
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
        get().saveToLocalStorage();
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
        get().saveToLocalStorage();
    },

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0
}))