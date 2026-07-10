// /src/components/Scene.tsx
import { useEffect, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, Line, TransformControls, Outlines } from '@react-three/drei'
import { COLORS } from '../constants/color.ts'
import { useSceneStore } from '../store/sceneStore.ts'
import * as THREE from 'three'

function CreateObject({obj, isSelected, setMesh}:{obj:any, isSelected:boolean, setMesh: (mesh: THREE.Mesh | null) => void}){
    return(
        <mesh ref={setMesh} position={obj.position} rotation={obj.rotation} scale={obj.scale} castShadow receiveShadow 
            onClick={(e) => {
            e.stopPropagation()
            useSceneStore.getState().selectObject(obj.id)
        }}>
            {obj.type === 'box' && <boxGeometry args={[1, 1, 1]} />}
            {obj.type === 'sphere' && <sphereGeometry args={[0.5, 32, 32]} />}
            {obj.type === 'cylinder' && <cylinderGeometry args={[0.5, 0.5, 1, 32]} />}
            {obj.type === 'cone' && <coneGeometry args={[0.5, 0.5, 1, 32]} />}
            {obj.type === 'tor' && <torusGeometry args={[0.5, 0.2, 16, 32]} />}
            {obj.type === 'pyramid' && <coneGeometry args={[0.5, 1, 4, 1]} />}
            <meshStandardMaterial color={obj.color}/>
            {isSelected && (<Outlines color="#aa3bff" thickness={2} angle={0.6}/>)}
        </mesh>
    )
}

function SceneObject({obj, isSelected}:{obj:any, isSelected:boolean}){
    const [mesh, setMesh] = useState<THREE.Mesh | null>(null);
    const { updateObj, transformMode } = useSceneStore();
    const [isTransforming, setIsTransforming] = useState(false);

    // Синхронизация стора с mesh
    useEffect(() => {
        if (mesh && !isTransforming){
            mesh.position.set(...(obj.position) as [number, number, number]);
            mesh.rotation.set(...(obj.rotation) as [number, number, number]);
            mesh.scale.set(...(obj.scale) as [number, number, number]);
        }
    }, [obj.position, obj.rotation, obj.scale, isTransforming, mesh]);

    const handleObjectUpdateEnd = () => {
        if (mesh){
            updateObj(obj.id, {
                position: [ mesh.position.x, mesh.position.y, mesh.position.z ],
                rotation: [ mesh.rotation.x, mesh.rotation.y, mesh.rotation.z ],
                scale: [ mesh.scale.x, mesh.scale.y, mesh.scale.z ]
            })
        }
        setIsTransforming(false)
    }

    return(
        <>
            <CreateObject obj={obj} isSelected={isSelected} setMesh={setMesh} />
            {isSelected && mesh && (
                <TransformControls 
                    object={mesh}
                    mode={transformMode} 
                    onMouseDown={() => setIsTransforming(true)}
                    onMouseUp={handleObjectUpdateEnd}
                />
            )}
        </>
    )
}

function ClickOutsideHandle(){
    const { camera, scene, gl} = useThree();
    const selectObject = useSceneStore((state) => state.selectObject);
    // const objects = useSceneStore((state) => state.objects);
    const selectedId = useSceneStore((state) => state.selectedId);

    const mouseDownPos = useRef({x: 0, y: 0});
    const isDragging = useRef(false);

    useEffect(() => {
        const canvas = gl.domElement

        const handleMouseDown = (event: MouseEvent) => {
            mouseDownPos.current = {x: event.clientX, y: event.clientY}
            isDragging.current = false;
        }

        const handleMouseMove = (event: MouseEvent) => {
            const dx = event.clientX - mouseDownPos.current.x
            const dy = event.clientY - mouseDownPos.current.y
            if (Math.sqrt(dx * dx + dy * dy) > 4){
                isDragging.current = true
            }

        }

        const handleMouseUp = (event: MouseEvent) => {
            if (!isDragging.current && event.target !== canvas) return;

            const mouse = new THREE.Vector2(
                (event.clientX / window.innerWidth) * 2 - 1,
                -(event.clientY / window.innerHeight) * 2 + 1
            )

            const raycaster = new THREE.Raycaster()
            raycaster.setFromCamera(mouse, camera)

            const meshes = scene.children.filter(
                (child): child is THREE.Mesh => child.type === 'Mesh')

            const intersects = raycaster.intersectObjects(meshes, false)

            if (intersects.length === 0 && selectedId !== null){
                selectObject(null)
            }
        }
        canvas.addEventListener('mousedown', handleMouseDown)
        canvas.addEventListener('mousemove', handleMouseMove)
        canvas.addEventListener('mouseup', handleMouseUp)
        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown)
            canvas.removeEventListener('mousemove', handleMouseMove)
            canvas.removeEventListener('mouseup', handleMouseUp)
        }
    }, [camera, scene, gl, selectedId, selectObject])
    return null
}

export function Scene_GB(){
    const objects = useSceneStore((state) => state.objects);
    const selectedId = useSceneStore((state) => state.selectedId);

    return (
        <div style ={{width: '100%', height: '100%', background: COLORS.bg, overflow: 'hidden', position: 'relative'}}>
            <Canvas shadows dpr={[1, 2]} camera={{position: [25, 25, 25], fov: 60 }} gl={{antialias: true, alpha: false}} style={{width: '100%', height: '100%'}} onPointerMissed={e => e.stopPropagation()}
            >
                    
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
                    cellSize={2} 
                    sectionSize={8} 
                    followCamera={false} 
                    infiniteGrid={false}/>
                    {/* Красная ось X */}
                    <Line points={[[-100, 0, 0], [100, 0, 0]]} color={COLORS.axisX} lineWidth={3} opacity={0.4} transparent/>
                    {/* Зелёная ось Y */}
                    <Line points={[[0, -100, 0], [0, 100, 0]]} color={COLORS.axisY} lineWidth={3} opacity={0.4} transparent/>
                    {/* Синяя ось Z */}
                    <Line points={[[0, 0, -100], [0, 0, 100]]} color={COLORS.axisZ} lineWidth={3} opacity={0.4} transparent/>

                    {objects.map((obj) => (
                        <SceneObject key={obj.id} obj={obj} isSelected={obj.id === selectedId}/>
                    ))}
                <ClickOutsideHandle />    
                <OrbitControls makeDefault/>
            </Canvas>
        </div>
    )
}