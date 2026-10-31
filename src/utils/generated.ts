// src/utils/generated.ts

export function generatedId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return "obj_" + Date.now() + Math.random().toString(36).substring(2, 9);
}

export const hexToColor3uint8 = (hex: string): number => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return 4278190080 + (r * 65536) + (g * 256) + b;
};