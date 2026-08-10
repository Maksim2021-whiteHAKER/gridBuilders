// src/components/MarqueeSelection.tsx
import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { useSceneStore } from "../store/sceneStore";
import * as THREE from 'three'

export function MarqueeSelection({ onMarqueeChange, onSelectionComplete } : {
        onMarqueeChange: (rect: {start: {x: number, y: number}, end: {x: number, y: number}} | null) => void;
        onSelectionComplete: (newSelection: string[], isCtrl: boolean) => void;
    }) {
    const { camera, gl} = useThree();
    const objects = useSceneStore((state) => state.objects);

    const isSelectingRef = useRef(false);
    const startPosRef = useRef({x: 0, y: 0});
    const endPosRef = useRef({x: 0, y: 0});

    const isCtrlRef = useRef(false)

    useEffect(() => {
        const canvas = gl.domElement;

        const handlePointerDown = (e: PointerEvent) => {
            if (e.altKey && e.button === 0){
                e.preventDefault(); 
                e.stopPropagation();

                isSelectingRef.current = true;
                isCtrlRef.current = e.ctrlKey || e.metaKey;
                startPosRef.current = {x: e.clientX, y: e.clientY};
                endPosRef.current = {x: e.clientX, y: e.clientY};
                onMarqueeChange({start: startPosRef.current, end: endPosRef.current})
            }
        }

        const handlePointerMove = (e: PointerEvent) => {
            if (isSelectingRef.current) {
                endPosRef.current = { x: e.clientX, y: e.clientY };
                onMarqueeChange({ start: startPosRef.current, end: endPosRef.current });
            }
        }

        const handlePointerUp = () => {
            if (isSelectingRef.current) {
                isSelectingRef.current = false;
                onMarqueeChange(null);
                performSelection()
            }
        }
        
        canvas.addEventListener('pointerdown', handlePointerDown);
        canvas.addEventListener('pointermove', handlePointerMove);
        canvas.addEventListener('pointerup', handlePointerUp);
        return () => {
            canvas.removeEventListener('pointerdown', handlePointerDown);
            canvas.removeEventListener('pointermove', handlePointerMove);
            canvas.removeEventListener('pointerup', handlePointerUp);
        }
    }, [camera, gl, objects, onMarqueeChange, onSelectionComplete]);

    const performSelection = () => {
        const x1 = Math.min(startPosRef.current.x, endPosRef.current.x);
        const y1 = Math.min(startPosRef.current.y, endPosRef.current.y);
        const x2 = Math.max(startPosRef.current.x, endPosRef.current.x);
        const y2 = Math.max(startPosRef.current.y, endPosRef.current.y);

        if (x2 - x1 >= 5 || y2 - y1 >= 5) {
            const newSelection: string[] = [];  
            objects.forEach((obj) => {
                const vector = new THREE.Vector3(...obj.position);
    
                vector.project(camera);
                const screenX = (vector.x * 0.5 + 0.5) * window.innerWidth;
                const screenY = (-(vector.y * 0.5) + 0.5) * window.innerHeight;
    
                if (screenX >= x1 && screenX <= x2 && screenY >= y1 && screenY <= y2) {
                    newSelection.push(obj.id);
                }
            });
            onSelectionComplete(newSelection,isCtrlRef.current)
        } else if (!isCtrlRef.current){
            onSelectionComplete([], false);
        }
    }

    return null;
}