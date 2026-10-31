// src/lib/appwrite.ts
import { Client, Account, Databases, Query, Permission, Role } from "appwrite";

export const DATA_BASE = import.meta.env.VITE_APPWRITE_DATA_BASE_ID
export const COLLECTION = import.meta.env.VITE_APPWRITE_COLLECTION_ID
export const CURSORS_COLLECTION = import.meta.env.VITE_APPWRITE_CURSORS_COLLECTION_ID

export const APPWRITE_READY = Boolean(
    import.meta.env.VITE_APPWRITE_ENDPOINT &&
    import.meta.env.VITE_APPWRITE_PROJECT_ID &&
    import.meta.env.VITE_APPWRITE_DATA_BASE_ID &&
    import.meta.env.VITE_APPWRITE_COLLECTION_ID
)

const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || 'offline-local');

export const account = new Account(client);
export const databases = new Databases(client)

function normalized(raw: string) {
    const parsed = raw ? JSON.parse(raw) : [];
    const objects = Array.isArray(parsed) ? parsed : (parsed?.objects ?? [])
    return objects;
}

function generateCursorId(sceneId: string, userId: string): string {
    // Appwrite ID состоят из a-z, 0-9, поэтому substring абсолютно безопасен от коллизий
    const safeSceneId = sceneId.substring(0, 18);
    const safeUserId = userId.substring(0, 17);
    return `${safeSceneId}_${safeUserId}`; // Ровно 36 символов
}

export function captureScreenScreenshot(): string | null {
    const canvas = document.querySelector("canvas");
    if (!canvas) return null

    const tempCanvas = document.createElement("canvas");
    const size = 200
    tempCanvas.height = size;
    tempCanvas.width = size;
    const ctx = tempCanvas.getContext('2d')
    if (!ctx) return null
    try {
        ctx.drawImage(canvas, 0, 0, size, size)
        return tempCanvas.toDataURL('image/jpeg', 0.5)
    } catch (err) {
        console.error("Ошибка создания скриншота (возможно, проблема CORS с текстурами):", err);
        return null;
    }
}

export async function saveScene(userId: string, sceneName: string, sceneData: Record<string, unknown> | unknown[], documentId?: string, screenshot?: string, is_public = false) {
    const sceneDataString = JSON.stringify(sceneData)
    const screenshotData = screenshot || captureScreenScreenshot()

    if (documentId) {
        return await databases.updateDocument(
            DATA_BASE,
            COLLECTION,
            documentId, 
            {
                scene_name: sceneName,
                scene_data: sceneDataString,
                screenshot: screenshotData,
                is_public: is_public
            }
        );
    } else {
        return await databases.createDocument(
            DATA_BASE,
            COLLECTION,
            'unique()',
            {
                scene_name: sceneName,
                scene_data: sceneDataString,
                user_id: userId,
                screenshot: screenshotData,
                is_public: is_public
            }
        );
    }
}

export async function loadScenes(userId: string) {
    const response = await databases.listDocuments(
        DATA_BASE,
        COLLECTION,
        [Query.equal('user_id', userId)]
    );

    return response.documents.map((doc) => {
        const objects = normalized(doc.scene_data)

        return {
            id: doc.$id,
            name: doc.scene_name,
            data: objects,
            screenshot: doc.screenshot || null,
            createdAt: doc.$createdAt,
            updatedAt: doc.$updatedAt,
            isPublic: doc.is_public === true,
        }
    })
}

export async function loadScene(documentId: string) {
    const doc = await databases.getDocument(
        DATA_BASE, COLLECTION, documentId
    );
    const objects = normalized(doc.scene_data)

    return {
        id: doc.$id,
        name: doc.scene_name,
        data: objects,
        screenshot: doc.screenshot || null,
        createdAt: doc.$createdAt,
        updatedAt: doc.$updatedAt
    }
}

export async function deleteScene(documentId: string) {
    await databases.deleteDocument(
        DATA_BASE,
        COLLECTION,
        documentId,
    );
}

export async function renameScene(documentId: string, newName: string) {
    return await databases.updateDocument(
        DATA_BASE,
        COLLECTION,
        documentId,
        { scene_name: newName}
    )    
}

/**
 * Включает/выключает публичный доступ к сцене.
 * - isPublic: флаг для UI (отображает «Открыто»/«Закрыто»).
 * - permissions: реальные права доступа к документу в Appwrite.
 */
export async function toggleScenePublic(documentId: string, isPublic: boolean, ownerId: string) {
    const ownerPermissions = [
        Permission.read(Role.user(ownerId)),
        Permission.update(Role.user(ownerId)),
        Permission.delete(Role.user(ownerId))
    ];

    const permissions = isPublic ? [...ownerPermissions, Permission.read(Role.any())] : ownerPermissions;

    return await databases.updateDocument(
        DATA_BASE,
        COLLECTION,
        documentId,
        { is_public: isPublic},
        permissions
    )
}

export async function getPublicScene(documentId: string) {
    const doc = await databases.getDocument(
        DATA_BASE, COLLECTION,
        documentId
    );

    if (!doc.is_public) {
        throw new Error("Эта сцена не публична");
    }

    const objects = normalized(doc.scene_data)

    return {
        id: doc.$id,
        name: doc.scene_name,
        data: objects,
        screenshot: doc.screenshot || null,
        isPublic: doc.is_public
    }
}

export async function makeRoomShared(documentId: string, ownerId: string) {
    const permissions = [
        Permission.read(Role.user(ownerId)),
        Permission.update(Role.user(ownerId)),
        Permission.delete(Role.user(ownerId)),
        Permission.read(Role.any()),
        Permission.update(Role.any()),
    ];
    return await databases.updateDocument(
        DATA_BASE, COLLECTION, documentId,
        { is_public: true},
        permissions
    );
}

export async function updateSceneData(documentId: string, data: Record<string, unknown>) {
    return databases.updateDocument(DATA_BASE, COLLECTION, documentId, {
      scene_data: JSON.stringify(data),
    });
}

export async function updateCursor(sceneId: string, userId: string, userName: string, color: string, x: number, y: number) {
    const cursorId = generateCursorId(sceneId, userId);
    const payload = { 
        scene_id: sceneId, 
        user_id: userId, 
        user_name: userName, 
        color, 
        x, 
        y, 
        last_seen: new Date().toISOString()
    };

    try {
        // 1. Сначала пробуем СОЗДАТЬ документ.
        return await databases.createDocument(DATA_BASE, CURSORS_COLLECTION, cursorId, payload);
    } catch (error: unknown) {
        // 2. Безопасно проверяем свойства ошибки без использования `any`
        const err = error as Record<string, unknown>;
        const isConflict = err?.code === 409 || err?.code === '409' || String(err?.message || '').includes('already exists');

        if (isConflict) {
            try {
                // Документ уже существует, просто обновляем его новыми координатами
                return await databases.updateDocument(DATA_BASE, CURSORS_COLLECTION, cursorId, payload);
            } catch (updateError: unknown) {
                console.error("Ошибка обновления существующего курсора:", updateError);
                throw updateError;
            }
        }
        
        // Любые другие ошибки (например, 401 Unauthorized) логируем и пробрасываем дальше
        console.error("Ошибка создания курсора:", error);
        throw error; 
    }
}

export async function deleteCursor(sceneId: string, userId: string) {
    const cursorId = generateCursorId(sceneId, userId);
    try {
        await databases.deleteDocument(DATA_BASE, CURSORS_COLLECTION, cursorId);
    } catch (e) {
        // Игнорируем ошибки, если курсора уже нет
    }
}

export { client }