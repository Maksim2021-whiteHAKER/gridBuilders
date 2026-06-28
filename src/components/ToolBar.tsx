// /scr/componetns/ToolBar.tsx
import { useState } from 'react'
import { useSceneStore } from "../store/sceneStore";

type ObjectType = 'box' | 'sphere' | 'cylinder' | 'cone' | 'tor' | 'pyramid';

const OBJECT_TYPES: {value: ObjectType, name: string}[] = [
    { value: 'box', name: '🔲 Куб' },
    { value: 'sphere', name: '🔘 Шар'},
    { value: 'cylinder', name: '💈 Цилиндер'},
    { value: 'cone', name: '🎉 Конус'},
    { value: 'tor', name: '⭕ Тор'},
    { value: 'pyramid', name: '🔺 Пирамида'}
]

export function ToolBar(){
    const addObject = useSceneStore((state) => state.addObj);
    const [selectedType, setSelectedType] = useState<ObjectType>('box');

    const handleAddObject = () => {
        addObject({
            id: crypto.randomUUID(),
            type: selectedType,
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [5, 5, 5],
            color: '#bf8ff3'
        })
    }
    return (
        <div style={{
            position: 'absolute',
            top: 20,
            left: 20,
            background: 'rgba(20, 21, 31, 0.95)',
            padding: 16,
            borderRadius: 8,
            border: '1px solid var(--border)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minWidth: 200
        }}>
            <label style={{
                color: 'rgb(255, 255, 255)',
                fontSize: 13,
                fontWeight: 200
            }}>Тип объекта</label>
            
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value as ObjectType)}
            style={{
                padding: '8px 12px',
                background: '#14151f',
                color: 'rgb(255, 255, 255)',
                border: '1px solid rgba(255, 255, 210, 0.8)',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 14
            }}>{OBJECT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                    {type.name}
                </option>
            ))}
            </select>

            <button
                onClick={handleAddObject}
                style={{
                    padding: '8px 16px',
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer'
                }}
            >
                Добавить Объект
            </button>
          
        </div>

    )
}