// /scr/componetns/PropertiesPanel.tsx
import { useEffect, useState } from 'react';
import { useSceneStore } from '../store/sceneStore'
import { useDeviceType } from '../hooks/useDeviceType';
import { GradientPicker } from './GradientPicker';
import { createGradientPreview } from '../utils/createGradientTexture';

export function PropertiesPanel() {
    const { selectedIds, updateObj, deleteObj, clearSelection } = useSceneStore()
    const objects = useSceneStore((state) => state.objects);
    const selectedObjects = objects.filter(obj => selectedIds.includes(obj.id));
    const deviceType = useDeviceType();
    const isSmall = deviceType === 'mobile' || deviceType === 'tablet';    

    const [tempColor, setTempColor] = useState<string | null>(null)
    const [stepValue, setStepValue] = useState(10);
   
    useEffect(() => {
        setTempColor(null);
    }, [selectedIds])         

    if (selectedIds.length === 0) {
        if (isSmall) {
            return null
        } else {
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
    }

    const isMultiObj = selectedIds.length > 1;
    const firstObj = selectedObjects[0];
    const displayColor = tempColor || firstObj.color;

    const openChoosingFiles = () => {
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
    }

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
            updateObj(obj.id, { color: value }, true)
        })
    }

    const handleColorFinalChange = (value: string) => {
        setTempColor(null);
        selectedObjects.forEach((obj) => {
            updateObj(obj.id, { color: value }, false)
        })
    }

    const deleteAll = () => {
        selectedIds.forEach((id) => deleteObj(id))
    }

    const changeMaterialProp = (prop: 'opacity' | 'metalness' | 'roughness', delta: number, positive: boolean) => {
        const current = firstObj[prop];
        let newValue;
        positive === true ? newValue = Math.max(0, Math.min(1, current + delta)) : newValue = Math.min(1, Math.max(0, current - delta));
        selectedObjects.forEach((obj) => updateObj(obj.id, {[prop]: newValue}));      
    }

    const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
        <div
            style={{
                width: 40,
                height: 22,
                background: checked ? '#aa3bff' : '#2e303a',
                borderRadius: 22,
                display: 'flex',
                alignItems: 'center',
                padding: 2,
                cursor: 'pointer',
                transition: 'background 0.2s'
            }}
            onClick={() => onChange(!checked)}
        >
            <div
                style={{
                    width: 16,
                    height: 16,
                    background: 'white',
                    borderRadius: '50%',
                    marginLeft: checked ? 18 : 2,
                    transition: 'margin-left 0.2s'
                }}
            />
        </div>
    );

    const inputStyle = {
        width: '100%', padding: '6px 8px', background: "#14151f",
        border: '1px solid #2e303a', borderRadius: 4, color: '#e4e4e7', fontSize: 12
    }

    const labelStyle = {
        display: 'block', color: '#9ca3af', fontSize: 12, fontWeight: 500, marginBottom: 8
    }

    const inputStyleMobile = {
        width: '100%', padding: '10px', background: "#0a0b15",
        border: '1px solid #2e303a', borderRadius: 8, color: '#e4e4e7', fontSize: 14
    }

    const labelStyleMobile = {
        display: 'block', color: '#9ca3af', fontSize: 12, fontWeight: 600, marginBottom: 8
    }

    const btnMobileStyle = {
        width: "24px", height: "24px", border: "none", borderRadius: 8, color: "white", 
        fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: "center", 
        justifyContent: "center", fontWeight: "bold", padding: 0, lineHeight: 1
    }

    const controlsContainerMobileStyle = {
        display: 'inline-flex', gap: "8px", alignItems: 'center'
    }

    const gradientShadowStyle = {
        top: 0, bottom: 0, width: 30, 
        zIndex: 10, 
    }

    const arrowIndicator = {
        top: "90%", transform: "translateY(-50%)", 
        color: "#ff8877", fontSize: 40, zIndex: 1000, 
    }

    if (isSmall) {
        return (
            <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0,
                background: 'rgba(20, 21, 31, 0.98)',
                borderBottom: '1px solid #2e303a',
                zIndex: 1000,
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                maxHeight: deviceType === 'tablet' ? '160px' : '130px'
            }}>
                <div style={{position: "absolute", left: 8, ...arrowIndicator, animation: "pulse 2s infinite"}}>⬅</div>
                <div style={{position: "absolute", right: 8, ...arrowIndicator, animation: "pulse 2s infinite"}}>➡</div>
                {/* Заголовок с кнопкой закрытия */}
                <div style={{
                    display: 'flex', alignItems: 'center', padding: '0px 10px', 
                    borderBottom: '1px solid #2e303a', borderRadius: '25%'
                }}>
                    <span style={{ flex: 1, textAlign: 'center', color: '#e4e4e7', fontSize: 20, fontWeight: 600, }}>
                        {isMultiObj ? `выделено объектов [${selectedIds.length}]` : firstObj.type}
                    </span>
                    <button 
                        onClick={clearSelection}
                        style={{ background: 'transparent', border: 'none', color: '#9ca3af', 
                        fontSize: 22, cursor: 'pointer', padding: 4 }}
                    >✕
                    </button>
                </div>

                {/* Горизонтальный скролл-контейнер */}
                <div style={{
                    position: "relative",
                    display: 'flex',
                    maxHeight: '130px',
                    overflowX: 'auto',
                    gap: 12,
                    padding: deviceType === 'tablet' ? '16px 20px 24px 32px' : '12px 16px 20px 16px',
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch', // Плавный скролл на iOS
                    scrollbarWidth: 'none',
                    borderRadius: '15%',
                }}>

                    <div style={{position: "absolute", left: 0, ...gradientShadowStyle, background: "linear-gradient(to right, (20, 21, 31, 0.98), transparent)", borderRadius: "30% 0 0 30%"}}></div>
                    <div style={{position: "absolute", right: 0, ...gradientShadowStyle, background: "linear-gradient(to left, (20, 21, 31, 0.98), transparent)", borderRadius: "0 15% 15% 0"}}></div>

                    <style>{`&::-webkit-scrollbar { display: none}`}</style>
                    <style>{`@keyframes pulse { 0, 100% {opacity: 0.3} 
                    50% {opacity: 0.6}}`}</style>
                    
                    
                    {/* Карточка: Позиция */}
                    <div style={{
                        minWidth: deviceType === 'tablet' ? 280 : 240, background: '#14151f', borderRadius: 12, padding: 14,
                        border: '1px solid #2e303a', scrollSnapAlign: 'start'
                    }}>
                        <label style={labelStyleMobile}>Позиция
                            <span style={{marginLeft: '30px', color: "rgb(255, 0, 0)"}}>X</span>
                            <span style={{marginLeft: '30px', color: "rgb(0, 255, 0)"}}>Y</span>
                            <span style={{marginLeft: '30px', color: "rgb(0, 235, 255)"}}>Z</span>
                            </label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {['X', 'Y', 'Z'].map((axis, i) => (
                                <div key={axis} style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: 11, color: axis === 'X' ? '#FF5F56' : axis === 'Y' ? '#48FF73' : '#1948FF', marginBottom: 4 }}></label>
                                    <input type="text" step="0.1" value={firstObj.position[i].toFixed(1)} onChange={(e) => handlePositionChange(i, parseFloat(e.target.value))} style={inputStyleMobile} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Карточка: Вращение */}
                    <div style={{
                        minWidth: 240, background: '#14151f', borderRadius: 12, padding: 6,
                        border: '1px solid #2e303a', scrollSnapAlign: 'start'
                    }}>
                        <label style={labelStyleMobile}>Вращение                            
                            <span style={{marginLeft: '30px', color: "rgb(255, 0, 0)"}}>X</span>
                            <span style={{marginLeft: '30px', color: "rgb(0, 255, 0)"}}>Y</span>
                            <span style={{marginLeft: '30px', color: "rgb(0, 235, 255)"}}>Z</span>
                        </label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {['X', 'Y', 'Z'].map((axis, i) => (
                                <div key={axis} style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: 11, color: axis === 'X' ? '#FF5F56' : axis === 'Y' ? '#48FF73' : '#1948FF', marginBottom: 4 }}></label>
                                    <input type="text" step="0.1" value={firstObj.rotation[i].toFixed(1)} onChange={(e) => handleRotationChange(i, parseFloat(e.target.value))} style={inputStyleMobile} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Карточка: Масштаб */}
                    <div style={{
                        minWidth: 240, background: '#14151f', borderRadius: 12, padding: 14,
                        border: '1px solid #2e303a', scrollSnapAlign: 'start'
                    }}>
                        <label style={labelStyleMobile}>Масштаб
                            <span style={{marginLeft: '30px', color: "rgb(255, 0, 0)"}}>X</span>
                            <span style={{marginLeft: '30px', color: "rgb(0, 255, 0)"}}>Y</span>
                            <span style={{marginLeft: '30px', color: "rgb(0, 235, 255)"}}>Z</span>
                        </label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {['X', 'Y', 'Z'].map((axis, i) => (
                                <div key={axis} style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: 11, color: axis === 'X' ? '#FF5F56' : axis === 'Y' ? '#48FF73' : '#1948FF', marginBottom: 4 }}></label>
                                    <input type="text" step="0.1" value={firstObj.scale[i].toFixed(1)} onChange={(e) => handleScaleChange(i, parseFloat(e.target.value))} style={inputStyleMobile} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Карточка: Цвет и Материалы */}
                    <div style={{
                        minWidth: firstObj.useGradient ? 480 : 380, background: '#14151f', borderRadius: 12, padding: 14,
                        border: '1px solid #2e303a', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', gap: 12
                    }}>
                        <div style={{ display: "flex", gap: 8 }}>
                            <label style={labelStyleMobile}>Цвет</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => selectedObjects.forEach((obj) => updateObj(obj.id, { useGradient: false }))}
                                    style={{
                                        flex: 0, padding: "8px", background: !firstObj.useGradient ? "#aa3bff" : "#14151f",
                                        color: "white", border: "1px solid #2e303a", borderRadius: 4,
                                        fontSize: 12, fontWeight: 600
                                    }}>
                                    Сплошной
                                </button>
                                <button onClick={() => selectedObjects.forEach((obj) => updateObj(obj.id, { useGradient: true }))}
                                    style={{
                                        flex: 0, padding: "8px", background: firstObj.useGradient ? "#aa3bff" : "#14151f",
                                        color: "white", border: "1px solid #2e303a", borderRadius: 4,
                                        fontSize: 12, fontWeight: 600
                                    }}>
                                    Градиент
                                </button>
                            </div>
                            {!firstObj.useGradient ? (
                                <div style={{display: "flex", gap: 6, alignItems: "center", marginRight: "auto"}}>
                                    <input type="color" value={firstObj.color}
                                    onChange={(e) => handleColorChange(e.target.value)}
                                    onMouseUp={() => handleColorFinalChange(displayColor)}
                                    style={{gridColumn: 2, width: 30, height: 30, border: "none", borderRadius: 8, 
                                    background: "none"}} />
                                    <input type="text" value={firstObj.color} onChange={(e) => handleColorChange(e.target.value)} onMouseUp={() => handleColorFinalChange(displayColor)}
                                    style={{background: "#0a0b15", border: "1px solid #2e303a", color: "#e4e4e7", padding: "4px 6px", borderRadius: 8,
                                    fontSize: 14, width: 110 }} />
                                </div>
                            ) : (
                                <div style={{marginRight: "auto", marginLeft: "auto", display: "flex", alignItems: "center", gap: 4}}>
                                    <div style={{width: 110, height: 24, borderRadius: 4,
                                        background: `url(${createGradientPreview({
                                            colors: firstObj.gradientColors || ["#ffffff", "#000000"],
                                            type: firstObj.gradientType || 'linear',
                                            angle: firstObj.gradientAngle || 0
                                        })})`,
                                        backgroundSize: "cover", border: "1px solid #2e303a"                                         
                                    }} />
                                    <div>
                                        <label style={{ color: 'lightgreen', fontSize: 12, display: 'flex', marginLeft: 4, textAlign: "center" }}>
                                            Угол: {firstObj.gradientAngle}°
                                        </label>
                                    </div>
                                    <button 
                                        style={{ width: "25px", height: "25px", background: "#00ff56", border: "1px solid #2e303a", borderRadius: 8 }}
                                        onClick={() => {
                                            if (firstObj.gradientAngle !== undefined) {
                                                const delta = stepValue
                                                const newAngle = Math.min(360, Math.max(0, firstObj.gradientAngle + delta))
                                                selectedObjects.forEach((obj) => updateObj(obj.id, { gradientAngle: newAngle }))
                                            }
                                        }}
                                    >➕
                                    </button>
                                    <button style={{ width: "25px", height: "25px", background: "#ff0022", border: "1px solid #2e303a", borderRadius: 8 }}
                                    onClick={() => {
                                        if (firstObj.gradientAngle !== undefined) {
                                            const delta = stepValue
                                            const newAngle = Math.max(0, Math.min(360, firstObj.gradientAngle - delta))
                                            selectedObjects.forEach((obj) => updateObj(obj.id, { gradientAngle: newAngle }))
                                        }
                                    }}
                                    >➖
                                    </button>
                                    <input id='inputAngle' type="number" title='Шаг изменения угла' min={1} max={100}
                                    value={stepValue} onChange={(e) => {
                                        const parsed = parseInt(e.target.value, 10);
                                        setStepValue(isNaN(parsed) ? 0 : parsed)
                                    }}
                                        style={{width: "35px", border: "1px solid #2e303a", borderRadius: 12,
                                            padding: "0 4px", textAlign: "center", backgroundColor: "#1e1027",
                                            color: "white", fontSize: 12
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                        { firstObj.useGradient && (
                            <GradientPicker
                                useGradient={true}
                                gradientColors={firstObj.gradientColors || ["#ffffff", "#000000"]}
                                gradientType={firstObj.gradientType || 'linear'}
                                gradientAngle={firstObj.gradientAngle || 0}
                                onChange={(updates) => {
                                    selectedObjects.forEach((obj) => updateObj(obj.id, updates))
                                }}
                            />
                        )}
                    </div>
                    <div style={{
                        minWidth: 240, background: '#14151f', borderRadius: 12, padding: 10,
                        border: '1px solid #2e303a', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', gap: 12
                    }}>
                        <div style={{display: "grid", gridTemplateColumns: "1fr 120px", gridTemplateRows: "1fr 60px", gap: 5, width: "100%", height: "100%",
                        }}>  
                        <div style={{ gridRow: "1", alignItems: "center", gap: 2 }}>
                            <label style={{ ...labelStyleMobile, position: "relative", marginBottom: 0 }}>Текстура</label>
                        </div>
                            <img src={firstObj.textureUrl}
                                style={{gridRow: "2", width: 100, height: 35, objectFit: "cover", borderRadius: 25 }}
                            />    

                            <button onClick={() => selectedObjects.forEach((obj) => {
                                updateObj(obj.id, { textureUrl: undefined });
                            })} style={{
                                gridRow: "1 / span 3", gridColumn: "2", width: "100%", height: 26, background: "#ff5F56", color: "white",
                                borderRadius: "30px", marginTop: 10, display: !firstObj.textureUrl ? "none" : "grid",
                            }}>{"Удалить текстуру"}
                            </button>

                            <button onClick={() => openChoosingFiles()}
                                style={{
                                    gridRow: "2", gridColumn: "2", width: "100%", height: 26, background: "#8007bd", color: "#ffffff", 
                                    borderRadius: "30px", fontSize: "12px", marginTop: 22
                                }}>{firstObj.textureUrl ? '🔄Замена текстуры' : '📁Загрузка текстуры'}
                            </button>
                        </div>
                    </div>
                    {firstObj.type !== 'text' && (
                        <div style={{
                            minWidth: 240, background: '#14151f', borderRadius: 12, padding: 14,
                            border: '1px solid #2e303a', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', gap: 12
                        }}>
                            <>
                                <div>
                                    <span style={{...labelStyleMobile, fontSize: "13px", display: "flex", justifyContent: "space-between"}}>Прозрачность: {firstObj.opacity.toFixed(2)}
                                    <span style={{marginLeft: '18px', ...controlsContainerMobileStyle, justifyContent: 'space-between'}}>
                                        <button onClick={() => changeMaterialProp('opacity', 0.05, true)} 
                                        style={{ ...btnMobileStyle, background: "#00ff56"}}>➕</button>
                                        <button onClick={() => changeMaterialProp('opacity', 0.05, false)} 
                                        style={{ ...btnMobileStyle, background: "#ff0022"}}>➖</button>
                                    </span>
                                    </span>                                
                                    <span style={{...labelStyleMobile, fontSize: "13px", display: "flex", justifyContent: "space-between"}}>Металличность: {firstObj.metalness.toFixed(2)}
                                    <span style={{marginLeft: "9px", ...controlsContainerMobileStyle}}>
                                    <button onClick={() => changeMaterialProp('metalness', 0.05, true)} 
                                        style={{ ...btnMobileStyle, background: "#00ff56"}}>➕</button>
                                        <button onClick={() => changeMaterialProp('metalness', 0.05, false)} 
                                        style={{ ...btnMobileStyle, background: "#ff0022"}}>➖</button>
                                    </span>
                                    </span>
                                </div>
                            </>
                        </div>                       
                    )}

                    {firstObj.type !== 'text' && (
                        <div style={{
                            minWidth: 240, background: '#14151f', borderRadius: 12, padding: 14,
                            border: '1px solid #2e303a', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', gap: 12
                        }}>
                            <>
                                <div>
                                    <span style={{...labelStyleMobile, fontSize: "13px", display: "flex", justifyContent: "space-between"}}>Шероховатость: {firstObj.roughness.toFixed(2)}
                                    <span style={{marginLeft: '18px', ...controlsContainerMobileStyle}}>
                                    <button onClick={() => changeMaterialProp('roughness', 0.05, true)} 
                                        style={{ ...btnMobileStyle, background: "#00ff56"}}>➕</button>
                                        <button onClick={() => changeMaterialProp('roughness', 0.05, false)} 
                                        style={{ ...btnMobileStyle, background: "#ff0022"}}>➖</button>
                                    </span>
                                    </span>                                
                                    <label style={{...labelStyleMobile, fontSize: "20px", display: "flex", justifyContent: "space-between"}}>Каркас: 
                                    <span style={{marginLeft: "15px", ...controlsContainerMobileStyle}}>
                                        <Toggle checked={firstObj.wireframe} onChange={(value) => {
                                            selectedObjects.forEach((obj) => updateObj(obj.id, {wireframe: value}))
                                        }}
                                        />
                                    </span>
                                    </label>
                                </div>
                            </>
                        </div>  
                    )}           
                </div>
                {/* Карточка: Текстура (если есть) или Действия */}
                <button onClick={deleteAll}
                    style={{
                        position: 'absolute', bottom: -40, right: 20,
                        padding: '4px', background: '#FF5F56', color: 'white', border: 'none',
                        borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer'
                    }}>
                    🗑️ Удалить ({selectedIds.length})
                </button>

                <button onClick={clearSelection}
                    style={{
                        position: 'absolute', bottom: -80, right: 20, padding: '4px', background: 'transparent', color: '#ffbbaa',
                        border: '1px solid #2e303a', backgroundColor: "rgb(50,90,255)", borderRadius: 8, fontSize: 14, cursor: 'pointer'
                    }}>
                    Снять выделение
                </button>
            </div>
        );
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
                                style={inputStyle} />
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
                                style={inputStyle} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Цвет */}
            <div>
                <label style={labelStyle}> Цвет {isMultiObj && '(применяется ко всем)'}</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <button onClick={() => selectedObjects.forEach((obj) => updateObj(obj.id, { useGradient: false }))}
                        style={{
                            flex: 1, padding: "8px", background: !firstObj.useGradient ? "#aa3bff" : "#14151f",
                            color: "white", border: "1px solid #2e303a", borderRadius: 4,
                            cursor: "pointer", fontSize: 12, fontWeight: 600
                        }}>
                        Сплошной
                    </button>
                    <button onClick={() => selectedObjects.forEach((obj) => updateObj(obj.id, { useGradient: true }))}
                        style={{
                            flex: 1, padding: "8px", background: firstObj.useGradient ? "#aa3bff" : "#14151f",
                            color: "white", border: "1px solid #2e303a", borderRadius: 4,
                            cursor: "pointer", fontSize: 12, fontWeight: 600
                        }}>
                        Градиент
                    </button>
                </div>
                    {!firstObj.useGradient ? (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input type="color" value={firstObj.color} onChange={(e) => handleColorChange(e.target.value)} onMouseUp={() => handleColorFinalChange(displayColor)}
                                style={{ width: 40, height: 32, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                            <input type="text" value={firstObj.color} onChange={(e) => handleColorChange(e.target.value)} onMouseUp={() => handleColorFinalChange(displayColor)}
                                style={{ flex: 1, padding: '6px 8px', background: '#14151f', border: '1px solid #2e303a', borderRadius: 4, color: '#e4e4e7', fontSize: 12 }} />
                        </div>
                    ) : (
                    <GradientPicker
                        useGradient={true}
                        gradientColors={firstObj.gradientColors || ["#ffffff", "#000000"]}
                        gradientType={firstObj.gradientType || 'linear'}
                        gradientAngle={firstObj.gradientAngle || 0}
                        onChange={(updates) => { 
                            selectedObjects.forEach((obj) => updateObj(obj.id, updates))
                        }}
                    />
                )}
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
                                borderRadius: "100%",
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
                        >×</button>
                    </div>
                )}

                {/* Кнопка загрузки */}
                <button
                    onClick={() => {
                        openChoosingFiles()                        
                    }}
                    style={{
                        width: '100%', padding: '8px 12px', background: '#14151f',
                        color: '#e4e4e7', border: '1px dashed #2e303a', borderRadius: 4,
                        cursor: 'pointer', fontSize: 12, transition: 'all 0.2s'
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

            {firstObj.type === 'text' && (
                <>
                    <div>
                        <label style={labelStyle}>Содержимое текста (Enter для новой строки)</label>
                        <textarea value={firstObj.text || ''} onChange={(e) => {
                            const val = e.target.value;
                            selectedObjects.forEach((obj) => {
                                if (obj.type === 'text') { updateObj(obj.id, { text: val }) };
                            });
                        }} rows={4} style={inputStyle} placeholder="Введите текст...&#10;Enter = новая строка"/>
                    </div>
                    <div>
                        <label style={labelStyle}>Размер шрифта</label>
                        <input type='number' min='0.1' step='0.1' value={firstObj.fontSize || 1} onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            selectedObjects.forEach((obj) => {
                                if (obj.type === 'text') { updateObj(obj.id, { fontSize: value }) };
                            });
                        }}
                            style={{ flex: 1, cursor: 'pointer' }}
                        />
                    </div>
                </>
            )}

            {firstObj.type !== 'text' && (
                <>
                    {/* прозрачность */}
                    <div>
                        <label style={labelStyle}>
                            Прозрачность {isMultiObj && '(применяется ко всем)'}
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type='range' min='0' max='1' step='0.01' value={firstObj.opacity} onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                selectedObjects.forEach((obj) => {
                                    updateObj(obj.id, { opacity: value })
                                });
                            }}
                                style={{ flex: 1, cursor: 'pointer' }}
                            />
                            <span style={{ minWidth: 40, fontSize: 12, color: '#e4e4e7', textAlign: 'center' }}>
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
                                    updateObj(obj.id, { metalness: value })
                                });
                            }}
                                style={{ flex: 1, cursor: 'pointer' }}
                            />
                            <span style={{ minWidth: 40, fontSize: 12, color: '#e4e4e7', textAlign: 'center' }}>
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
                                    updateObj(obj.id, { roughness: value })
                                });
                            }}
                                style={{ flex: 1, cursor: 'pointer' }}
                            />
                            <span style={{ minWidth: 40, fontSize: 12, color: '#e4e4e7', textAlign: 'center' }}>
                                {firstObj.roughness}
                            </span>
                        </div>
                    </div>

                    {/* wireframe */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px', background: '#14151f', borderRadius: 4, border: '1px solid #2e303a' }}>
                        <span style={{ color: 'white', fontSize: 13, fontWeight: 200 }}>
                            Режим сетки (Wireframe)
                        </span>
                        <label style={{
                            position: 'relative',
                            display: 'inline-block',
                            width: 40,
                            height: 22,
                            cursor: 'pointer'
                        }}>
                            <Toggle checked={firstObj.wireframe} onChange={(value) => {
                                selectedObjects.forEach((obj) => updateObj(obj.id, { wireframe: value }))
                            }}/>                        
                            </label>
                    </div>
                </>
                )
            }

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