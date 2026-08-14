// /src/components/ToolBar.tsx
import { useState } from 'react'
import { useSceneStore } from "../store/sceneStore";

type ObjectType = 'box' | 'sphere' | 'cylinder' | 'cone' | 'tor' | 'pyramid' | 'text';

const OBJECT_TYPES: {value: ObjectType, name: string}[] = [
    { value: 'box', name: '🔲 Куб' },
    { value: 'sphere', name: '🔘 Шар'},
    { value: 'cylinder', name: '💈 Цилиндр'},
    { value: 'cone', name: '🎉 Конус'},
    { value: 'tor', name: '⭕ Тор'},
    { value: 'pyramid', name: '🔺 Пирамида'},
    { value: 'text', name: '🔤 Текст'}
]

export function ToolBar(){
    const addObject = useSceneStore((state) => state.addObj);
    const [selectedType, setSelectedType] = useState<ObjectType>('box');
    const exportToJSON = useSceneStore((state) => state.exportJSON);
    const exportToRBXM = useSceneStore((state) => state.exportRBXM);
    const importToJSON = useSceneStore((state) => state.importJSON);
    const { transformMode, setTransformMode, selectedIds, undo, redo, canUndo, canRedo, snapEnabled, toggleSnap } = useSceneStore();

    const handleAddObject = () => {
        addObject({
            id: crypto.randomUUID(),
            type: selectedType,
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [5, 5, 5],
            color: '#bf8ff3',
            opacity: 1.0,
            metalness: 0.0,
            roughness: 0.5,
            wireframe: false
        })
    }  

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (eventRead) => {
                    const json = eventRead.target?.result as string;
                    const success = importToJSON(json);
                    if (success) {
                        alert("Сцена загружена! Приятного пользования")
                    } else {
                        alert("Сцена не загружена, проверьте формат, он должен быть JSON")
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    return (
        <div style={{
            position: 'absolute',
            top: 20,
            left: 20,
            background: 'rgba(20, 21, 31, 0.95)',
            padding: 16,
            borderRadius: 8,
            border: '1px solid var(--border, #2e303a)',
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
                    background: 'var(--accent, #aa3bff)',
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

                     <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        marginTop: 4, 
                        padding: '8px 12px',
                        background: '#14151f', 
                        borderRadius: 4, 
                        border: '1px solid #2e303a'
                    }}>
                        <span style={{color: 'white', fontSize: 13, fontWeight: 200}}>
                            Привязка к сетке
                        </span>
                        <label style={{position: 'relative', display: 'inline-block', width: 40, height: 22, cursor: 'pointer'}}>
                            <input type='checkbox' checked={snapEnabled} onChange={toggleSnap} style={{opacity: 0, width: 0, height: 0}}/>
                            <span style={{
                                position: 'absolute', 
                                top: 0, bottom: 0, left: 0, right: 0, 
                                backgroundColor: snapEnabled ? '#aa3bff' : '#2e303a', 
                                borderRadius: 22,
                                transition: 'background-color 0.3s',
                                boxShadow: snapEnabled ? '0 0 8px rgba(170, 59, 255, 0.4)' : 'none'
                            }}></span>
                            <span style={{
                                position: 'absolute', 
                                height: 16, 
                                width: 16, 
                                left: snapEnabled ? 21 : 3, 
                                bottom: 3, 
                                backgroundColor: 'white', 
                                borderRadius: '50%', 
                                transition: 'left 0.3s'
                            }}></span>
                        </label>
                    </div>
                </>
            )}
            <div style={{marginTop: 8, paddingTop: 4, alignItems: 'center', border: '1px solid #2e303a', display: 'flex', flexDirection: 'column', gap: 6}}>
                <label style={{color: 'white', fontSize: 12, fontWeight: 200}}>Сохранение сцены / загрузка из ...</label>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 4}}>
                    <button onClick={exportToJSON}
                    style={{ gridRow: '1', gridColumn: '1', padding: '8px', background: '#14151f',
                     color: 'white', border: '1px solid #2e303a', borderRadius: 4, cursor: 'pointer', 
                     fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, 
                     transition: 'all 0.2s'}} title='Скачать сцену из JSON'>
                        Скачать (JSON)
                    </button>
                    <button onClick={exportToRBXM} 
                    style={{ gridRow: '2', gridColumn: '1', flexDirection: 'column', padding: '6px 8px', background: '#14151f', color: 'white', border: '1px solid #2e303a', borderRadius: 4, cursor: 'pointer',  fontSize: 12}} title='Скачать сцену из RBXM'>
                        Скачать (RBXMX)
                    </button>
                    <button onClick={handleImport}
                    style={{ gridRow: '1 / span 2', gridColumn: '2', padding: '6px 8px', background: '#1a1b26', color: 'white', border: '1px dashed #aa3bff', borderRadius: 4, cursor: 'pointer',  fontSize: 12}} title='Выгрузить сцену из JSON'>
                        Загрузить из ...
                    </button>
                </div>
            </div>
        </div>
    )
}