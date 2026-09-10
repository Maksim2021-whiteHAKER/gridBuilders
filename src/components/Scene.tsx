// /src/components/Scene.tsx
import { useEffect, useMemo, useState } from 'react'
import { Canvas, useLoader, useThree } from '@react-three/fiber'
import { OrbitControls as OrbitControlsDrei, Grid, Line, TransformControls, Outlines, Text as Text3D } from '@react-three/drei'
import { COLORS } from '../constants/color.ts'
import { useSceneStore, type SceneObject } from '../store/sceneStore.ts'
import { GroupTransformControls } from './GroupTransformControls.tsx'
import { CameraFocusAuto, KeyboardShortcuts } from './HotKeyboard.tsx'
import { MarqueeSelection } from './MarqueeSelection.tsx'
import { createGradientTexture } from '../utils/createGradientTexture.ts'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { subscribeToSceneUpdates } from '../lib/realtime.ts'
import { Mesh, TextureLoader, Texture, Vector2, Raycaster } from 'three'

function CameraSaver() {
    const { camera } = useThree();
    const setCamera = useSceneStore((state) => state.setCamera)

    useEffect(() => {
        setCamera(camera)
    }, [camera, setCamera])

    return null
}

function ControlsSaver() {
    const {controls} = useThree();
    const setControls = useSceneStore((state) => state.setControls)

    useEffect(() => {
        if (controls) {
            setControls(controls as unknown as OrbitControls) 
        }
    }, [controls, setControls])

    return null
}

function getTextureUrl(obj: SceneObject): string | undefined {
    if (obj.useGradient && obj.gradientColors && obj.gradientColors.length >= 2) {
        return createGradientTexture({
            colors: obj.gradientColors,
            type: obj.gradientType || 'linear',
            angle: obj.gradientAngle || 0,
            size: 512,
        })
    } else if (obj.textureUrl && !obj.useGradient) {
        return obj.textureUrl;
    }
    return undefined
}

function TexturedMaterial({obj, isSelected, textureUrl} : {obj: SceneObject, isSelected: boolean, textureUrl: string}){
    // useLoader автоматически кэширует текстуры по URL. 
    // Благодаря useMemo выше, URL стабилен, и кэш работает идеально.
    const texture = useLoader(TextureLoader, textureUrl) as Texture;
    const finalColor = obj.useGradient ? "#ffffff" : obj.color;

    return (
        <>
            <meshStandardMaterial
                color={finalColor} map={texture}
                transparent={obj.opacity < 1} opacity={obj.opacity}
                metalness={obj.metalness} roughness={obj.roughness}
                wireframe={obj.wireframe}
                depthWrite={obj.opacity === 1}
                alphaTest={obj.opacity < 1 ? 0.01 : 0}
            />
            {isSelected && <Outlines color="#aa3bff" thickness={2} angle={0.6} />}
        </>
    )
}

function PlainMaterial({obj, isSelected}: {obj: SceneObject, isSelected: boolean}) {
    return (
        <>
            <meshStandardMaterial
                color={obj.color}
                transparent={obj.opacity < 1} opacity={obj.opacity}
                metalness={obj.metalness} roughness={obj.roughness}
                wireframe={obj.wireframe}
                depthWrite={obj.opacity === 1}
                alphaTest={obj.opacity < 1 ? 0.01 : 0}
            />
            {isSelected && <Outlines color="#aa3bff" thickness={2} angle={0.6} />}
        </>
    )
}

function ObjectMaterial({obj, isSelected } : {obj: SceneObject, isSelected:boolean}) {
    // Мемоизируем вычисление URL. Функция вызовется заново ТОЛЬКО если изменятся эти зависимости.
    // Это предотвращает постоянную перегенерацию base64 строки при ререндерах сцены.
    const textureUrl = useMemo(() => {
        return getTextureUrl(obj);
    }, [
        obj.useGradient,
        obj.gradientColors,
        obj.gradientType,
        obj.gradientAngle,
        obj.textureUrl
    ]);

    if (textureUrl) {
        return <TexturedMaterial obj={obj} isSelected={isSelected} textureUrl={textureUrl} />;
    }
    return <PlainMaterial obj={obj} isSelected={isSelected} />;
}

