// src/components/GradientPicker.tsx
import { useState } from 'react';
import { createGradientPreview } from '../utils/createGradientTexture';
import { useDeviceType } from '../hooks/useDeviceType';

interface Props {
    useGradient: boolean;
    gradientColors: string[];
    gradientType: 'linear' | 'radial';
    gradientAngle: number;
    onChange: (updates: {
        useGradient: boolean;
        gradientColors: string[];
        gradientType: 'linear' | 'radial';
        gradientAngle: number;
    }) => void;
}

export function GradientPicker({ 
    useGradient, 
    gradientColors, 
    gradientType, 
    gradientAngle,
    onChange 
}: Props) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const deviceType = useDeviceType()
    const isSmall = deviceType === 'mobile' || deviceType === 'tablet'

    const addColor = () => {
        if (gradientColors.length < 3) {
            onChange({
                useGradient,
                gradientColors: [...gradientColors, '#ffffff'],
                gradientType,
                gradientAngle
            });
        }
    };

    const removeColor = (index: number) => {
        if (gradientColors.length > 2) {
            const newColors = gradientColors.filter((_, i) => i !== index);
            onChange({ useGradient, gradientColors: newColors, gradientType, gradientAngle });
        }
    };

    const updateColor = (index: number, color: string) => {
        const newColors = [...gradientColors];
        newColors[index] = color;
        onChange({ useGradient, gradientColors: newColors, gradientType, gradientAngle });
    };

    const preview = createGradientPreview({
        colors: gradientColors,
        type: gradientType,
        angle: gradientAngle
    });

    if (isSmall) { 
        return (
            <div 
                style={{padding: 1, marginRight: 1, background: "#14151f", border: "1px solid #2e303a",
                    borderRadius: 8, 
                }}>
                {/* Цвета */}
                <div style={{ display: 'flex', gap: 0, }}>
                    {gradientColors.map((color, index) => (
                        <div key={index} style={{ position: 'relative', flex: 1 }}>
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => updateColor(index, e.target.value)}
                                style={{
                                    width: 55, height: 27, border: 'none',
                                    borderRadius: 8, background: 'none'
                                }}
                            />
                            {gradientColors.length > 2 && (
                                <button
                                    onClick={() => removeColor(index)}
                                    style={{
                                        position: 'absolute',
                                        top: -4, right: 40,
                                        width: 18, height: 18,
                                        background: '#FF5F56', color: 'white', border: 'none',
                                        borderRadius: '50%', fontSize: 10,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    ❌
                                </button>
                            )}
                        </div>
                    ))}
                    {gradientColors.length < 3 && (
                        <button
                            onClick={addColor}
                            style={{
                                width: 32, height: 32, background: '#2e303a', color: 'white',
                                border: '1px dashed #aa3bff', borderRadius: 4,
                                fontSize: 18, marginRight: "15%"
                            }}
                        >
                            +
                        </button>
                    )}
                    <div style={{border: "none", borderRadius: 12, }}>
                        <label htmlFor="typeGradient" style={{marginRight: 8, fontSize: 12, color: "#9aa0b3"}}>Тип: </label>
                        <select id="typeGradient"
                            value={gradientType}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                onChange({useGradient, gradientColors, 
                                    gradientType: e.target.value === 'linear' ? "linear" : 'radial', 
                                    gradientAngle
                                })
                            }} style={{
                                padding: "2px 4px", backgroundColor: "#25262f", color: "white",
                                border: '1px solid #2e303a', borderRadius: 8
                            }}
                        >
                            <option value="linear">↔ Линейный</option>
                            <option value="radial">⭕ Радиусный</option>
                        </select>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div style={{
            padding: 12,
            background: '#14151f',
            border: '1px solid #2e303a',
            borderRadius: 6,
            marginTop: 8
        }}>
            {/* Заголовок с переключателем */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <label style={{ color: 'white', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    🎨 Градиент
                    <input
                        type="checkbox"
                        checked={useGradient}
                        onChange={(e) => onChange({ useGradient: e.target.checked, gradientColors, gradientType, gradientAngle })}
                        style={{ accentColor: '#aa3bff', width: 16, height: 16 }}
                    />
                </label>
                {useGradient && (
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#9ca3af',
                            fontSize: 12,
                            cursor: 'pointer'
                        }}
                    >
                        {showAdvanced ? '▲ Скрыть' : '▼ Настройки'}
                    </button>
                )}
            </div>

            {useGradient && (
                <>
                    {/* Превью */}
                    <div style={{
                        width: '100%',
                        height: 40,
                        borderRadius: 4,
                        backgroundImage: `url(${preview})`,
                        backgroundSize: 'cover',
                        marginBottom: 12,
                        border: '1px solid #2e303a'
                    }} />

                    {/* Цвета */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        {gradientColors.map((color, index) => (
                            <div key={index} style={{ position: 'relative', flex: 1 }}>
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => updateColor(index, e.target.value)}
                                    style={{
                                        width: '100%',
                                        height: 32,
                                        border: 'none',
                                        borderRadius: 4,
                                        cursor: 'pointer',
                                        background: 'none'
                                    }}
                                />
                                {gradientColors.length > 2 && (
                                    <button
                                        onClick={() => removeColor(index)}
                                        style={{
                                            position: 'absolute',
                                            top: -4,
                                            right: -4,
                                            width: 18,
                                            height: 18,
                                            background: '#FF5F56',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            fontSize: 10,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        ❌
                                    </button>
                                )}
                            </div>
                        ))}
                        {gradientColors.length < 3 && (
                            <button
                                onClick={addColor}
                                style={{
                                    width: 32,
                                    height: 32,
                                    background: '#2e303a',
                                    color: 'white',
                                    border: '1px dashed #aa3bff',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    fontSize: 18
                                }}
                            >
                                +
                            </button>
                        )}
                    </div>

                    {/* Расширенные настройки */}
                    {showAdvanced && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {/* Тип градиента */}
                            <div style={{ display: 'flex', gap: 4 }}>
                                <button
                                    onClick={() => onChange({ useGradient, gradientColors, gradientType: 'linear', gradientAngle })}
                                    style={{
                                        flex: 1,
                                        padding: '6px',
                                        background: gradientType === 'linear' ? '#aa3bff' : '#14151f',
                                        color: 'white',
                                        border: '1px solid #2e303a',
                                        borderRadius: 4,
                                        cursor: 'pointer',
                                        fontSize: 12
                                    }}
                                >
                                    ↔️ Линейный
                                </button>
                                <button
                                    onClick={() => onChange({ useGradient, gradientColors, gradientType: 'radial', gradientAngle })}
                                    style={{
                                        flex: 1,
                                        padding: '6px',
                                        background: gradientType === 'radial' ? '#aa3bff' : '#14151f',
                                        color: 'white',
                                        border: '1px solid #2e303a',
                                        borderRadius: 4,
                                        cursor: 'pointer',
                                        fontSize: 12
                                    }}
                                >
                                    ⭕ Радиальный
                                </button>
                            </div>

                            {/* Угол (только для линейного) */}
                            {gradientType === 'linear' && (
                                <div>
                                    <label style={{ color: '#9ca3af', fontSize: 11, display: 'block', marginBottom: 4 }}>
                                        Угол: {gradientAngle}°
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="360"
                                        value={gradientAngle}
                                        onChange={(e) => onChange({ useGradient, gradientColors, gradientType, gradientAngle: parseInt(e.target.value) })}
                                        style={{ width: '100%', accentColor: '#aa3bff' }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}