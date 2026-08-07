import { useEffect, useRef, useMemo, useState } from "react"
import { TransformControls } from "@react-three/drei"
import * as THREE from 'three'
import type { SceneObject } from "../store/sceneStore"

interface GroupTransformControlsProps {
    selectedIds: string[];
    objects: SceneObject[];
    updateObj: (id: string, updates: Partial<SceneObject>) => void;
    transformMode: 'translate' | 'rotate' | 'scale';
    snapEnabled: boolean;
    gridSize: number;
}

export function GroupTransformControls({ 
    selectedIds, 
    objects, 
    updateObj, 
    transformMode, 
    snapEnabled,
    gridSize,
}: GroupTransformControlsProps) {
    
    const pivotRef = useRef<THREE.Group>(null);
    const [pivot, setPivot] = useState<THREE.Group | null>(null);
    
    const initialPivotState = useRef({
        position: new THREE.Vector3(),
        rotation: new THREE.Euler(),
        scale: new THREE.Vector3()
    });
    
    const initialObjectPos = useRef<Map<string, [number, number, number]>>(new Map());
    const initialObjectRotation = useRef<Map<string, [number, number, number]>>(new Map());
    const initialObjectScale = useRef<Map<string, [number, number, number]>>(new Map());
    
    const isDragging = useRef(false);

    // 1. ✅ Вычисляем центр масс. Зависимость от objects необходима,
    // чтобы центр масс обновлялся, если объекты были перемещены программно.
    // Бесконечный цикл предотвращается проверкой !isDragging.current в useEffect.
    const centerOfMass = useMemo(() => {
        const selectedObjects = objects.filter(obj => selectedIds.includes(obj.id));
        if (selectedObjects.length === 0) return { x: 0, y: 0, z: 0 };
        
        let sumX = 0, sumY = 0, sumZ = 0;
        for (const obj of selectedObjects) {
            sumX += obj.position[0];
            sumY += obj.position[1];
            sumZ += obj.position[2];
        }
        const count = selectedObjects.length;
        return { x: sumX / count, y: sumY / count, z: sumZ / count };
    }, [objects, selectedIds]);

    // 2. Синхронизируем пивот с центром масс ТОЛЬКО когда не тянем
    useEffect(() => {
        if (pivotRef.current && !isDragging.current) {
            pivotRef.current.position.set(centerOfMass.x, centerOfMass.y, centerOfMass.z);
            pivotRef.current.rotation.set(0, 0, 0);
            pivotRef.current.scale.set(1, 1, 1);
        }
    }, [centerOfMass]);

    // 3. Начало перетаскивания
    const handleStart = () => {
        if (!pivotRef.current) return;
        
        isDragging.current = true;
        
        initialPivotState.current.position.copy(pivotRef.current.position);
        initialPivotState.current.rotation.copy(pivotRef.current.rotation);
        initialPivotState.current.scale.copy(pivotRef.current.scale);
        
        initialObjectPos.current.clear();
        initialObjectRotation.current.clear();
        initialObjectScale.current.clear();
        
        selectedIds.forEach(id => {
            const obj = objects.find(o => o.id === id);
            if (obj) {
                initialObjectPos.current.set(id, [...obj.position] as [number, number, number]);
                initialObjectRotation.current.set(id, [...obj.rotation] as [number, number, number]);
                initialObjectScale.current.set(id, [...obj.scale] as [number, number, number]);
            }
        });
    };

    // 4. Окончание перетаскивания
    const handleEnd = () => {
        isDragging.current = false;
        initialObjectPos.current.clear();
        initialObjectRotation.current.clear();
        initialObjectScale.current.clear();
    };

    // 5. ✅ ОПТИМИЗАЦИЯ: Расчет дельты вынесен ЗА пределы цикла forEach
    const handleObjectChange = () => {
        const currentPivotRef = pivotRef.current;
        if (!currentPivotRef || !isDragging.current) return;
        
        // Считаем дельты ОДИН раз за кадр, а не для каждого объекта
        const deltaPos = new THREE.Vector3().subVectors(currentPivotRef.position, initialPivotState.current.position);
        const deltaRot = new THREE.Vector3(
            currentPivotRef.rotation.x - initialPivotState.current.rotation.x,
            currentPivotRef.rotation.y - initialPivotState.current.rotation.y,
            currentPivotRef.rotation.z - initialPivotState.current.rotation.z
        );
        const deltaScl = new THREE.Vector3(
            currentPivotRef.scale.x - initialPivotState.current.scale.x,
            currentPivotRef.scale.y - initialPivotState.current.scale.y,
            currentPivotRef.scale.z - initialPivotState.current.scale.z
        );

        // Если ничего не сдвинулось даже на волосок, прерываем выполнение и не нагружаем стор
        if (deltaPos.length() < 0.001 && deltaRot.length() < 0.001 && deltaScl.length() < 0.001) return;

        // Применяем рассчитанные дельты к объектам
        selectedIds.forEach(id => {
            const initialPos = initialObjectPos.current.get(id);
            const initialRot = initialObjectRotation.current.get(id);
            const initialScl = initialObjectScale.current.get(id);

            if (!initialPos || !initialRot || !initialScl) return;
            const rawX = initialPos[0] + deltaPos.x;
            const rawY = initialPos[1] + deltaPos.y;
            const rawZ = initialPos[2] + deltaPos.z;

            if (transformMode === 'translate') {
                updateObj(id, {
                    position: [
                        snapEnabled ? Math.round(rawX / gridSize) * gridSize : rawX,
                        snapEnabled ? Math.round(rawY / gridSize) * gridSize : rawY, 
                        snapEnabled ? Math.round(rawZ / gridSize) * gridSize : rawZ]
                });
            } else if (transformMode === 'rotate') {
                updateObj(id, {
                    rotation: [initialRot[0] + deltaRot.x, initialRot[1] + deltaRot.y, initialRot[2] + deltaRot.z]
                });
            } else if (transformMode === 'scale') {
                updateObj(id, {
                    scale: [initialScl[0] + deltaScl.x, initialScl[1] + deltaScl.y, initialScl[2] + deltaScl.z]
                });
            }
        });
    };

    // 6. Глобальный обработчик отпускания мыши (страховка)
    useEffect(() => {
        const handleGlobalPointerUp = () => {
            if (isDragging.current) {
                handleEnd();
            }
        };
        window.addEventListener('pointerup', handleGlobalPointerUp);
        return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
    }, []);

    if (selectedIds.length <= 1) {
        return null;
    }

    return (
        <>
            <group 
                ref={(node) => {
                    pivotRef.current = node;
                    if (node) setPivot(node);
                }}
                position={[centerOfMass.x, centerOfMass.y, centerOfMass.z]}
            >
                <mesh visible={false}> 
                    <boxGeometry args={[0.5, 0.5, 0.5]} />
                    <meshBasicMaterial color="yellow" wireframe transparent opacity={0.5} />
                </mesh>
            </group>
            
            {pivot && (
                <TransformControls 
                    object={pivot}
                    mode={transformMode}
                    onObjectChange={handleObjectChange}
                    onMouseDown={handleStart}
                    onMouseUp={handleEnd}
                    enabled={true}
                />
            )}
        </>
    );
}