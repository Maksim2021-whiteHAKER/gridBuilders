// src/lib/appwrite.ts
import { Client, Account, Databases, Query, Permission, Role } from "appwrite";

export const DATA_BASE = import.meta.env.VITE_APPWRITE_DATA_BASE_ID
export const COLLECTION = import.meta.env.VITE_APPWRITE_COLLECTION_ID

const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client)

function normalized(raw: string) {
    const parsed = raw ? JSON.parse(raw) : [];
    const objects = Array.isArray(parsed) ? parsed : (parsed?.objects ?? [])
    return objects;
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

export { client }