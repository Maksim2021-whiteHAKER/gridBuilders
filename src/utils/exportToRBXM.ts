// src/utils/exportToRBXM.ts
import type { SceneObject } from "../store/sceneStore";
import { hexToColor3uint8 } from "./generated";

const eulerToRotationMatrix = (rx: number, ry: number, rz: number) => {
    const cosX = Math.cos(rx);
    const sinX = Math.sin(rx);
    const cosY = Math.cos(ry);
    const sinY = Math.sin(ry);
    const cosZ = Math.cos(rz);
    const sinZ = Math.sin(rz);

    return {
        R00: cosY * cosZ, R01: -cosY * sinZ, R02: sinY,
        R10: cosX * sinZ + sinX * sinY * cosZ, R11: cosX * cosZ - sinX * sinY * sinZ, R12: -sinX * cosY,
        R20: sinX * sinZ - cosX * sinY * cosZ, R21: sinX * cosZ + cosX * sinY * sinZ, R22: cosX * cosY
    };
}

// Вспомогательная функция для генерации XML одной части (Part)
function generatePartXml(obj: SceneObject): string {
    if (obj.type === 'text' || obj.type === 'pyramid' || obj.type === 'tor' || obj.type === 'cone') {
        return ''; // Пропускаем неподдерживаемые типы
    }

    let shapeToken = 1; // Box по умолчанию
    if (obj.type === "sphere") shapeToken = 0;
    else if (obj.type === "cylinder") shapeToken = 2;

    const scaleFactor = 2;
    const matrix = eulerToRotationMatrix(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
    const colorInt = hexToColor3uint8(obj.color);
    const safeId = obj.id.replace(/-/g, '');

    let xml = `  <Item class="Part" referent="RBX${safeId}">\n`;
    xml += `    <Properties>\n`;
    xml += `      <string name="Name">${obj.type}_${safeId.slice(0, 8)}</string>\n`;
    xml += `      <int name="shape">${shapeToken}</int>\n`;
    xml += `      <Vector3 name="size">\n`;
    xml += `        <X>${(obj.scale[0] * scaleFactor).toFixed(2)}</X>\n`;
    xml += `        <Y>${(obj.scale[1] * scaleFactor).toFixed(2)}</Y>\n`;
    xml += `        <Z>${(obj.scale[2] * scaleFactor).toFixed(2)}</Z>\n`;
    xml += `      </Vector3>\n`;
    
    xml += `      <CoordinateFrame name="CFrame">\n`;
    // Если это дочерний элемент, его позиция уже относительная (благодаря groupUtils.ts)
    xml += `        <X>${(obj.position[0] * scaleFactor).toFixed(2)}</X>\n`;
    xml += `        <Y>${(obj.position[1] * scaleFactor).toFixed(2)}</Y>\n`;
    xml += `        <Z>${(obj.position[2] * scaleFactor).toFixed(2)}</Z>\n`;
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
    xml += `      <bool name="Anchored">true</bool>\n`;
    xml += `    </Properties>\n`;
    xml += `  </Item>\n`;

    return xml;
}

export function exportToRoblox(objects: SceneObject[]): void {
    let xml = '<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">\n';
    xml += '\t<Meta name="ExplicitAutoJoints">true</Meta>\n';

    let exportedCount = 0;

    // 1. Экспортируем обычные объекты, которые НЕ входят в группы
    const standaloneObjects = objects.filter(o => !o.deleted && o.parentId === undefined && o.type !== 'model');
    for (const obj of standaloneObjects) {
        xml += generatePartXml(obj);
        exportedCount++;
    }

    // 2. Экспортируем группы (Models)
    const groups = objects.filter(o => !o.deleted && o.type === 'model');
    for (const group of groups) {
        const safeGroupId = group.id.replace(/-/g, '');
        const matrix = eulerToRotationMatrix(group.rotation[0], group.rotation[1], group.rotation[2]);
        const scaleFactor = 2;

        xml += `  <Item class="Model" referent="RBX${safeGroupId}">\n`;
        xml += `    <Properties>\n`;
        xml += `      <string name="Name">${group.nameGroup || 'Model'}</string>\n`;
        
        // CFrame самой модели (её pivot)
        xml += `      <CoordinateFrame name="CFrame">\n`;
        xml += `        <X>${(group.position[0] * scaleFactor).toFixed(2)}</X>\n`;
        xml += `        <Y>${(group.position[1] * scaleFactor).toFixed(2)}</Y>\n`;
        xml += `        <Z>${(group.position[2] * scaleFactor).toFixed(2)}</Z>\n`;
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
        xml += `    </Properties>\n`;

        // 3. Добавляем дочерние части ВНУТРЬ модели
        if (group.children) {
            for (const childId of group.children) {
                const child = objects.find(o => o.id === childId);
                if (child && !child.deleted) {
                    xml += generatePartXml(child);
                    exportedCount++;
                }
            }
        }
        xml += `  </Item>\n`;
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
    
    console.log(`[Export] Успешно экспортировано ${exportedCount} элементов (включая модели) в .rbxmx! 🚀`);
}