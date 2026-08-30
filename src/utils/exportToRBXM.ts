import type { SceneObject } from "../store/sceneStore.ts";

const eulerToRotationMatrix = (rx: number, ry: number, rz: number) => {
    const cosX = Math.cos(rx);
    const sinX = Math.sin(rx);
    const cosY = Math.cos(ry);
    const sinY = Math.sin(ry);
    const cosZ = Math.cos(rz);
    const sinZ = Math.sin(rz);

    return {
        R00: cosY * cosZ,
        R01: -cosY * sinZ,
        R02: sinY,
        R10: cosX * sinZ + sinX * sinY * cosZ,
        R11: cosX * cosZ - sinX * sinY * sinZ,
        R12: -sinX * cosY,
        R20: sinX * sinZ - cosX * sinY * cosZ,
        R21: sinX * cosZ + cosX * sinY * sinZ,
        R22: cosX * cosY
    };
}

// Формат Color3uint8 в Roblox: (Alpha << 24) | (Red << 16) | (Green << 8) | Blue
// 255 * 16777216 = 4278190080 (полностью непрозрачный Alpha)
const hexToColor3uint8 = (hex: string): number => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return 4278190080 + (r * 65536) + (g * 256) + b;
};

export function exportToRoblox(objects: SceneObject[]): void {
    let xml = '<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">\n';
    xml += '\t<Meta name="ExplicitAutoJoints">true</Meta>\n';

    let exportedCount = 0;

    for (const obj of objects) {
        // Пропускаем неподдерживаемые типы
        if (obj.type === 'text' || obj.type === 'pyramid' || obj.type === 'tor' || obj.type === 'cone') {
            console.warn(`[Export] Тип "${obj.type}" пропускается (не поддерживается в базовых Part Roblox)`);
            continue;
        }

        let shapeToken = 1; // По умолчанию Box
        switch (obj.type) {
            case "sphere": shapeToken = 0; break // RB проверено сфера = 0
            case "box": shapeToken = 1; break;  // RB куб = 1
            case "cylinder": shapeToken = 2; break // RB цилиндр = 2
            // case "Wedge": shapeToken = 3; break // RB Wedge = 3
            // case "cornerWedge": shapeToken = 4; break // RB cornerWedge = 4
        }

        // Масштабирование под стандартные размеры Roblox
        const scaleFactor = 2;
        const sizeX = (obj.scale[0] * scaleFactor).toFixed(2);
        const sizeY = (obj.scale[1] * scaleFactor).toFixed(2);
        const sizeZ = (obj.scale[2] * scaleFactor).toFixed(2);
        
        const posX = (obj.position[0] * scaleFactor).toFixed(2);
        const posY = (obj.position[1] * scaleFactor).toFixed(2);
        const posZ = (obj.position[2] * scaleFactor).toFixed(2);

        const matrix = eulerToRotationMatrix(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
        const colorInt = hexToColor3uint8(obj.color);

        // ✅ ИСПОЛЬЗУЕМ ПОЛНЫЙ ID (без slice), чтобы избежать ошибки "Duplicate referent" в Roblox
        const safeId = obj.id.replace(/-/g, ''); 

        xml += `  <Item class="Part" referent="RBX${safeId}">\n`;
        xml += `    <Properties>\n`;
        xml += `      <string name="Name">${obj.type}_${safeId.slice(0, 8)}</string>\n`;
        xml += `      <int name="shape">${shapeToken}</int>\n`;

        xml += `      <Vector3 name="size">\n`;
        xml += `        <X>${sizeX}</X>\n`;
        xml += `        <Y>${sizeY}</Y>\n`;
        xml += `        <Z>${sizeZ}</Z>\n`;
        xml += `      </Vector3>\n`;

        xml += `      <CoordinateFrame name="CFrame">\n`;
        xml += `        <X>${posX}</X>\n`;
        xml += `        <Y>${posY}</Y>\n`;
        xml += `        <Z>${posZ}</Z>\n`;
        xml += `        <R00>${matrix.R00.toFixed(6)}</R00>\n`;
        xml += `        <R01>${matrix.R01.toFixed(6)}</R01>\n`;
        xml += `        <R02>${matrix.R02.toFixed(6)}</R02>\n`;
        xml += `        <R10>${matrix.R10.toFixed(6)}</R10>\n`;
        xml += `        <R11>${matrix.R11.toFixed(6)}</R11>\n`;
        xml += `        <R12>${matrix.R12.toFixed(6)}</R12>\n`;
        xml += `        <R20>${matrix.R20.toFixed(6)}</R20>\n`;
        xml += `        <R21>${matrix.R21.toFixed(6)}</R21>\n`;
        xml += `        <R22>${matrix.R22.toFixed(6)}</R22>\n`;
        xml += `      </CoordinateFrame>\n`;

        xml += `      <Color3uint8 name="Color3uint8">${colorInt}</Color3uint8>\n`;
        xml += `      <bool name="Anchored">true</bool>\n`; // Критически важно, чтобы детали не падали
        xml += `    </Properties>\n`;
        xml += `  </Item>\n`;

        exportedCount++;
    }

    xml += '</roblox>';

    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gridbuilders_scene_${Date.now()}.rbxmx`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`[Export] Успешно экспортировано ${exportedCount} объектов в .rbxmx! 🚀`);
}