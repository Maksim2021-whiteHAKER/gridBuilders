// src/components/ExportImportModal.tsx
import { useState } from 'react';

type Mode = 'export' | 'import';
type Format = 'json' | 'rbxmx' | 'glb';

interface Props {
    mode: Mode;
    onClose: () => void;
    onSelect: (format: Format) => void;
}

export function ExportImportModal({ mode, onClose, onSelect }: Props) {
    const [selectedFormat, setSelectedFormat] = useState<Format>('json');

    const formats = mode === 'export' 
        ? [
            { value: 'json' as Format, label: '💾 JSON', desc: 'Текстовый формат' },
            { value: 'rbxmx' as Format, label: ' RBXMX', desc: 'Roblox Studio' },
            { value: 'glb' as Format, label: '📦 GLB', desc: 'Универсальный 3D' }
        ]
        : [
            { value: 'json' as Format, label: '📂 JSON', desc: 'Текстовый формат' },
            { value: 'glb' as Format, label: '📦 GLB', desc: '3D модель' }
        ];

    const handleConfirm = () => {
        onSelect(selectedFormat);
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)', zIndex: 6000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: 'rgba(20, 21, 31, 0.98)',
                padding: 24, borderRadius: 12, border: '1px solid #2e303a',
                width: '90%', maxWidth: 320,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, color: '#e4e4e7', fontSize: 18, fontWeight: 600 }}>
                        {mode === 'export' ? '📤 Экспорт сцены' : ' Импорт сцены'}
                    </h3>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', color: '#9ca3af',
                        fontSize: 24, cursor: 'pointer', padding: 0
                    }}>✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                    {formats.map((fmt) => (
                        <label key={fmt.value} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px', background: selectedFormat === fmt.value ? '#14151f' : '#0a0b15',
                            border: `1px solid ${selectedFormat === fmt.value ? '#aa3bff' : '#2e303a'}`,
                            borderRadius: 8, cursor: 'pointer'
                        }}>
                            <input
                                type="radio"
                                name="format"
                                value={fmt.value}
                                checked={selectedFormat === fmt.value}
                                onChange={(e) => setSelectedFormat(e.target.value as Format)}
                                style={{ accentColor: '#aa3bff', width: 18, height: 18 }}
                            />
                            <div>
                                <div style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>{fmt.label}</div>
                                <div style={{ color: '#9ca3af', fontSize: 11 }}>{fmt.desc}</div>
                            </div>
                        </label>
                    ))}
                </div>

                <button onClick={handleConfirm} style={{
                    width: '100%', padding: '14px', background: '#aa3bff',
                    color: 'white', border: 'none', borderRadius: 8,
                    fontSize: 16, fontWeight: 600, cursor: 'pointer'
                }}>
                    {mode === 'export' ? '💾 Экспортировать' : '📂 Импортировать'}
                </button>
            </div>
        </div>
    );
}