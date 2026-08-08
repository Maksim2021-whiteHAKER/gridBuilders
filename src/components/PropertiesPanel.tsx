// /scr/componetns/PropertiesPanel.tsx
import { useSceneStore } from '../store/sceneStore'

export function PropertiesPanel() {
    const { selectedIds, updateObj, deleteObj, clearSelection } = useSceneStore()
    
    const objects = useSceneStore((state) => state.objects);
    const selectedObjects = objects.filter(obj => selectedIds.includes(obj.id));
    
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
        selectedObjects.forEach((obj) => {
            updateObj(obj.id, {color: value})
        })
    }

    const deleteAll = () => {
        selectedIds.forEach((id) => deleteObj(id))
    }

    const inputStyle = {
        width: '100%', padding: '6px 8px', background: "#14151f", 
        border: '1px solid #2e303a', borderRadius: 4, color: '#e4e4e7', fontSize: 13
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
                    {isMultiObj ? `Типы: ${[...new Set(selectedObjects.map(o => o.type))].join(', ')}` : `${firstObj.type} • {firstObj.id.slice(0, 8)}...`}
                </p>
            </div>

            {/* Позиция */}
            <div>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
                    Позиция {isMultiObj && '(применяется ко всем)'}
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                    {['X', 'Y', 'Z'].map((axis, i) => (
                        <div key={axis} style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: 10, color: axis === 'X' ? '#FF5F56' : axis === 'Y' ? '#48FF73' : '#1948FF', marginBottom: 4 }}>
                                {axis}
                            </label>
                            <input type="number" step="0.1" value={firstObj.position[i].toFixed(1)} onChange={(e) => handlePositionChange(i, parseFloat(e.target.value))}
                                style={{ width: '100%', padding: '6px 8px', background: '#14151f', border: '1px solid #2e303a', borderRadius: 4, color: '#e4e4e7', fontSize: 12 }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Вращение */}
            <div>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
                    Вращение (радианы) {isMultiObj && '(применяется ко всем)'}
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                    {['X', 'Y', 'Z'].map((axis, i) => (
                        <div key={axis} style={{ flex: 1 }}>
                            <input type="number" step="0.1" value={firstObj.rotation[i].toFixed(1)} onChange={(e) => handleRotationChange(i, parseFloat(e.target.value))} 
                            style={{ width: '100%', padding: '6px 8px', background: '#14151f', border: '1px solid #2e303a', borderRadius: 4, color: '#e4e4e7', fontSize: 12 }}/>
                        </div>
                    ))}
                </div>
            </div>

            {/* Масштаб */}
            <div>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
                    Масштаб {isMultiObj && '(применяется ко всем)'}
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                    {['X', 'Y', 'Z'].map((axis, i) => (
                        <div key={axis} style={{ flex: 1 }}>
                            <input type="number" step="0.1" value={firstObj.scale[i].toFixed(1)} onChange={(e) => handleScaleChange(i, parseFloat(e.target.value))}
                                style={{ width: '100%', padding: '6px 8px', background: '#14151f', border: '1px solid #2e303a', borderRadius: 4, color: '#e4e4e7', fontSize: 12 }}/>
                        </div>
                    ))}
                </div>
            </div>

            {/* Цвет */}
            <div>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
                    Цвет {isMultiObj && '(применяется ко всем)'}
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="color" value={firstObj.color} onChange={(e) => handleColorChange(e.target.value)}
                    style={{ width: 40, height: 32, border: 'none', borderRadius: 4, cursor: 'pointer' }}/>
                    <input type="text" value={firstObj.color} onChange={(e) => handleColorChange(e.target.value)}
                        style={{ flex: 1, padding: '6px 8px', background: '#14151f', border: '1px solid #2e303a', borderRadius: 4, color: '#e4e4e7', fontSize: 12 }}/>
                </div>
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