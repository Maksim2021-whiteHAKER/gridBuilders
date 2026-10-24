// src/components/SceneErrorBoundary.tsx
import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

export class SceneErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: unknown) {
        console.error('Ошибка 3D-сцены:', error, info);
    }

    render() {
        if (!this.state.error) {
            return this.props.children;
        }

        return (
            <div style={{
                position: 'fixed', inset: 0, zIndex: 99998,
                display: 'flex', flexDirection: 'column', gap: 12,
                alignItems: 'center', justifyContent: 'center',
                background: '#0a0b15', color: 'white', padding: 24, textAlign: 'center'
            }}>
                <div style={{ fontSize: 48 }}>💥</div>
                <h2 style={{ margin: 0 }}>Сцена упала с ошибкой</h2>
                <pre style={{ color: '#9ca3af', maxWidth: 480, whiteSpace: 'pre-wrap', fontSize: 12 }}>
                    {String(this.state.error.message)}
                </pre>
                <button
                    onClick={() => location.reload()}
                    style={{ padding: '10px 24px', background: '#aa3bff', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600 }}
                >
                    Перезагрузить
                </button>
            </div>
        );
    }
}