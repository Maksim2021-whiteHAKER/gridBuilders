import { useState } from 'react';

export function MobileTutorial({ onClose }: { onClose: () => void }) {
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: ' Добро пожаловать!',
            text: 'Это мобильный 3D-редактор. Давай покажу, как им пользоваться.',
            image: '🎨'
        },
        {
            title: '️ Управление камерой',
            text: 'Используй ЛЕВЫЙ джойстик для вращения камеры. Просто води пальцем по левой части экрана.',
            image: ''
        },
        {
            title: '🎯 Выбор объекта',
            text: 'Коснись любого объекта на сцене, чтобы выделить его. Появится фиолетовая рамка.',
            image: '📦'
        },
        {
            title: '✋ Режимы трансформации',
            text: 'Используй кнопки справа: ↕️ перемещение, 🔄 вращение,  масштаб.',
            image: '🔧'
        },
        {
            title: '📊 Свойства объекта',
            text: 'Сверху появится панель с настройками. Свайпай влево/вправо для просмотра всех карточек.',
            image: '📱'
        },
        {
            title: '🎉 Готово!',
            text: 'Теперь ты можешь создавать 3D-модели прямо с телефона! Удачи! 🚀',
            image: '🏆'
        }
    ];

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
        }}>
            <div style={{
                background: 'rgba(20, 21, 31, 0.98)',
                borderRadius: 20,
                padding: 30,
                maxWidth: 350,
                textAlign: 'center',
                border: '1px solid #2e303a'
            }}>
                <div style={{ fontSize: 60, marginBottom: 20 }}>{steps[step].image}</div>
                <h2 style={{ color: '#e4e4e7', fontSize: 24, marginBottom: 15 }}>
                    {steps[step].title}
                </h2>
                <p style={{ color: '#9ca3af', fontSize: 16, lineHeight: 1.5, marginBottom: 25 }}>
                    {steps[step].text}
                </p>
                
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    {step > 0 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            style={{
                                padding: '12px 24px',
                                background: 'transparent',
                                color: '#9ca3af',
                                border: '1px solid #2e303a',
                                borderRadius: 8,
                                fontSize: 14,
                                cursor: 'pointer'
                            }}
                        >
                            ← Назад
                        </button>
                    )}
                    {step < steps.length - 1 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            style={{
                                padding: '12px 24px',
                                background: '#aa3bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Далее →
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            style={{
                                padding: '12px 24px',
                                background: '#48FF73',
                                color: '#0a0b15',
                                border: 'none',
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Начать! 🚀
                        </button>
                    )}
                </div>

                {/* Индикатор шагов */}
                <div style={{ 
                    display: 'flex', 
                    gap: 6, 
                    justifyContent: 'center', 
                    marginTop: 20 
                }}>
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            style={{
                                width: i === step ? 20 : 8,
                                height: 8,
                                borderRadius: 4,
                                background: i === step ? '#aa3bff' : '#2e303a',
                                transition: 'all 0.3s'
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}