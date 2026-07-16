// /scr/componetns/ToolBar.tsx
import { useState } from 'react'
import { useSceneStore } from "../store/sceneStore";

type ObjectType = 'box' | 'sphere' | 'cylinder' | 'cone' | 'tor' | 'pyramid';

const OBJECT_TYPES: {value: ObjectType, name: string}[] = [
    { value: 'box', name: '🔲 Куб' },
    { value: 'sphere', name: '🔘 Шар'},
    { value: 'cylinder', name: '💈 Цилиндр'},
    { value: 'cone', name: '🎉 Конус'},
    { value: 'tor', name: '⭕ Тор'},
    { value: 'pyramid', name: '🔺 Пирамида'}
]

export function ToolBar(){
    const addObject = useSceneStore((state) => state.addObj);
    const [selectedType, setSelectedType] = useState<ObjectType>('box');
    const { transformMode, setTransformMode, selectedIds, undo, redo, canUndo, canRedo } = useSceneStore();

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

            {/* Undo/Redo кнопки */}
            <div style={{ display: 'flex', gap: 4 }}>
                <button
                    onClick={undo}
                    disabled={!canUndo()}
                    style={{
                        flex: 1,
                        padding: '6px 8px',
                        background: canUndo() ? '#14151f' : '#0a0b15',
                        color: canUndo() ? 'white' : '#6b7280',
                        border: '1px solid #2e303a',
                        borderRadius: 4,
                        cursor: canUndo() ? 'pointer' : 'not-allowed',
                        fontSize: 12,
                        opacity: canUndo() ? 1 : 0.5
                    }}
                    title="Отменить (Ctrl+Z)"
                >
                    ↶ Отмена
                </button>
                <button
                    onClick={redo}
                    disabled={!canRedo()}
                    style={{
                        flex: 1,
                        padding: '6px 8px',
                        background: canRedo() ? '#14151f' : '#0a0b15',
                        color: canRedo() ? 'white' : '#6b7280',
                        border: '1px solid #2e303a',
                        borderRadius: 4,
                        cursor: canRedo() ? 'pointer' : 'not-allowed',
                        fontSize: 12,
                        opacity: canRedo() ? 1 : 0.5
                    }}
                    title="Повторить (Ctrl+Y)"
                >
                    ↷ Вернуть
                </button>
            </div>

            {selectedIds.length > 0 && (
                <>
                    <label style={{
                        color: 'rgb(255,255,255)',
                        fontSize: 13,
                        fontWeight: 200,
                        marginTop: 8
                    }}>Тип управления объектом</label>

                    <div style={{ display: 'flex', gap: 4 }}>
                        <button
                            onClick={() => setTransformMode('translate')}
                            style={{
                                flex: 1,
                                padding: '6px 8px',
                                background: transformMode === 'translate' ? '#aa3bff' : '#14151f',
                                color: 'white',
                                border: '1px solid #2e303a',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontSize: 12
                            }}
                            title="Перемещение (W)"
                        >
                            ↕️ W
                        </button>
                        <button
                            onClick={() => setTransformMode('rotate')}
                            style={{
                                flex: 1,
                                padding: '6px 8px',
                                background: transformMode === 'rotate' ? '#aa3bff' : '#14151f',
                                color: 'white',
                                border: '1px solid #2e303a',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontSize: 12
                            }}
                            title="Вращение (R)"
                        >
                            🔄 R
                        </button>
                        <button
                            onClick={() => setTransformMode('scale')}
                            style={{
                                flex: 1,
                                padding: '6px 8px',
                                background: transformMode === 'scale' ? '#aa3bff' : '#14151f',
                                color: 'white',
                                border: '1px solid #2e303a',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontSize: 12
                            }}
                            title="Масштаб (S)"
                        >
                            ⤢ S
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}