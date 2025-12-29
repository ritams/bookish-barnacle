import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface User {
    id: string;
    email: string;
    name: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;

    googleLogin: (credential: string) => Promise<boolean>;
    logout: () => void;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isLoading: false,
            error: null,

            googleLogin: async (credential) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`${API_BASE_URL}/auth/google`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ credential }),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        set({ error: data.error || 'Login failed', isLoading: false });
                        return false;
                    }

                    set({ user: data.user, token: data.token, isLoading: false });
                    return true;
                } catch {
                    set({ error: 'Network error. Please try again.', isLoading: false });
                    return false;
                }
            },

            logout: () => {
                set({ user: null, token: null, error: null });
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, token: state.token }),
        }
    )
);

// Helper to check if user is authenticated
export const isAuthenticated = () => {
    const state = useAuthStore.getState();
    return !!state.token && !!state.user;
};
