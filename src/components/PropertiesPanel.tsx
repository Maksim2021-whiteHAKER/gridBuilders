// /scr/componetns/PropertiesPanel.tsx
import { useEffect, useState } from 'react';
import { useSceneStore } from '../store/sceneStore'

export function PropertiesPanel() {
    const { selectedIds, updateObj, deleteObj, clearSelection } = useSceneStore() 
    const objects = useSceneStore((state) => state.objects);
    const selectedObjects = objects.filter(obj => selectedIds.includes(obj.id));

    const [tempColor, setTempColor] = useState<string | null>(null)
    
    useEffect(() => {
        setTempColor(null);
    }, [selectedIds])

    if (selectedIds.length === 0){
        return (
            <div style={{
                position: 'absolute',
                top: 20,
                right: 20,
                width: 280,
                background: 'rgba(20, 21, 31, 0.95)',
                padding: 16,
                borderRadius: 8,
                border: '1px solid var(--border)',
                zIndex: 1000,
                color: '#9ca3af',
                textAlign: 'center'
            }}>
                Нет выделенного объекта
            </div>
        )
    }

    const isMultiObj = selectedIds.length > 1;
    const firstObj = selectedObjects[0];
    const displayColor = tempColor || firstObj.color;

    const handlePositionChange = (index: number, value: number) => {
        selectedObjects.forEach((obj) => {
            const newPos = [...obj.position] as [number, number, number]
            newPos[index] = value
            updateObj(obj.id, { position: newPos })
        })
    }

    const handleRotationChange = (index: number, value: number) => {
        selectedObjects.forEach((obj) => {
            const newRot = [...obj.rotation] as [number, number, number]
            newRot[index] = value
            updateObj(obj.id, { rotation: newRot })
        })
    }

    const handleScaleChange = (index: number, value: number) => {
        selectedObjects.forEach((obj) => {
            const newScale = [...obj.scale] as [number, number, number]
            newScale[index] = value
            updateObj(obj.id, { scale: newScale })
        })
    }

    const handleColorChange = (value: string) => {
        setTempColor(value);
        selectedObjects.forEach((obj) => {
            updateObj(obj.id, {color: value}, true)
        })
    }

    const handleColorFinalChange = (value: string) => {
        setTempColor(null);
        selectedObjects.forEach((obj) => {
            updateObj(obj.id, {color: value}, false)
        })
    }

    const deleteAll = () => {
        selectedIds.forEach((id) => deleteObj(id))
    }

    const inputStyle = {
        width: '100%', padding: '6px 8px', background: "#14151f", 
        border: '1px solid #2e303a', borderRadius: 4, color: '#e4e4e7', fontSize: 12
    }

    const labelStyle = {
        display: 'block', color: '#9ca3af', fontSize: 12, fontWeight: 500, marginBottom: 8
    }

    return (
        <div style={{
            position: 'absolute', top: 20, right: 20, width: 280,
            background: 'rgba(20, 21, 31, 0.95)', padding: 16, borderRadius: 8,
            border: '1px solid var(--border)', zIndex: 1000, display: 'flex', flexDirection: 'column',
            gap: 16, maxHeight: 'calc(100vh - 40px)', overflowY: 'auto'
            }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 4 }}>
                <h3 style={{ margin: 0, color: '#e4e4e7', fontSize: 16, fontWeight: 500 }}>
                    {isMultiObj ? `Выбрано объектов: ${selectedIds.length}` : 'Свойства объекта'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>
                    {isMultiObj ? `Типы: ${[...new Set(selectedObjects.map(o => o.type))].join(', ')}` : `${firstObj.type} • ${firstObj.id.slice(0, 8)}...`}
                </p>
            </div>

            {/* Позиция */}
            <div>
                <label style={labelStyle}>
                    Позиция {isMultiObj && '(применяется ко всем)'}
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                    {['X', 'Y', 'Z'].map((axis, i) => (
                        <div key={axis} style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: 10, color: axis === 'X' ? '#FF5F56' : axis === 'Y' ? '#48FF73' : '#1948FF', marginBottom: 4 }}>
                                {axis}
                            </label>
                            <input type="number" step="0.1" value={firstObj.position[i].toFixed(1)} onChange={(e) => handlePositionChange(i, parseFloat(e.target.value))}
                                style={inputStyle}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Вращение */}
            <div>
                <label style={labelStyle}>
                    Вращение (радианы) {isMultiObj && '(применяется ко всем)'}
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                    {['X', 'Y', 'Z'].map((axis, i) => (
                        <div key={axis} style={{ flex: 1 }}>
                            <input type="number" step="0.1" value={firstObj.rotation[i].toFixed(1)} onChange={(e) => handleRotationChange(i, parseFloat(e.target.value))} 
                            style={inputStyle}/>
                        </div>
                    ))}
                </div>
            </div>

            {/* Масштаб */}
            <div>
                <label style={labelStyle}>
                    Масштаб {isMultiObj && '(применяется ко всем)'}
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                    {['X', 'Y', 'Z'].map((axis, i) => (
                        <div key={axis} style={{ flex: 1 }}>
                            <input type="number" step="0.1" value={firstObj.scale[i].toFixed(1)} onChange={(e) => handleScaleChange(i, parseFloat(e.target.value))}
                                style={inputStyle}/>
                        </div>
                    ))}
                </div>
            </div>

            {/* Цвет */}
            <div>
                <label style={labelStyle}>
                    Цвет {isMultiObj && '(применяется ко всем)'}
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="color" value={firstObj.color} onChange={(e) => handleColorChange(e.target.value)} onMouseUp={() => handleColorFinalChange(displayColor)}
                    style={{ width: 40, height: 32, border: 'none', borderRadius: 4, cursor: 'pointer' }}/>
                    <input type="text" value={firstObj.color} onChange={(e) => handleColorChange(e.target.value)} onMouseUp={() => handleColorFinalChange(displayColor)}
                        style={{ flex: 1, padding: '6px 8px', background: '#14151f', border: '1px solid #2e303a', borderRadius: 4, color: '#e4e4e7', fontSize: 12 }}/>
                </div>
            </div>

                        {/* ✅ Текстура */}
                        <div>
                <label style={labelStyle}>
                    Текстура {isMultiObj && '(применяется к первому объекту)'}
                </label>

                {/* Превью текстуры */}
                {firstObj.textureUrl && (
                    <div style={{
                        marginBottom: 8,
                        position: 'relative',
                        borderRadius: 4,
                        overflow: 'hidden',
                        border: '1px solid #2e303a'
                    }}>
                        <img
                            src={firstObj.textureUrl}
                            alt="Texture preview"
                            style={{
                                width: '100%',
                                height: 80,
                                objectFit: 'cover',
                                display: 'block'
                            }}
                        />
                        <button
                            onClick={() => {
                                selectedObjects.forEach((obj) => {
                                    updateObj(obj.id, { textureUrl: undefined });
                                });
                            }}
                            style={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                background: 'rgba(255, 95, 86, 0.9)',
                                border: 'none',
                                borderRadius: 4,
                                color: 'white',
                                width: 24,
                                height: 24,
                                cursor: 'pointer',
                                fontSize: 16,
                                lineHeight: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Удалить текстуру"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Кнопка загрузки */}
                <button
                    onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                    const textureUrl = event.target?.result as string;
                                    // Применяем ко всем выделенным объектам
                                    selectedObjects.forEach((obj) => {
                                        updateObj(obj.id, { textureUrl });
                                    });
                                };
                                reader.readAsDataURL(file);
                            }
                        };
                        input.click();
                    }}
                    style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#14151f',
                        color: '#e4e4e7',
                        border: '1px dashed #2e303a',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12,
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = '#aa3bff';
                        e.currentTarget.style.background = '#1a1b26';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = '#2e303a';
                        e.currentTarget.style.background = '#14151f';
                    }}
                >
                    {firstObj.textureUrl ? '🔄 Заменить текстуру' : '📁 Загрузить текстуру'}
                </button>
            </div>

            {/* прозрачность */}
            <div>
                <label style={labelStyle}>
                    Прозрачность {isMultiObj && '(применяется ко всем)'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type='range' min='0' max='1' step='0.01' value={firstObj.opacity} onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        selectedObjects.forEach((obj) => {
                            updateObj(obj.id, {opacity: value})
                        });
                    }}
                    style={{flex: 1, cursor: 'pointer'}}
                    />
                    <span style={{minWidth: 40, fontSize: 12, color: '#e4e4e7', textAlign: 'center'}}>
                        {firstObj.opacity}
                    </span>
                </div>
            </div>

            {/* металлизированность */}
            <div>
                <label style={labelStyle}>
                    Металлизированность {isMultiObj && '(применяется ко всем)'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type='range' min='0' max='1' step='0.01' value={firstObj.metalness} onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        selectedObjects.forEach((obj) => {
                            updateObj(obj.id, {metalness: value})
                        });
                    }}
                    style={{flex: 1, cursor: 'pointer'}}
                    />
                    <span style={{minWidth: 40, fontSize: 12, color: '#e4e4e7', textAlign: 'center'}}>
                        {firstObj.metalness}
                    </span>
                </div>
            </div>

            {/* шероховатость */}
            <div>
                <label style={labelStyle}>
                    Шероховатость {isMultiObj && '(применяется ко всем)'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type='range' min='0' max='1' step='0.01' value={firstObj.roughness} onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        selectedObjects.forEach((obj) => {
                            updateObj(obj.id, {roughness: value})
                        });
                    }}
                    style={{flex: 1, cursor: 'pointer'}}
                    />
                    <span style={{minWidth: 40, fontSize: 12, color: '#e4e4e7', textAlign: 'center'}}>
                        {firstObj.roughness}
                    </span>
                </div>
            </div>

            {/* wireframe */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px', background: '#14151f', borderRadius: 4, border: '1px solid #2e303a'}}>
                <span style={{color: 'white', fontSize: 13, fontWeight: 200}}>
                    Режим сетки (Wireframe)
                </span>
                <label style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: 40,
                    height: 22,
                    cursor: 'pointer'
                }}>
                    <input
                        type="checkbox"
                        checked={firstObj.wireframe}
                        onChange={(e) => {
                            const value = e.target.checked;
                            selectedObjects.forEach((obj) => {
                                updateObj(obj.id, { wireframe: value });
                            });
                        }}
                        style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: firstObj.wireframe ? '#aa3bff' : '#2e303a',
                        borderRadius: 22,
                        transition: 'background-color 0.3s'
                    }}></span>
                    <span style={{
                        position: 'absolute',
                        height: 16,
                        width: 16,
                        left: firstObj.wireframe ? 21 : 3,
                        bottom: 3,
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: 'left 0.3s'
                    }}></span>
                </label>
            </div>

            {/* Кнопка удаления */}
            <button onClick={deleteAll}  
            style={{ padding: '10px 16px', background: '#FF5F56', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 500, marginTop: 8 }}>
                🗑️ Удалить выделенные (del) ({selectedIds.length})
            </button>
            <button
                onClick={() => clearSelection()}
                style={{ padding: '8px 16px', background: 'transparent', color: '#9ca3af', border: '1px solid #2e303a', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                Снять выделение
            </button>
        </div>
    )
}