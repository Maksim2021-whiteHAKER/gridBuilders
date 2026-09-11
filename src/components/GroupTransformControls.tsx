import { useEffect, useRef, useMemo, useState, useCallback } from "react"
import { TransformControls } from "@react-three/drei"
import { Euler } from 'three/src/math/Euler.js'
import { Vector3 } from 'three/src/math/Vector3.js'
import { Group } from 'three/src/objects/Group.js';
import { useSceneStore, type SceneObject } from "../store/sceneStore"

interface GroupTransformControlsProps {
    selectedIds: string[];
    objects: SceneObject[];
    updateObj: (id: string, updates: Partial<SceneObject>) => void;
    transformMode: 'translate' | 'rotate' | 'scale';
    snapEnabled: boolean;
    gridSize: number;
}

export function GroupTransformControls({ selectedIds, objects, updateObj, transformMode, snapEnabled, gridSize}: GroupTransformControlsProps) {

    const selectedIdsStr = useMemo(() => selectedIds.join(','), [selectedIds]);
    
    const pivotRef = useRef<Group>(null);
    const [pivot, setPivot] = useState<Group | null>(null);
    
    const initialPivotState = useRef({
        position: new Vector3(),
        rotation: new Euler(),
        scale: new Vector3()
    });
    
    const initialObjectPos = useRef<Map<string, [number, number, number]>>(new Map());
    const initialObjectRotation = useRef<Map<string, [number, number, number]>>(new Map());
    const initialObjectScale = useRef<Map<string, [number, number, number]>>(new Map());
    
    const isDragging = useRef(false);

    // 1. ✅ Вычисляем центр масс с использованием Vector3
    const centerOfMass = useMemo(() => {
        const selectedObjects = objects.filter(obj => selectedIds.includes(obj.id));
        if (selectedObjects.length === 0) return new Vector3(0, 0, 0);
        
        const sum = selectedObjects.reduce((acc, obj) => {
            acc.x += obj.position[0];
            acc.y += obj.position[1];
            acc.z += obj.position[2];
            return acc;
        }, new Vector3(0, 0, 0));

        const count = selectedObjects.length;
        return new Vector3(sum.x / count, sum.y / count, sum.z / count);
    }, [selectedIds.join(','), objects]); 

    // 2. Синхронизируем пивот с центром масс ТОЛЬКО когда не тянем
    useEffect(() => {
        if (pivotRef.current && !isDragging.current) {
            pivotRef.current.position.copy(centerOfMass);
            pivotRef.current.rotation.set(0, 0, 0);
            pivotRef.current.scale.set(1, 1, 1);
        }
    }, [centerOfMass, selectedIds.join(',')]);

    // 3. Начало перетаскивания
    const handleStart = useCallback(() => {
        if (!pivotRef.current) return;
        
        isDragging.current = true;

        const currentObjects = useSceneStore.getState().objects;
        
        // ✅ Сохраняем начальное состояние пивота
        initialPivotState.current.position.copy(pivotRef.current.position);
        initialPivotState.current.rotation.copy(pivotRef.current.rotation);
        initialPivotState.current.scale.copy(pivotRef.current.scale);
        
        initialObjectPos.current.clear();
        initialObjectRotation.current.clear();
        initialObjectScale.current.clear();
        
        selectedIds.forEach(id => {
            const obj = currentObjects.find(o => o.id === id);
            if (obj) {
                initialObjectPos.current.set(id, [...obj.position] as [number, number, number]);
                initialObjectRotation.current.set(id, [...obj.rotation] as [number, number, number]);
                initialObjectScale.current.set(id, [...obj.scale] as [number, number, number]);
            }
        });
    }, [selectedIdsStr]);

    // 4. Окончание перетаскивания
    const handleEnd = useCallback(() => {
        isDragging.current = false;
        initialObjectPos.current.clear();
        initialObjectRotation.current.clear();
        initialObjectScale.current.clear();
    }, []);

    // 5. ✅ ОПТИМИЗАЦИЯ: Расчет дельты вынесен ЗА пределы цикла forEach
    const handleObjectChange = useCallback(() => {
        const currentPivotRef = pivotRef.current;
        if (!currentPivotRef || !isDragging.current) return;
        
        // Считаем дельты ОДИН раз за кадр
        const deltaPos = new Vector3().subVectors(currentPivotRef.position, initialPivotState.current.position);
        const deltaRot = new Vector3(
            currentPivotRef.rotation.x - initialPivotState.current.rotation.x,
            currentPivotRef.rotation.y - initialPivotState.current.rotation.y,
            currentPivotRef.rotation.z - initialPivotState.current.rotation.z
        );
        const deltaScl = new Vector3(
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
                        snapEnabled ? Math.round(rawZ / gridSize) * gridSize : rawZ
                    ]
                });
            } else if (transformMode === 'rotate') {
                updateObj(id, {
                    rotation: [
                        initialRot[0] + deltaRot.x, 
                        initialRot[1] + deltaRot.y, 
                        initialRot[2] + deltaRot.z
                    ]
                });
            } else if (transformMode === 'scale') {
                updateObj(id, {
                    scale: [
                        initialScl[0] + deltaScl.x, 
                        initialScl[1] + deltaScl.y, 
                        initialScl[2] + deltaScl.z
                    ]
                });
            }
        });
    }, [selectedIdsStr, transformMode, snapEnabled, gridSize, updateObj]);

    // 6. Глобальный обработчик отпускания мыши (страховка)
    useEffect(() => {
        const handleGlobalPointerUp = () => {
            if (isDragging.current) {
                handleEnd();
            }
        };
        window.addEventListener('pointerup', handleGlobalPointerUp);
        return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
    }, [handleEnd]);

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