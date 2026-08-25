// src/lib/appwrite.ts
import { Client, Account, Databases, Query } from "appwrite";

const DATA_BASE = import.meta.env.VITE_APPWRITE_DATA_BASE_ID
const COLLECTION = import.meta.env.VITE_APPWRITE_COLLECTION_ID

const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client)

export async function saveScene(userId: string, sceneName: string, sceneData: any, documentId?: string) {
    const sceneDataString = JSON.stringify(sceneData)

    if (documentId) {
        return await databases.updateDocument(
            DATA_BASE,
            COLLECTION,
            documentId, 
            {
                scene_name: sceneName,
                scene_data: sceneDataString
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
                user_id: userId
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


export { client }