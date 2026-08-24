import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { useSceneStore } from '../store/sceneStore';

export function CameraControls() {
    const camera = useSceneStore((state) => state.camera);
    const controls = useSceneStore((state) => state.controls);
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    const [pos, setPos] = useState({ x: 0, y: 0, z: 0 });
    const [rot, setRot] = useState({ x: 0, y: 0, z: 0 });

    useEffect(() => {
        if (camera) {
            setPos({ x: camera.position.x, y: camera.position.y, z: camera.position.z });
            const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
            setRot({
                x: euler.x * (180 / Math.PI),
                y: euler.y * (180 / Math.PI),
                z: euler.z * (180 / Math.PI)
            });
        }
    }, [camera]);

    const handlePositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
        if (!camera || !controls) return;
        const clampedValue = Math.max(-100, Math.min(100, value));
        const delta = clampedValue - camera.position[axis];
        
        setPos(prev => ({ ...prev, [axis]: clampedValue }));
        camera.position[axis] = clampedValue;
        
        // Сдвигаем target на ту же величину, чтобы сохранить направление взгляда
        controls.target[axis] += delta;
        
        // ✅ Принудительно обновляем матрицы, чтобы OrbitControls увидел изменения
        camera.updateMatrixWorld(true);
        controls.update();
    };

    const handleRotationChange = (axis: 'x' | 'y' | 'z', value: number) => {
        if (!camera || !controls) return;
        
        // ⚠️ OrbitControls по умолчанию НЕ поддерживает вращение по оси Z (крен).
        // Он принудительно выравнивает камеру по вертикали. 
        // Если вам критически нужно вращение по Z, замените OrbitControls на TrackballControls.
        
        const clampedValue = Math.max(-180, Math.min(180, value));
        setRot(prev => ({ ...prev, [axis]: clampedValue }));
        
        const currentEuler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
        const rads = {
            x: axis === 'x' ? clampedValue * (Math.PI / 180) : currentEuler.x,
            y: axis === 'y' ? clampedValue * (Math.PI / 180) : currentEuler.y,
            z: axis === 'z' ? clampedValue * (Math.PI / 180) : currentEuler.z,
        };
        
        // Принудительно обновляем кватернион и матрицу камеры
        const newQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(rads.x, rads.y, rads.z, 'YXZ'));
        camera.quaternion.copy(newQuaternion);
        camera.updateMatrixWorld(true);
        
        // Обновляем target, чтобы камера смотрела вперед
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(camera.quaternion);
        controls.target.copy(camera.position).add(direction.multiplyScalar(10));
        controls.update();
    };

    const adjustPosition = (axis: 'x' | 'y' | 'z', delta: number) => {
        handlePositionChange(axis, pos[axis] + delta);
    };

    const adjustRotation = (axis: 'x' | 'y' | 'z', delta: number) => {
        handleRotationChange(axis, rot[axis] + delta);
    };

    if (!camera) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 90,
            left: 10,
            width: 260,
            maxHeight: '320px',
            background: 'rgba(20, 21, 31, 0.98)',
            borderRadius: 12,
            border: '1px solid #2e303a',
            zIndex: 999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease'
        }}>
            <div 
                onClick={() => setIsCollapsed(!isCollapsed)}
                style={{
                    padding: '10px 14px',
                    background: 'rgba(170, 59, 255, 0.2)',
                    borderBottom: '1px solid #2e303a',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none'
                }}
            >
                <span style={{ fontSize: 13, fontWeight: 600, color: '#e4e4e7' }}>🎥 Камера</span>
                <span style={{ fontSize: 16, color: '#9ca3af' }}>{isCollapsed ? '▼' : '▲'}</span>
            </div>

            {!isCollapsed && (
                <div style={{ padding: '14px', maxHeight: '260px', overflowY: 'auto' }}>
                    {/* Позиция */}
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12, color: '#48FF73', marginBottom: 5, fontWeight: 600 }}>📍 Позиция</div>
                        
                        {(['x', 'y', 'z'] as const).map((axis) => {
                            const color = axis === 'x' ? '#FF5F56' : axis === 'y' ? '#48FF73' : '#1948FF';
                            return (
                                <div key={axis} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                    <span style={{ width: 18, color, fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>{axis}</span>
                                    
                                    <button onClick={() => adjustPosition(axis, -1)} style={{
                                        width: 24, height: 24, background: '#2e303a', border: 'none', borderRadius: 6,
                                        color: '#e4e4e7', fontSize: 18, fontWeight: 'bold', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>−</button>
                                    
                                    <input
                                        type="range"
                                        min="-100"
                                        max="100"
                                        step="0.5"
                                        value={pos[axis]}
                                        onChange={(e) => handlePositionChange(axis, parseFloat(e.target.value))}
                                        style={{ flex: 1, height: 5, accentColor: color, cursor: 'pointer' }}
                                    />
                                    
                                    <button onClick={() => adjustPosition(axis, 1)} style={{
                                        width: 24, height: 24, background: '#2e303a', border: 'none', borderRadius: 6,
                                        color: '#e4e4e7', fontSize: 18, fontWeight: 'bold', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>+</button>
                                    
                                    <span style={{ width: 40, textAlign: 'right', fontSize: 11, color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>
                                        {pos[axis].toFixed(1)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Вращение */}
                    <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 12, color: '#aa3bff', marginBottom: 5, fontWeight: 600 }}>🔄 Вращение</div>
                        
                        {(['x', 'y'] as const).map((axis) => { // ✅ Убрали 'z' из массива, так как OrbitControls его не поддерживает
                            const color = axis === 'x' ? '#FF5F56' : '#48FF73';
                            return (
                                <div key={axis} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                    <span style={{ width: 18, color, fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>{axis}</span>
                                    
                                    <button onClick={() => adjustRotation(axis, -5)} style={{
                                        width: 24, height: 24, background: '#2e303a', border: 'none', borderRadius: 6,
                                        color: '#e4e4e7', fontSize: 18, fontWeight: 'bold', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>−</button>
                                    
                                    <input
                                        type="range"
                                        min="-180"
                                        max="180"
                                        step="5"
                                        value={rot[axis]}
                                        onChange={(e) => handleRotationChange(axis, parseFloat(e.target.value))}
                                        style={{ flex: 1, height: 5, accentColor: color, cursor: 'pointer' }}
                                    />
                                    
                                    <button onClick={() => adjustRotation(axis, 5)} style={{
                                        width: 24, height: 24, background: '#2e303a', border: 'none', borderRadius: 6,
                                        color: '#e4e4e7', fontSize: 18, fontWeight: 'bold', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>+</button>
                                    
                                    <span style={{ width: 40, textAlign: 'right', fontSize: 11, color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>
                                        {rot[axis].toFixed(0)}°
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => {
                            if (!camera || !controls) return;
                            camera.position.set(25, 25, 25);
                            camera.lookAt(0, 0, 0);
                            setPos({ x: 25, y: 25, z: 25 });
                            const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
                            setRot({
                                x: euler.x * (180 / Math.PI),
                                y: euler.y * (180 / Math.PI),
                                z: euler.z * (180 / Math.PI)
                            });
                            controls.target.set(0, 0, 0);
                            controls.update();
                        }}
                        style={{
                            width: '100%', padding: '5px', background: '#2e303a', color: 'white', border: 'none',
                            borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, marginTop: -2,
                            transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#3e404a'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#2e303a'}
                    >
                        🔄 Сбросить камеру
                    </button>
                </div>
            )}
        </div>
    );
}