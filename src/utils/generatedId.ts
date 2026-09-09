// src/utils/generatedId.ts

export function generatedId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return "obj_" + Date.now() + Math.random().toString(36).substring(2, 9);
}