function CreateObject({obj, isSelected, setMesh}:{obj: SceneObject, isSelected:boolean, setMesh: (mesh: Mesh | null) => void}){
    if (obj.type === 'text') {
        return (
            <Text3D ref={setMesh} position={obj.position} rotation={obj.rotation} scale={obj.scale} 
            fontSize={obj.fontSize || 0.5} color={obj.color} anchorX="center" anchorY="middle" 
            onClick={(e) => {
                e.stopPropagation()
                const isctrlOrCmd = e.nativeEvent.ctrlKey || e.nativeEvent.metaKey;
                const store = useSceneStore.getState();
                if (isctrlOrCmd) store.addToSelection(obj.id);
                else store.selectObject(obj.id)
            }}> {obj.text || 'Текст'}
            </Text3D>
        )
    }

    return(
        <mesh key={obj.id} ref={setMesh} position={obj.position} rotation={obj.rotation} scale={obj.scale} castShadow receiveShadow 
            onClick={(e) => {
            e.stopPropagation()
            const isCtrlOrCmd = e.nativeEvent.ctrlKey || e.nativeEvent.metaKey;
            const store = useSceneStore.getState();
            if (isCtrlOrCmd){
                store.addToSelection(obj.id)                
            } else {
                store.selectObject(obj.id)
            }
        }}>
            {obj.type === 'box' && <boxGeometry args={[1, 1, 1]} />}
            {obj.type === 'sphere' && <sphereGeometry args={[0.5, 32, 32]} />}
            {obj.type === 'cylinder' && <cylinderGeometry args={[0.5, 0.5, 1, 32]} />}
            {obj.type === 'cone' && <coneGeometry args={[0.5, 1, 10, 32]} />}
            {obj.type === 'tor' && <torusGeometry args={[0.5, 0.2, 16, 32]} />}
            {obj.type === 'pyramid' && <coneGeometry args={[0.5, 1, 4, 1]} />}
            
            <ObjectMaterial obj={obj} isSelected={isSelected} />
        </mesh>
    )
}

function SceneObject({obj, isSelected}:{obj: SceneObject, isSelected:boolean}){
    const [mesh, setMesh] = useState<Mesh | null>(null);
    const { updateObj, transformMode, selectedIds, snapEnabled, gridSize } = useSceneStore();
    const [isTransforming, setIsTransforming] = useState(false);

    useEffect(() => {
        if (mesh && !isTransforming ) {
            mesh.position.set(obj.position[0], obj.position[1], obj.position[2]);
            mesh.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
            mesh.scale.set(obj.scale[0], obj.scale[1], obj.scale[2]);
        }
    }, [obj.position, obj.rotation, obj.scale, isTransforming, mesh]);

    const handleObjectUpdateEnd = () => {
        if (mesh){
            updateObj(obj.id, {
                position: [snapEnabled ? Math.round(mesh.position.x / gridSize) * gridSize : mesh.position.x, snapEnabled ? Math.round(mesh.position.y / gridSize) * gridSize : mesh.position.y, snapEnabled ? Math.round(mesh.position.z / gridSize) * gridSize : mesh.position.z],
                rotation: [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z],
                scale: [mesh.scale.x, mesh.scale.y, mesh.scale.z]
            })
        }
        setIsTransforming(false)
    }

    return(
        <>
            <CreateObject obj={obj} isSelected={isSelected} setMesh={setMesh} />
            { selectedIds.length === 1 && isSelected && mesh && (
                <TransformControls 
                    object={mesh}
                    mode={transformMode} 
                    onMouseDown={() => setIsTransforming(true)}
                    onMouseUp={handleObjectUpdateEnd}
                />
            ) }
        </>
    )
}

function ClickOutsideHandle() {
    const { camera, scene, gl } = useThree();
    const clearSelection = useSceneStore((state) => state.clearSelection);

    useEffect(() => {
        const canvas = gl.domElement;

        const handleDoubleClick = (event: MouseEvent) => {
            if (event.target !== canvas) return;

            const mouse = new Vector2(
                (event.clientX / window.innerWidth) * 2 - 1,
                -(event.clientY / window.innerHeight) * 2 + 1
            );

            const raycaster = new Raycaster();
            raycaster.setFromCamera(mouse, camera);

            const meshes = scene.children.filter(
                (child): child is Mesh => {
                    return child.type === 'Mesh' && !(child as Mesh).userData?.isSystemObject;
                }
            );

            const intersects = raycaster.intersectObjects(meshes, false);

            if (intersects.length === 0) {
                clearSelection();
            }
        };

        canvas.addEventListener('dblclick', handleDoubleClick);

        return () => {
            canvas.removeEventListener('dblclick', handleDoubleClick);
        };
    }, [camera, scene, gl, clearSelection]);

    return null;
}

