// src/utils/createGradientTexture.ts

export interface GradientConfig {
    colors: string[],
    type: 'linear' | 'radial',
    angle: number,
    size?: number
}

export function createGradientTexture(config: GradientConfig): string {
    const {colors, type, angle, size = 512} = config;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    let gradient: CanvasGradient;

    if (type === 'radial') {
        gradient = ctx.createRadialGradient(
            size / 2, size / 2, 0,
            size / 2, size / 2, size / 2
        );
    } else {
        const rad = (angle * Math.PI) / 180;
        const x1 = size / 2 - Math.cos(rad) * size / 2;
        const y1 = size / 2 - Math.sin(rad) * size / 2;
        const x2 = size / 2 + Math.cos(rad) * size / 2;
        const y2 = size / 2 + Math.sin(rad) * size / 2;
        gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    }

    colors.forEach((color, index) => {
        const stop = colors.length === 1 ? 0 : index / (colors.length - 1)
        gradient.addColorStop(stop, color)
    })

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size)

    return canvas.toDataURL('image/png') 
}

export function createGradientPreview(config: GradientConfig): string {
    return createGradientTexture({...config, size: 64 });
}