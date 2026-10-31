// src/utils/groupUtils.ts
import { Vector3 } from 'three';
import type { SceneObject } from '../store/sceneStore';

/**
 * Вычисляет центр масс (pivot) группы объектов
 */
export function computeGroupPivot(objects: SceneObject[]): [number, number, number] {
  if (objects.length === 0) return [0, 0, 0];
  
  const sum = objects.reduce((acc, obj) => {
    acc.x += obj.position[0];
    acc.y += obj.position[1];
    acc.z += obj.position[2];
    return acc;
  }, new Vector3(0, 0, 0));
  
  const count = objects.length;
  return [sum.x / count, sum.y / count, sum.z / count];
}

/**
 * Создаёт группу из выбранных объектов (Group as Object)
 */
export function createGroupFromSelection(
  allObjects: SceneObject[],
  selectedIds: string[]
): { newObjects: SceneObject[]; groupId: string } {
  if (selectedIds.length < 2) {
    throw new Error('Нужно выбрать минимум 2 объекта');
  }
  
  const selectedObjects = allObjects.filter(obj => selectedIds.includes(obj.id));
  //const colorInt = hexToColor3uint8(color);
  const pivot = computeGroupPivot(selectedObjects);
  
  const groupId = crypto.randomUUID();
  const groupName = `Model_${selectedObjects.length}`;
  
  // Создаём объект-контейнер (Model)
  const groupObject: SceneObject = {
    id: groupId,
    type: 'model',
    position: pivot,
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    color: '#ffffff',
    nameGroup: groupName,
    children: [...selectedIds],
    opacity: 1.0,
    metalness: 0.0,
    roughness: 0.5,
    wireframe: false
  };
  
  // Обновляем дочерние объекты: добавляем parentId и корректируем позицию относительно pivot
  const updatedChildren = selectedObjects.map(obj => ({
    ...obj,
    parentId: groupId,
    // Позиция теперь относительная pivot группы
    position: [
      obj.position[0] - pivot[0],
      obj.position[1] - pivot[1],
      obj.position[2] - pivot[2],
    ] as [number, number, number],
  }));
  
  // Формируем новый список объектов
  const otherObjects = allObjects.filter(obj => !selectedIds.includes(obj.id));
  const newObjects = [...otherObjects, ...updatedChildren, groupObject];
  
  return { newObjects, groupId };
}

/**
 * Разгруппировывает объект (Ungroup)
 */
/**
 * Разгруппировывает объект (Ungroup)
 */
/**
 * Разгруппировывает объект (Ungroup)
 */
export function ungroupObject(
    allObjects: SceneObject[],
    groupId: string
  ): SceneObject[] {
    const group = allObjects.find(obj => obj.id === groupId);
    if (!group || group.type !== 'model' || !group.children) {
      return allObjects;
    }
    
    const pivot = group.position;
    
    // ✅ 1. Восстанавливаем дочерние объекты: убираем parentId, возвращаем абсолютную позицию
    const restoredChildren = allObjects
      .filter(obj => group.children!.includes(obj.id))
      .map(obj => {
        return {
          ...obj,
          parentId: undefined, // Явно убираем parentId
          position: [
            obj.position[0] + pivot[0],
            obj.position[1] + pivot[1],
            obj.position[2] + pivot[2],
          ] as [number, number, number],
        };
      });
    
    // ✅ 2. ИСПРАВЛЕНИЕ: Удаляем из списка И группу, И её детей, чтобы не было дубликатов
    const otherObjects = allObjects.filter(
      obj => obj.id !== groupId && !group.children!.includes(obj.id)
    );
    
    // ✅ 3. Собираем итоговый массив: все остальные объекты + восстановленные дети
    return [...otherObjects, ...restoredChildren];
  }

/**
 * Получает все объекты группы (рекурсивно, на случай вложенных групп)
 */
export function getGroupMembers(
  allObjects: SceneObject[],
  groupId: string
): SceneObject[] {
  const group = allObjects.find(obj => obj.id === groupId);
  if (!group || !group.children) return [];
  
  return group.children
    .map(id => allObjects.find(obj => obj.id === id))
    .filter((obj): obj is SceneObject => obj !== undefined);
}