export function Scene_GB() {
    const allObjects = useSceneStore((state) => state.objects);
    const objects = useMemo(() => allObjects.filter(o => !o.deleted), [allObjects]);
   
    const selectedIds = useSceneStore((state) => state.selectedIds);
    const updateObj = useSceneStore((state) => state.updateObj);
    const transformMode = useSceneStore((state) => state.transformMode);
    const snapEnabled = useSceneStore((state) => state.snapEnabled);
    const gridSize = useSceneStore((state) => state.gridSize);
    const selectObject = useSceneStore((state) => state.selectObject);
    const addToSelection = useSceneStore((state) => state.addToSelection);
    const clearSelection = useSceneStore((state) => state.clearSelection);
    const lastSaved = useSceneStore((state) => state.lastSaved);
    const isOnline = useSceneStore((state) => state.online);
    const setOnline = useSceneStore((state) => state.setOnline);
    const currentSceneId = useSceneStore((state) => state.currentSceneId);

    const [marquee, setMarquee] = useState<{start: {x: number, y: number}, end: {x: number, y: number}} | null>(null);
    const [showSavedIndicator, setShowSavedIndicator] = useState(false);
    const [prevSaved, setPrevSaved] = useState<number | null>(lastSaved);

    if (lastSaved !== prevSaved) {
        setPrevSaved(lastSaved);
        if (lastSaved) {
            setShowSavedIndicator(true);
        }
    }

    useEffect(() => {
        if (!isOnline || !currentSceneId) return;
        
        const unsubscribe = subscribeToSceneUpdates(currentSceneId, (update) => {
            const doc = update.document;
            const updateEvent = update.event;
            if (!doc) return;
            
            try {
                const sceneData = typeof doc.scene_data === 'string' 
                    ? JSON.parse(doc.scene_data)
                    : doc.scene_data;
                const newObjects = Array.isArray(sceneData)
                    ? sceneData
                    : sceneData.objects || [];
                    
                if (updateEvent === 'create' || updateEvent === 'update') {
                    useSceneStore.getState().setObjectsFromRealtime(newObjects);
                }
                if (updateEvent === 'delete') {
                    useSceneStore.getState().setObjects([]);
                }
            } catch (err: unknown) {
                console.error('Ошибка чтения realtime-обновления: '+ err);
            }
        });

        return () => {
            unsubscribe();
            setOnline(false);
        };
    }, [currentSceneId, isOnline, setOnline]);

    useEffect(() => {
        if (!showSavedIndicator) return;
        const timer = setTimeout(() => setShowSavedIndicator(false), 2500);
        return () => clearTimeout(timer);
    }, [showSavedIndicator]);

    const handleSelectionComplete = (newSelection: string[], isCtrl: boolean) => {
        if (newSelection.length > 0){
            if (!isCtrl) {
                clearSelection();
                selectObject(newSelection[0]);
                for (let i = 1; i < newSelection.length; i++) {
                    addToSelection(newSelection[i]);
                }
            } else {
                 newSelection.forEach(id => addToSelection(id));
            }
        } else if (!isCtrl) {
            clearSelection();
        }
    };

    return (
        <div style={{width: '100%', height: '100%', background: COLORS.bg, overflow: 'hidden', position: 'relative'}}>
            {marquee && (
                <div style={{
                    position: 'fixed',
                    left: Math.min(marquee.start.x, marquee.end.x),
                    top: Math.min(marquee.start.y, marquee.end.y),
                    width: Math.abs(marquee.end.x - marquee.start.x),
                    height: Math.abs(marquee.end.y - marquee.start.y),
                    border: '2px solid rgb(79, 7, 135)',
                    backgroundColor: 'rgba(170, 59, 255, 0.15)',
                    pointerEvents: 'none',
                    zIndex: 9999
                }} />
            )}
            <Canvas shadows dpr={[1, 2]} camera={{position: [25, 25, 25], fov: 60 }} gl={{antialias: true, alpha: false, preserveDrawingBuffer: true}} style={{width: '100%', height: '100%'}} onPointerMissed={e => e.stopPropagation()}>                  
                <CameraSaver />
                <ControlsSaver />
                <color attach='background' args={[COLORS.bg]}/>
                <ambientLight intensity={0.5}/>
                <directionalLight 
                    position={[50, 100, 50]} 
                    intensity={0.8} 
                    castShadow 
                    shadow-mapSize={2048} 
                    shadow-camera-left={-100} shadow-camera-right={100} shadow-camera-top={100} shadow-camera-bottom={-100}/>
                <Grid args={[500, 500]} 
                    cellColor={COLORS.gridMinor} 
                    sectionColor={COLORS.gridMajor} 
                    cellSize={1} 
                    sectionSize={2.5} 
                    followCamera={false} 
                    infiniteGrid={false}/>
                <Line points={[[-100, 0, 0], [100, 0, 0]]} color={COLORS.axisX} lineWidth={3} opacity={0.4} transparent/>
                <Line points={[[0, -100, 0], [0, 100, 0]]} color={COLORS.axisY} lineWidth={3} opacity={0.4} transparent/>
                <Line points={[[0, 0, -100], [0, 0, 100]]} color={COLORS.axisZ} lineWidth={3} opacity={0.4} transparent/>

                {objects.map((obj) => (
                    <SceneObject key={obj.id} obj={obj} isSelected={selectedIds.includes(obj.id)}/>
                ))}

                {selectedIds.length > 1 && (
                    <GroupTransformControls 
                        selectedIds={selectedIds} 
                        objects={objects} 
                        updateObj={updateObj} 
                        transformMode={transformMode}
                        snapEnabled={snapEnabled}
                        gridSize={gridSize}
                    />
                )}
                <ClickOutsideHandle />    
                <OrbitControlsDrei makeDefault/>
                <KeyboardShortcuts />
                <MarqueeSelection onMarqueeChange={setMarquee} onSelectionComplete={handleSelectionComplete} />
                <CameraFocusAuto />
            </Canvas>
            { showSavedIndicator && (
                <div style={{position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
                    background: "rgba(72, 255, 115, 0.9)", color: "#0a0b15", 
                    padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, zIndex: 7000,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)", display: "flex", alignItems: "center",
                    gap: 6, animation: "fadeInOut 2s ease-in-out"
                }}>
                    ✅ Автосохранение
                </div>
            )}
        </div>
    )
}