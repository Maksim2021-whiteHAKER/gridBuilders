// /src/components/Scene.tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Line } from '@react-three/drei'
import { COLORS } from '../constants/color.ts'
import { useSceneStore } from '../store/sceneStore.ts'

function SceneObject({obj}:{obj:any}){
    return(
        <mesh position={obj.position} rotation={obj.rotation} scale={obj.scale} castShadow receiveShadow>
            {obj.type === 'box' && <boxGeometry args={[1, 1, 1]} />}
            {obj.type === 'sphere' && <sphereGeometry args={[0.5, 32, 32]} />}
            {obj.type === 'cylinder' && <cylinderGeometry args={[0.5, 0.5, 1, 32]} />}
            {obj.type === 'cone' && <coneGeometry args={[0.5, 0.5, 1, 32]} />}
            {obj.type === 'tor' && <torusGeometry args={[0.5, 0.2, 16, 32]} />}
            {obj.type === 'pyramid' && <coneGeometry args={[0.5, 1, 4, 1]} />}
            <meshStandardMaterial color={obj.color} />
        </mesh>
    )
}

export function Scene_GB(){
    const objects = useSceneStore((state) => state.objects);
    return (
        <div style ={{width: '100%', height: '100%', background: COLORS.bg, overflow: 'hidden', position: 'relative'}}>
            <Canvas shadows dpr={[1, 2]} camera={{position: [25, 25, 25], fov: 60 }} gl={{antialias: true, alpha: false}} style={{width: '100%', height: '100%'}}>
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
                        <SceneObject key={obj.id} obj={obj}/>
                    ))}

                 <OrbitControls makeDefault/>
            </Canvas>
        </div>
    )
}