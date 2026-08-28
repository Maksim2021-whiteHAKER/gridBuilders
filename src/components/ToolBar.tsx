// /src/components/ToolBar.tsx
import { useState } from 'react'
import { useSceneStore } from "../store/sceneStore";
import { useDeviceType } from '../hooks/useDeviceType';
import { ExportImportModal } from './ExportImportModal';

type ObjectType = 'box' | 'sphere' | 'cylinder' | 'cone' | 'tor' | 'pyramid' | 'text';

const OBJECT_TYPES: {value: ObjectType, name: string, icon: string}[] = [
    { value: 'box', name: 'Куб', icon: '🔲' },
    { value: 'sphere', name: 'Шар', icon: '🔘'},
    { value: 'cylinder', name: 'Цилиндр', icon: '💈'},
    { value: 'cone', name: 'Конус', icon: '🎉'},
    { value: 'tor', name: 'Тор', icon: '⭕'},
    { value: 'pyramid', name: 'Пирамида', icon: '🔺'},
    { value: 'text', name: 'Текст', icon: '🔤'}
]

export function generatedId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return "obj_" + Date.now() + Math.random().toString(36).substring(2, 9);
}

function handleImportType(acceptImport: string, importType: any ) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = acceptImport;
    input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        
        if (acceptImport === '.json') {
            const reader = new FileReader();
            reader.onload = (eventRead) => {
                const json = eventRead.target?.result as string;
                const success = importType(json);
                if (!success) alert("Сцена не загружена, проверьте формат, он должен быть JSON");
            };
            reader.readAsText(file);
        } else if (acceptImport === '.glb,.gltf') { 
            importType(file, (success: boolean) => { 
                if (success) console.log("Формат glb успешно импортирован"); else {
                    alert("Ошибка при импорте GLB, убедитесь что 3д модель правильная");
                }
            }); 
        } else if (acceptImport === '.obj') {
            importType(file, (success: boolean) => { 
                if (success) console.log("Формат glb успешно импортирован"); else {
                    alert("Ошибка при импорте GLB, убедитесь что 3д модель правильная");
                }
            });
        }
    };
    input.click();
}

