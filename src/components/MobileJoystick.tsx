// src/components/MobileJoystick.tsx
import { useState, useRef, useEffect } from "react";
import { useSceneStore } from "../store/sceneStore";
import { useDeviceType } from "../hooks/useDeviceType.ts";
import * as THREE from 'three';

export function MobileJoystick({ side = "left" }: { side?: "left" | "right" }) {
    const controls = useSceneStore((state) => state.controls);
    const { selectedIds, transformMode, updateObj, objects } = useSceneStore();
    
    const [isActive, setIsActive] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [mode, setMode] = useState<'camera' | 'object'>('camera');
    
    const joystickRef = useRef<HTMLDivElement>(null);
    const touchId = useRef<number | null>(null);
    const centerRef = useRef({ x: 0, y: 0 });

    const deviceType = useDeviceType();
    const isTablet = deviceType === 'tablet';

    useEffect(() => {
        if (!controls) return;

        const handleTouchStart = (e: TouchEvent) => {
            const touch = e.changedTouches[0];
            const rect = joystickRef.current?.getBoundingClientRect();
            if (!rect) return;

            const isLeftSide = side === "left";
            const isInZone = isLeftSide 
                ? touch.clientX < window.innerWidth / 2 
                : touch.clientX > window.innerWidth / 2;

            if (isInZone && !isActive) {
                touchId.current = touch.identifier;
                setIsActive(true);
                centerRef.current = {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                };
                setPosition({ x: 0, y: 0 });
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isActive || touchId.current === null || !controls) return;

            const touch = Array.from(e.changedTouches).find(t => t.identifier === touchId.current);
            if (!touch) return;

            const maxDistance = isTablet ? 60 : 50;
            let dx = touch.clientX - centerRef.current.x;
            let dy = touch.clientY - centerRef.current.y;

            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > maxDistance) {
                dx = (dx / distance) * maxDistance;
                dy = (dy / distance) * maxDistance;
            }

            setPosition({ x: dx, y: dy });

            // ✅ FPS-СТИЛЬ УПРАВЛЕНИЯ КАМЕРОЙ
            if (mode === 'camera') {
                const camera = controls.object as THREE.Camera;
                const sensitivity = 0.15; // Скорость движения
                
                // Получаем направление камеры
                const direction = new THREE.Vector3();
                camera.getWorldDirection(direction);
                
                // Вектор "вправо" (перпендикулярно направлению)
                const right = new THREE.Vector3();
                right.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
                
                // Движение ВПЕРЕД/НАЗАД (по Y джойстика)
                const forwardDelta = direction.clone().multiplyScalar(-dy * sensitivity);
                camera.position.add(forwardDelta);
                
                // Движение ВЛЕВО/ВПРАВО (по X джойстика)
                const rightDelta = right.clone().multiplyScalar(dx * sensitivity);
                camera.position.add(rightDelta);
                
                // Обновляем контролы чтобы камера смотрела на target
                controls.update();
                
            } else if (mode === 'object' && selectedIds.length > 0) {
                // Управление объектом (как было)
                const sensitivity = 0.05;
                selectedIds.forEach(id => {
                    const obj = objects.find(o => o.id === id);
                    if (!obj) return;

                    if (transformMode === 'translate') {
                        const newX = obj.position[0] + dx * sensitivity;
                        const newY = obj.position[1] - dy * sensitivity; 
                        updateObj(id, { position: [newX, newY, obj.position[2]] });
                    } else if (transformMode === 'rotate') {
                        const newRotY = obj.rotation[1] - dx * sensitivity;
                        const newRotX = obj.rotation[0] - dy * sensitivity;
                        updateObj(id, { rotation: [newRotX, newRotY, obj.rotation[2]] });
                    } else if (transformMode === 'scale') {
                        const delta = (dx - dy) * sensitivity * 0.1;
                        const newScaleX = Math.max(0.1, obj.scale[0] + delta);
                        const newScaleY = Math.max(0.1, obj.scale[1] + delta);
                        const newScaleZ = Math.max(0.1, obj.scale[2] + delta);
                        updateObj(id, { scale: [newScaleX, newScaleY, newScaleZ] });
                    }
                });
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (touchId.current === null) return;
            const touch = Array.from(e.changedTouches).find(t => t.identifier === touchId.current);
            if (touch) {
                touchId.current = null;
                setIsActive(false);
                setPosition({ x: 0, y: 0 });
            }
        };

        document.addEventListener("touchstart", handleTouchStart, { passive: false });
        document.addEventListener("touchmove", handleTouchMove, { passive: false });
        document.addEventListener("touchend", handleTouchEnd);

        return () => {
            document.removeEventListener("touchstart", handleTouchStart);
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);
        };
    }, [isActive, controls, side, mode, selectedIds, transformMode, objects, updateObj, isTablet]);

    return (
        <div style={{ position: "relative" }}>
            {/* КНОПКА ПЕРЕКЛЮЧЕНИЯ РЕЖИМА */}
            <button
                onClick={() => setMode(mode === 'camera' ? 'object' : 'camera')}
                style={{
                    position: "fixed",
                    bottom: isTablet ? 290 : 240,
                    [side]: isTablet ? 60 : 40,
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    background: mode === 'object' ? "#aa3bff" : "rgba(20, 21, 31, 0.9)",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                    color: "white",
                    fontSize: 24,
                    zIndex: 1000,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}
                title={mode === 'camera' ? "Режим: камера (WASD)" : "Режим: объект"}
            >
                {mode === 'camera' ? '' : '📦'}
            </button>

            {/* ДЖОЙСТИК */}
            <div 
                ref={joystickRef}
                style={{
                    position: "fixed", 
                    bottom: isTablet ? 120 : 100, 
                    [side]: isTablet ? 50 : 30, 
                    width: isTablet ? 150 : 120, 
                    height: isTablet ? 150 : 120, 
                    borderRadius: "50%", 
                    background: "rgba(255, 255, 255, 0.1)", 
                    border: "2px solid rgba(255, 255, 255, 0.3)", 
                    zIndex: 999, 
                    touchAction: "none", 
                    pointerEvents: "none"
                }}
            >
                <div 
                    style={{
                        position: "absolute", 
                        width: isTablet ? 60 : 50, 
                        height: isTablet ? 60 : 50, 
                        borderRadius: "50%", 
                        background: isActive ? "rgba(170, 59, 255, 0.8)" : "rgba(255, 255, 255, 0.5)",
                        left: `calc(50% + ${position.x}px)`, 
                        top: `calc(50% + ${position.y}px)`,
                        transform: "translate(-50%, -50%)",
                        transition: isActive ? "none" : "all 0.2s", 
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)"
                    }} 
                />
            </div>
        </div>
    );
}