// src/lib/realtime.ts

import type { Models } from "appwrite";
import { client } from "./appwrite";
import { DATA_BASE, COLLECTION, CURSORS_COLLECTION } from "./appwrite";

type RealtimeEventType = 'create' | 'update' | 'delete';

export interface SceneDocument extends Models.Document {
    scene_data: string,
    scene_name: string,
    user_id: string,
    is_public: boolean,
    screenshot?: string | null;
}

export interface CursorData {
    $id: string;
    scene_id: string;
    user_id: string;
    user_name: string;
    color: string;
    x: number;
    y: number;
    last_seen: string;
}

export interface SceneUpdateEvent {
    event: RealtimeEventType,
    document: SceneDocument | null
}

interface AppwriteRealtimeResponse {
    events: string[],
    payload: unknown
}

export interface CursorUpdateEvent {
    event: RealtimeEventType;
    payload: CursorData | null;
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

/**
 * Подписывается на изменения курсоров в конкретной сцене
 */
export function subscribeToCursorUpdates(sceneId: string, onEvent: (update: CursorUpdateEvent) => void): () => void {
    // Подписываемся на всю коллекцию, но фильтруем по scene_id в колбэке
    const channel = `databases.${DATA_BASE}.collections.${CURSORS_COLLECTION}.documents`;

    const unsubscribe = client.subscribe(channel, (response: any) => {
        const matchedEvent = response.events.find((e: string) => 
            e.endsWith('.create') || e.endsWith('.update') || e.endsWith('.delete')
        );

        if (!matchedEvent) return;

        const eventType = matchedEvent.split('.').pop() as RealtimeEventType;
        const payload = response.payload as CursorData;

        // Фильтруем: нас интересуют только курсоры текущей сцены
        if (payload && payload.scene_id === sceneId) {
            onEvent({ event: eventType, payload });
        }
    });

    return unsubscribe;
}