export function ToolBar({onAuthClick, user, onSignOut, onOpenProjects}: {
    onAuthClick: () => void, user: any, onSignOut: () => void, onOpenProjects: () => void
}){
    const camera = useSceneStore((state) => state.camera);
    const controls = useSceneStore((state) => state.controls);
    const addObject = useSceneStore((state) => state.addObj);
    const [selectedType, setSelectedType] = useState<ObjectType>('box');
    const exportToJSON = useSceneStore((state) => state.exportJSON);
    const exportToRBXM = useSceneStore((state) => state.exportRBXM);
    const exportToGLB = useSceneStore((state) => state.exportGLB);
    const importToJSON = useSceneStore((state) => state.importJSON);
    const importToGLB = useSceneStore((state) => state.importGLB);
    const importToOBJ = useSceneStore((state) => state.importOBJ);

    const { transformMode, setTransformMode, selectedIds, undo, redo, canUndo, canRedo, snapEnabled, toggleSnap } = useSceneStore();

    const deviceType = useDeviceType();
    const isSmall = deviceType === 'mobile' || deviceType === 'tablet';
    const [isExpanded, setIsExpanded] = useState(false);
    const [isExpandedAutorized, setIsExpandedAutorized] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    const handleAddObject = () => {
        const newObject = {
            id: generatedId(),
            type: selectedType,
            position: [0, 0, 0] as [number, number, number],
            rotation: [0, 0, 0] as [number, number, number],
            scale: [5, 5, 5] as [number, number, number],
            color: '#bf8ff3',
            opacity: 1.0,
            metalness: 0.0,
            roughness: 0.5,
            wireframe: false
        }
        addObject(newObject)        
    }  

    // ✅ Вынесенная функция сброса камеры
    const handleResetCamera = () => {
        if (!camera || !controls) return;
        camera.position.set(25, 25, 25);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
        controls.update();
    }

    if (isSmall) {
        return (
            <>
                <div style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(20, 21, 31, 0.98)',
                    borderTop: '1px solid #2e303a', padding: deviceType === 'tablet' ? '10px 24px' : '8px 12px',
                    zIndex: 1000, display: 'flex', flexDirection: deviceType === 'tablet' ? 'row' : 'column',
                    gap: deviceType === 'tablet' ? 16 : 8, justifyContent: "space-between"
                }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value as ObjectType)}
                            style={{
                                flex: 1, padding: '12px', background: '#14151f', color: 'white', border: '1px solid #2e303a',
                                borderRadius: 8, fontSize: 14, minHeight: 44
                            }}>
                            {OBJECT_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.icon} {type.name}
                                </option>
                            ))}
                        </select>
                        <button onClick={handleAddObject}
                            style={{
                                padding: '12px 20px', background: '#aa3bff', color: 'white', border: 'none',
                                borderRadius: 8, fontSize: 14, fontWeight: 600, minHeight: 44, whiteSpace: 'nowrap'
                            }}>Добавить
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                            {(['translate', 'rotate', 'scale'] as const).map((mode) => (
                                <button key={mode} onClick={() => setTransformMode(mode)}
                                    style={{
                                        flex: 1, padding: '10px 4px', background: transformMode === mode ? '#aa3bff' : '#14151f',
                                        color: 'white', border: '1px solid #2e303a', borderRadius: 6,
                                        fontSize: deviceType === 'tablet' ? 16 : 12, minHeight: 40, minWidth: 75
                                    }}>
                                    {mode === 'translate' ? '↕️' : mode === 'rotate' ? '🔄' : '⤢'}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowExportModal(true)}
                            style={{
                                padding: '10px 16px', background: '#1a1b26', color: 'white',
                                border: '1px dashed #aa3bff', borderRadius: 6, fontSize: 12, fontWeight: 600,
                                minHeight: 40, whiteSpace: 'nowrap'
                            }}>
                                📤 Exp
                        </button>
                        <button onClick={() => setShowImportModal(true)}
                            style={{
                                padding: '10px 16px', background: '#1a1b26', color: 'white',
                                border: '1px dashed #aa3bff', borderRadius: 6, fontSize: 12, fontWeight: 600,
                                minHeight: 40, whiteSpace: 'nowrap'
                            }}>
                                📥 Imp
                        </button>
                    </div>
                </div>
                <button onClick={() => setIsExpanded(!isExpanded)}
                    style={{
                        position: 'fixed', bottom: 85, right: 12, height: 48, width: 48, background: 'rgba(20, 21, 31, 0.95)',
                        border: '1px solid #2e303a', borderRadius: '50%', color: 'white', fontSize: 20, cursor: 'pointer',
                        zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}>
                    {isExpanded ? '✕' : '⚙️'}
                </button>
                {isExpanded && (
                    <div style={{
                        position: 'fixed', bottom: 85, right: 122, width: 200, background: 'rgba(20, 21, 31, 0.98)',
                        border: '1px solid #2e303a', borderRadius: 12, padding: 12,
                        zIndex: 1001, display: 'flex', flexDirection: 'column', gap: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}>
                        <button onClick={undo} disabled={!canUndo()}
                            style={{
                                padding: '10px', background: canUndo() ? '#14151f' : '#0a0b15', color: canUndo() ? 'white' : '#6d7280',
                                border: '1px solid #2e303a', borderRadius: 6, fontSize: 13, minHeight: 44, textAlign: 'left'
                            }}>
                            ↶ Отмена
                        </button>
                        <button onClick={redo} disabled={!canRedo()}
                            style={{
                                padding: '10px', background: canRedo() ? '#14151f' : '#0a0b15', color: canRedo() ? 'white' : '#6d7280',
                                border: '1px solid #2e303a', borderRadius: 6, fontSize: 13, minHeight: 44, textAlign: 'left'
                            }}>
                            ↷ Вернуть
                        </button>
                        
                        {/* ✅ Кнопка сброса камеры для мобильных */}
                        <button onClick={handleResetCamera}
                            style={{
                                padding: '10px', background: '#2e303a', color: 'white', border: 'none',
                                borderRadius: 6, fontSize: 13, minHeight: 44, fontWeight: 600, textAlign: 'left'
                            }}>
                            🔄 Сброс камеры
                        </button>

                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px',
                            background: '#14151f', borderRadius: 6, border: '1px solid #2e303a'
                        }}>
                            <span style={{ color: 'white', fontSize: 13 }}>Привязка к сетке</span>
                            <input type='checkbox' checked={snapEnabled} onChange={toggleSnap} style={{ width: 20, height: 20, accentColor: '#aa3bff' }} />
                        </div>
                    </div>                   
                )}
                <button onClick={() => setIsExpandedAutorized(!isExpandedAutorized)}
                    style={{
                        position: 'fixed', bottom: 85, right: 70, height: 48, width: 48, background: 'rgba(20, 21, 31, 0.95)',
                        border: '1px solid #2e303a', borderRadius: '50%', color: 'white', fontSize: 20, cursor: 'pointer',
                        zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}> {isExpandedAutorized ? "✕" : "⚙👤"}
                </button>
                {isExpandedAutorized && (
                    <div style={{
                        position: 'fixed', bottom: 85, right: 122, width: 200, background: 'rgba(20, 21, 31, 0.98)',
                        border: '1px solid #2e303a', borderRadius: 12, padding: 1,
                        zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}>
                        <AuthBlock user={user} onAuthClick={onAuthClick} onSignOut={onSignOut} isSmall={true} />
                        <button
                            onClick={() => user ? onOpenProjects() : onAuthClick()}
                            style={{
                                padding: 8, background: user ? "#14151f" : "#0a0b15",
                                color: user ? "white" : "#9ca3af",
                                border: user ? "1px solid #2e303a" : "1px dashed #aa3bff",
                                borderRadius: 8, cursor: "pointer", fontSize: 12,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                gap: 6, marginTop: "5px"
                            }}>
                            {user ? "📁 Мои проекты" : "🔐 Войти для доступа к облаку"}
                        </button>
                    </div>
                )}
                {showExportModal && (
                    <ExportImportModal
                        mode="export"
                        onClose={() => setShowExportModal(false)}
                        onSelect={(format) => {
                            if (format === 'json') exportToJSON();
                            else if (format === 'rbxmx') exportToRBXM();
                            else if (format === 'glb') exportToGLB();
                        }}
                    />
                )}
                {showImportModal && (
                    <ExportImportModal
                        mode="import"
                        onClose={() => setShowImportModal(false)}
                        onSelect={(format) => {
                            if (format === 'json') handleImportType('.json', importToJSON);
                            else if (format === 'glb') handleImportType('.glb,.gltf', importToGLB);
                            else if (format === 'obj') handleImportType('.obj', importToOBJ);
                        }}
                    />
                )}
            </>
        );
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
            minWidth: 250
        }}>
            <label style={{ color: 'rgb(255, 255, 255)', fontSize: 13, fontWeight: 200 }}>Тип объекта</label>
            
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value as ObjectType)}
            style={{
                padding: '8px 12px', background: '#14151f', color: 'rgb(255, 255, 255)',
                border: '1px solid rgba(255, 255, 210, 0.8)', borderRadius: 4, cursor: 'pointer', fontSize: 14
            }}>
                {OBJECT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.name}</option>
                ))}
            </select>

            <button onClick={handleAddObject} style={{
                padding: '8px 16px', background: 'var(--accent, #aa3bff)', color: 'white',
                border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500
            }}>
                Добавить Объект
            </button>

            {/* Undo/Redo и Сброс камеры */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={undo} disabled={!canUndo()} style={{
                        flex: 1, padding: '6px 8px', background: canUndo() ? '#14151f' : '#0a0b15',
                        color: canUndo() ? 'white' : '#6b7280', border: '1px solid #2e303a', borderRadius: 4,
                        cursor: canUndo() ? 'pointer' : 'not-allowed', fontSize: 12, opacity: canUndo() ? 1 : 0.5
                    }}>↶ Отмена</button>
                    <button onClick={redo} disabled={!canRedo()} style={{
                        flex: 1, padding: '6px 8px', background: canRedo() ? '#14151f' : '#0a0b15',
                        color: canRedo() ? 'white' : '#6b7280', border: '1px solid #2e303a', borderRadius: 4,
                        cursor: canRedo() ? 'pointer' : 'not-allowed', fontSize: 12, opacity: canRedo() ? 1 : 0.5
                    }}>↷ Вернуть</button>
                </div>
                
                {/* ✅ Кнопка сброса камеры для десктопа */}
                <button
                    onClick={handleResetCamera}
                    style={{
                        width: '100%',
                        padding: '8px',
                        background: '#2e303a',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#3e404a'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#2e303a'}
                    title="Вернуть камеру в стандартное положение (25, 25, 25)"
                >
                    🔄 Сброс камеры
                </button>
            </div>

            {selectedIds.length > 0 && (
                <>
                    <label style={{ color: 'rgb(255,255,255)', fontSize: 13, fontWeight: 200, marginTop: 8 }}>Тип управления</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setTransformMode('translate')} style={{
                            flex: 1, padding: '6px 8px', background: transformMode === 'translate' ? '#aa3bff' : '#14151f',
                            color: 'white', border: '1px solid #2e303a', borderRadius: 4, cursor: 'pointer', fontSize: 12
                        }}>↕️ W</button>
                        <button onClick={() => setTransformMode('rotate')} style={{
                            flex: 1, padding: '6px 8px', background: transformMode === 'rotate' ? '#aa3bff' : '#14151f',
                            color: 'white', border: '1px solid #2e303a', borderRadius: 4, cursor: 'pointer', fontSize: 12
                        }}>🔄 R</button>
                        <button onClick={() => setTransformMode('scale')} style={{
                            flex: 1, padding: '6px 8px', background: transformMode === 'scale' ? '#aa3bff' : '#14151f',
                            color: 'white', border: '1px solid #2e303a', borderRadius: 4, cursor: 'pointer', fontSize: 12
                        }}>⤢ S</button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, padding: '8px 12px', background: '#14151f', borderRadius: 4, border: '1px solid #2e303a' }}>
                        <span style={{color: 'white', fontSize: 13, fontWeight: 200}}>Привязка к сетке</span>
                        <label style={{position: 'relative', display: 'inline-block', width: 40, height: 22, cursor: 'pointer'}}>
                            <input type='checkbox' checked={snapEnabled} onChange={toggleSnap} style={{opacity: 0, width: 0, height: 0}}/>
                            <span style={{
                                position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, 
                                backgroundColor: snapEnabled ? '#aa3bff' : '#2e303a', borderRadius: 22, transition: 'background-color 0.3s'
                            }}></span>
                            <span style={{
                                position: 'absolute', height: 16, width: 16, left: snapEnabled ? 21 : 3, bottom: 3, 
                                backgroundColor: 'white', borderRadius: '50%', transition: 'left 0.3s'
                            }}></span>
                        </label>
                    </div>
                </>
            )}

            <div style={{marginTop: 8, paddingTop: 12, borderTop: '1px solid #2e303a', display: 'flex', flexDirection: 'column', gap: 6}}>
                <label style={{color: 'white', fontSize: 12, fontWeight: 200}}>Сохранение / загрузка</label>
                <div style={{display: "flex", gap: 4}}>
                    <select id="exportFormat" 
                    style={{flex: 1, padding: "8px", background: "#14151f", color: "white", border: "1px solid #2e303a", 
                        borderRadius: 4, cursor: "pointer", fontSize: 12, outline: "none"
                    }}>
                        <option value="json">💾 JSON</option>
                        <option value="rbxmx">🧱 RBXMX</option>
                        <option value="glb">📦 GLB</option>
                    </select>
                    <button 
                        onClick={() => {
                            const format = (document.getElementById('exportFormat') as HTMLSelectElement)?.value;
                            if (format === "json") exportToJSON();
                            else if (format === "rbxmx") exportToRBXM();
                            else if (format === "glb") exportToGLB();
                        }} 
                        style={{padding: "8px 12px", background: "#aa3bff", color: "white", border: "none",
                            borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap"
                        }}                    
                    >
                       {"<- Экспорт формата"}
                    </button>
                </div>
                <div style={{display: "flex", gap: 4}}>
                    <select id="importFormat" 
                    style={{flex: 1, padding: "8px", background: "#14151f", color: "white", border: "1px solid #2e303a", 
                        borderRadius: 4, cursor: "pointer", fontSize: 12, outline: "none"
                    }}>
                        <option value="impjson">📂 Импорт JSON</option>
                        <option value="imprbxmx">Импорт GLB</option>
                        <option value="impobj">Импорт OBJ</option>
                    </select>
                    <button 
                        onClick={() => {
                            const format = (document.getElementById('importFormat') as HTMLSelectElement)?.value;
                            if (format === "impjson") handleImportType('.json', importToJSON);
                            else if (format === "imprbxmx") handleImportType('.glb,.gltf', importToGLB);
                            else if (format === 'impobj') handleImportType('.obj', importToOBJ);
                        }} 
                        style={{padding: "8px 12px", background: "#aa3bff", color: "white", border: "none",
                            borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap"
                        }}                    
                    >
                       {"<- Импорт формата"}
                    </button>
                </div>
                <AuthBlock user={user} onAuthClick={onAuthClick} onSignOut={onSignOut} isSmall={false} />
                <button
                    onClick={() => user ? onOpenProjects() : onAuthClick()}
                    style={{
                        padding: 8, background: user ? "#14151f" : "#0a0b15",
                        color: user ? "white" : "#9ca3af",
                        border: user ? "1px solid #2e303a" : "1px dashed #aa3bff",
                        borderRadius: 8, cursor: "pointer", fontSize: 12,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        gap: 6, marginTop: "5px"
                    }}>
                    {user ? "📁 Мои проекты" : "🔐 Войти для доступа к облаку"}
                </button>
            </div>
        </div>
    )
}

