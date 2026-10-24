// src/components/WebGLGuard.tsx
import { useState, type ReactNode } from 'react';

function detectWebGL2(): boolean {
    try {
        const canvas = document.createElement('canvas');
        return !!canvas.getContext('webgl2');
    } catch {
        return false;
    }
}

export function WebGLGuard({ children }: { children: ReactNode }) {
    const [supported] = useState<boolean>(detectWebGL2);

    if (supported) {
        return <>{children}</>;
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 99998,
            display: 'flex', flexDirection: 'column', gap: 12,
            alignItems: 'center', justifyContent: 'center',
            background: '#0a0b15', color: 'white', padding: 24, textAlign: 'center'
        }}>
            <div style={{ fontSize: 48 }}>⚠️</div>
            <h2 style={{ margin: 0 }}>Нет поддержки WebGL2</h2>
            <p style={{ color: '#9ca3af', maxWidth: 420 }}>
                Ваш браузер не смог создать 3D-контекст. Обновите Chrome,
                либо включите «Ускорение графики» в настройках браузера
                и перезагрузите телефон.
            </p>
        </div>
    );
}