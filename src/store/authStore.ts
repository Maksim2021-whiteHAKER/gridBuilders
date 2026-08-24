// src/store/authStore.ts
import { create } from "zustand";
import type { Models } from "appwrite";
import { account} from "../lib/appwrite"

interface AuthState {
    user: Models.User<Models.Preferences> | null;
    isLoading: boolean;
    checkUser: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,

    checkUser: async () => {
        try {
            const user = await account.get()
            set({user, isLoading: false })
        } catch {
            set({user: null, isLoading: false})
        }
    },

    signIn: async (email: string, password: string) => {
        await account.createEmailPasswordSession(email, password)
        const user = await account.get()
        set({ user })
    },

    signUp: async (email: string, password: string) => {
        await account.create('unique()', email, password);
        await account.createEmailPasswordSession(email, password)
        const user = await account.get()
        set({ user })
    },

    signOut: async () => {
        await account.deleteSession('current')
        set({ user: null})
    }

}))




