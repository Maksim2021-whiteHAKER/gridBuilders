// /src/components/Scene.tsx
import { useEffect, useState } from 'react'
import { Canvas, useLoader, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, Line, TransformControls, Outlines, Text as Text3D } from '@react-three/drei'
import { COLORS } from '../constants/color.ts'
import { useSceneStore } from '../store/sceneStore.ts'
import { GroupTransformControls } from './GroupTransformControls.tsx'
import * as THREE from 'three'
import { KeyboardShortcuts } from './HotKeyboard.tsx'
import { MarqueeSelection } from './MarqueeSelection.tsx'

function CreateObject({obj, isSelected, setMesh}:{obj:any, isSelected:boolean, setMesh: (mesh: THREE.Mesh | null) => void}){
    const texture = obj.textureUrl ? useLoader(THREE.TextureLoader, obj.textureUrl) as THREE.Texture : undefined;    

    if (obj.type === 'text') {
        return (
            <Text3D ref={setMesh as any} position={obj.position} rotation={obj.rotation} scale={obj.scale} 
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
        <mesh ref={setMesh} position={obj.position} rotation={obj.rotation} scale={obj.scale} castShadow receiveShadow 
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
            <meshStandardMaterial 
            color={obj.color} map={texture} transparent={obj.opacity < 1} opacity={obj.opacity} metalness={obj.metalness}
            roughness={obj.roughness} wireframe={obj.wireframe} depthWrite={obj.opacity === 1} 
            alphaTest={obj.opacity < 1 ? 0.01 : 0}/>
            {isSelected && (<Outlines color="#aa3bff" thickness={2} angle={0.6}/>)}
        </mesh>
    )
}

function SceneObject({obj, isSelected}:{obj:any, isSelected:boolean}){
    const [mesh, setMesh] = useState<THREE.Mesh | null>(null);
    const { updateObj, transformMode, selectedIds, snapEnabled, gridSize } = useSceneStore();
    const [isTransforming, setIsTransforming] = useState(false);

    // Синхронизация стора с mesh
    useEffect(() => {
        if (mesh && !isTransforming ) {
            mesh.position.set(...(obj.position) as [number, number, number]);
            mesh.rotation.set(...(obj.rotation) as [number, number, number]);
            mesh.scale.set(...(obj.scale) as [number, number, number]);
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
    // Убедись, что в твоем сторе эта функция называется clearSelection или deselectAll
    const clearSelection = useSceneStore((state) => state.clearSelection);

    useEffect(() => {
        const canvas = gl.domElement;

        const handleDoubleClick = (event: MouseEvent) => {
            // Игнорируем двойной клик, если он был не по самому canvas (например, по UI поверх)
            if (event.target !== canvas) return;

            const mouse = new THREE.Vector2(
                (event.clientX / window.innerWidth) * 2 - 1,
                -(event.clientY / window.innerHeight) * 2 + 1
            );

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);

            // Ищем пересечения только с объектами сцены (игнорируем системные, как гизмо)
            const meshes = scene.children.filter(
                (child): child is THREE.Mesh => {
                    return child.type === 'Mesh' && !(child as any).userData?.isSystemObject;
                }
            );

            const intersects = raycaster.intersectObjects(meshes, false);

            // ✅ ГЛАВНОЕ УСЛОВИЕ: Если двойной клик попал в ПУСТОТУ -> снимаем выделение
            if (intersects.length === 0) {
                clearSelection();
            } else {
                // Опционально: если двойной клик попал в объект, можно ничего не делать, 
                // или в будущем добавить фокус камеры на этот объект.
            }
        };

        // Слушаем именно двойной клик
        canvas.addEventListener('dblclick', handleDoubleClick);

        return () => {
            canvas.removeEventListener('dblclick', handleDoubleClick);
        };
    }, [camera, scene, gl, clearSelection]);

    return null;
}

export function Scene_GB(){
    const objects = useSceneStore((state) => state.objects);
    const selectedIds = useSceneStore((state) => state.selectedIds);

    const updateObj = useSceneStore((state) => state.updateObj);
    const transformMode = useSceneStore((state) => state.transformMode);
    const snapEnabled = useSceneStore((state) => state.snapEnabled);
    const gridSize = useSceneStore((state) => state.gridSize);

    const selectObject = useSceneStore((state) => state.selectObject);
    const addToSelection = useSceneStore((state) => state.addToSelection);
    const clearSelection = useSceneStore((state) => state.clearSelection);

    const [marquee, setMarquee] = useState<{start: {x: number, y: number}, end: {x: number, y: number}} | null>(null)

    const handleSelectionComplete = (newSelection: string[], isCtrl: boolean) => {
        if (newSelection.length > 0){
            if (!isCtrl) {
                clearSelection();
                selectObject(newSelection[0]);
                for (let i = 1; i < newSelection.length; i++) {
                    addToSelection(newSelection[i]);
                }
            } else {
                 newSelection.forEach(id => addToSelection(id))
            }
        } else if (!isCtrl) {
            clearSelection();
        }
    }

    return (
        <div style ={{width: '100%', height: '100%', background: COLORS.bg, overflow: 'hidden', position: 'relative'}}>
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
            <Canvas shadows dpr={[1, 2]} camera={{position: [25, 25, 25], fov: 60 }} gl={{antialias: true, alpha: false}} style={{width: '100%', height: '100%'}} onPointerMissed={e => e.stopPropagation()}>                  
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
                    {/* Красная ось X */}
                    <Line points={[[-100, 0, 0], [100, 0, 0]]} color={COLORS.axisX} lineWidth={3} opacity={0.4} transparent/>
                    {/* Зелёная ось Y */}
                    <Line points={[[0, -100, 0], [0, 100, 0]]} color={COLORS.axisY} lineWidth={3} opacity={0.4} transparent/>
                    {/* Синяя ось Z */}
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
                <OrbitControls makeDefault/>
                <KeyboardShortcuts />
                <MarqueeSelection onMarqueeChange={setMarquee} onSelectionComplete={handleSelectionComplete} />
            </Canvas>
        </div>
    )
}