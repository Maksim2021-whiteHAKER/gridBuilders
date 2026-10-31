// src/components/GroupTransformControls.tsx
import { useEffect, useRef, useMemo, useState, useCallback } from "react"
import { TransformControls } from "@react-three/drei"
import { Euler } from 'three/src/math/Euler.js'
import { Vector3 } from 'three/src/math/Vector3.js'
import { Group } from 'three/src/objects/Group.js';
import { useSceneStore, type SceneObject } from "../store/sceneStore"

// ✅ Хелпер для получения мировых координат (упрощенный, без учета вращения/скейла родителя, но достаточный для центра масс)
const getWorldPosition = (obj: SceneObject, allObjects: SceneObject[]): [number, number, number] => {
    if (obj.parentId) {
        const parent = allObjects.find(o => o.id === obj.parentId);
        if (parent) {
            return [
                obj.position[0] + parent.position[0],
                obj.position[1] + parent.position[1],
                obj.position[2] + parent.position[2]
            ];
        }
    }
    return obj.position;
};

interface GroupTransformControlsProps {
    selectedIds: string[];
    objects: SceneObject[];
    updateObj: (id: string, updates: Partial<SceneObject>, skipHistory?: boolean) => void;
    transformMode: 'translate' | 'rotate' | 'scale';
    snapEnabled: boolean;
    gridSize: number;
}

export function GroupTransformControls({
    selectedIds, objects, updateObj, transformMode, snapEnabled, gridSize
}: GroupTransformControlsProps) {
    
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
    const hasPushedHistory = useRef(false); // ✅ Фикс холостой записи в историю

    const pushHistory = useSceneStore(state => state.pushHistory);

    // ✅ 1. Фильтруем ID: исключаем объекты, у которых родитель тоже выделен
    const transformIds = useMemo(() => selectedIds.filter(id => {
        const obj = objects.find(o => o.id === id);
        if (!obj) return false;
        const hasSelectedParent = objects.some(o => o.id === obj.parentId && selectedIds.includes(o.id));
        return !hasSelectedParent; // Если родитель выделен, трансформируем только родителя
    }), [selectedIds, objects]);

    // 2. Вычисляем центр масс с использованием МИРОВЫХ координат
    const centerOfMass = useMemo(() => {
        if (transformIds.length === 0) return new Vector3(0, 0, 0);
        
        const sum = transformIds.reduce((acc, id) => {
            const obj = objects.find(o => o.id === id);
            if (obj) {
                const worldPos = getWorldPosition(obj, objects);
                acc.x += worldPos[0];
                acc.y += worldPos[1];
                acc.z += worldPos[2];
            }
            return acc;
        }, new Vector3(0, 0, 0));

        return new Vector3(sum.x / transformIds.length, sum.y / transformIds.length, sum.z / transformIds.length);
    }, [transformIds, objects]); 

    // 3. Синхронизируем пивот
    useEffect(() => {
        if (pivotRef.current && !isDragging.current) {
            pivotRef.current.position.copy(centerOfMass);
            pivotRef.current.rotation.set(0, 0, 0);
            pivotRef.current.scale.set(1, 1, 1);
        }
    }, [centerOfMass]);

    // 4. Начало перетаскивания
    const handleStart = useCallback(() => {
        if (!pivotRef.current) return;
        isDragging.current = true;
        hasPushedHistory.current = false; // Сбрасываем флаг при новом драге

        const currentObjects = useSceneStore.getState().objects;
        
        initialPivotState.current.position.copy(pivotRef.current.position);
        initialPivotState.current.rotation.copy(pivotRef.current.rotation);
        initialPivotState.current.scale.copy(pivotRef.current.scale);
        
        initialObjectPos.current.clear();
        initialObjectRotation.current.clear();
        initialObjectScale.current.clear();
        
        // ✅ Используем transformIds вместо selectedIds
        transformIds.forEach(id => {
            const obj = currentObjects.find(o => o.id === id);
            if (obj) {
                initialObjectPos.current.set(id, [...obj.position] as [number, number, number]);
                initialObjectRotation.current.set(id, [...obj.rotation] as [number, number, number]);
                initialObjectScale.current.set(id, [...obj.scale] as [number, number, number]);
            }
        });
    }, [transformIds]);

    // 5. Окончание перетаскивания
    const handleEnd = useCallback(() => {
        isDragging.current = false;
        hasPushedHistory.current = false;
        initialObjectPos.current.clear();
        initialObjectRotation.current.clear();
        initialObjectScale.current.clear();
    }, []);

    // 6. Изменение во время перетаскивания
    const handleObjectChange = useCallback(() => {
        const currentPivotRef = pivotRef.current;
        if (!currentPivotRef || !isDragging.current) return;
        
        // ✅ Сохраняем историю только при ПЕРВОМ реальном изменении
        if (!hasPushedHistory.current) {
            pushHistory();
            hasPushedHistory.current = true;
        }

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

        if (deltaPos.length() < 0.001 && deltaRot.length() < 0.001 && deltaScl.length() < 0.001) return;

        // ✅ Используем transformIds
        transformIds.forEach(id => {
            const initialPos = initialObjectPos.current.get(id);
            const initialRot = initialObjectRotation.current.get(id);
            const initialScl = initialObjectScale.current.get(id);

            if (!initialPos || !initialRot || !initialScl) return;
            
            if (transformMode === 'translate') {
                updateObj(id, {
                    position: [
                        snapEnabled ? Math.round((initialPos[0] + deltaPos.x) / gridSize) * gridSize : (initialPos[0] + deltaPos.x),
                        snapEnabled ? Math.round((initialPos[1] + deltaPos.y) / gridSize) * gridSize : (initialPos[1] + deltaPos.y), 
                        snapEnabled ? Math.round((initialPos[2] + deltaPos.z) / gridSize) * gridSize : (initialPos[2] + deltaPos.z)
                    ]
                }, true); // skipHistory = true
            } else if (transformMode === 'rotate') {
                updateObj(id, {
                    rotation: [initialRot[0] + deltaRot.x, initialRot[1] + deltaRot.y, initialRot[2] + deltaRot.z]
                }, true);
            } else if (transformMode === 'scale') {
                updateObj(id, {
                    scale: [initialScl[0] + deltaScl.x, initialScl[1] + deltaScl.y, initialScl[2] + deltaScl.z]
                }, true);
            }
        });
    }, [transformIds, transformMode, snapEnabled, gridSize, updateObj, pushHistory]);

    // 7. Глобальный обработчик отпускания мыши
    useEffect(() => {
        const handleGlobalPointerUp = () => {
            if (isDragging.current) handleEnd();
        };
        window.addEventListener('pointerup', handleGlobalPointerUp);
        return () => {
            window.removeEventListener('pointerup', handleGlobalPointerUp);
            setPivot(null); // ✅ Фикс: сбрасываем pivot при размонтировании
        };
    }, [handleEnd]);

    if (selectedIds.length <= 1) return null;

    return (
        <>
            <group ref={(node) => { pivotRef.current = node; if (node) setPivot(node); }}>
                {/* ✅ 4. Фикс: добавляем isSystemObject, чтобы рейкастер игнорировал этот меш при dblclick */}
                <mesh visible={false} userData={{ isSystemObject: true }}> 
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