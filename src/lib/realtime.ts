// src/lib/realtime.ts

import type { Models } from "appwrite";
import { client } from "./appwrite";
import { DATA_BASE, COLLECTION } from "./appwrite";

type RealtimeEventType = 'create' | 'update' | 'delete';

export interface SceneDocument extends Models.Document {
    scene_data: string,
    scene_name: string,
    user_id: string,
    is_public: boolean,
    screenshot?: string | null;
}

export interface SceneUpdateEvent {
    event: RealtimeEventType,
    document: SceneDocument | null
}

interface AppwriteRealtimeResponse {
    events: string[],
    payload: unknown
}

/**
 * 
 * Подписывается на изменения конкретного документа сцены.
 * Возвращает функцию отписки.
 */
export function subscribeToSceneUpdates(documentId: string, onEvent: (update: SceneUpdateEvent) => void): () => void {
    const channel = `databases.${DATA_BASE}.collections.${COLLECTION}.documents.${documentId}`;

    const unsubscribe = client.subscribe(channel, (response: AppwriteRealtimeResponse) => {
        const matchedEvent = response.events.find(e => {
            return e.endsWith('.create') || e.endsWith('.update') || e.endsWith('.delete')
            
        })

        if (!matchedEvent) return;

        const eventType = matchedEvent.split('.').pop() as RealtimeEventType;

        onEvent({
            event: eventType,
            document: (response.payload as SceneDocument) ?? null
        });
    });

    return unsubscribe;
}