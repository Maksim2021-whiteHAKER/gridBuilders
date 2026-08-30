// src/lib/appwrite.ts
import { Client, Account, Databases, Query } from "appwrite";

const DATA_BASE = import.meta.env.VITE_APPWRITE_DATA_BASE_ID
const COLLECTION = import.meta.env.VITE_APPWRITE_COLLECTION_ID

const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client)

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

export async function saveScene(userId: string, sceneName: string, sceneData: any, documentId?: string, screenshot?: string) {
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
                is_public: false
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
                is_public: false
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

    return response.documents.map((doc) => ({
        id: doc.$id,
        name: doc.scene_name,
        data: JSON.parse(doc.scene_data),
        screenshot: doc.screenshot || null,
        createdAt: doc.$createdAt,
        updatedAt: doc.$updatedAt
    }))
}

export async function loadScene(documentId: string) {
    const doc = await databases.getDocument(
        DATA_BASE,
        COLLECTION,
        documentId
    );
    
    return {
        id: doc.$id,
        name: doc.scene_name,
        data: JSON.parse(doc.scene_data),
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

export async function toggleScenePublic(documentId: string, isPublic: boolean) {
    const permissions = isPublic ? ['read(any)'] : [];

    return await databases.updateDocument(
        DATA_BASE,
        COLLECTION,
        documentId,
        { isPublic: isPublic},
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

    return {
        id: doc.$id,
        name: doc.scene_name,
        data: JSON.parse(doc.scene_data),
        screenshot: doc.screenshot || null,
        isPublic: doc.is_public
    }
}

export { client }