function AuthBlock({onAuthClick, user, onSignOut, isSmall}: {onAuthClick: () => void, user: any, onSignOut: () => void, isSmall: boolean}) {
    return (
    <div style={{ marginTop: isSmall ? 8 : 12, paddingTop: isSmall ? 8 : 12, borderTop: '1px solid #2e303a' }}>
        {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, }}>
                <span style={{
                    color: '#48FF73', fontSize: isSmall ? 11 : 12, wordBreak: 'break-all',
                    padding: isSmall ? "0 4px" : "0"
                }}>
                    ✅ {user.email}
                </span>
                <button onClick={onSignOut} style={{
                    padding: isSmall ? '10px' : "8px", background: '#2e303a', color: '#FF5F56', border: 'none',
                    borderRadius: isSmall ? 6 : 4, cursor: 'pointer', fontSize: isSmall ? 13 : 12, minHeight: isSmall ? 44 : "auto",
                    fontWeight: 600
                }}>
                    Выйти
                </button>
            </div>
        ) : (
            <button onClick={onAuthClick} style={{
                width: "100%", padding: isSmall ? "10px" : "8px", background: '#aa3bff', color: 'white', border: 'none',
                borderRadius: isSmall ? 6 : 4, cursor: 'pointer', fontSize: isSmall ? 13 : 12, fontWeight: 600,
                textAlign: 'center'
            }}>
                🔑 Войти / Регистрация
            </button>
        )}
    </div>)
}