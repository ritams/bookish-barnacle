import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getAuthHeaders = () => {
    const token = useAuthStore.getState().token;
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

const handleResponse = async (response: Response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }
    return data;
};

export const api = {
    projects: {
        list: async () => {
            const response = await fetch(`${API_BASE_URL}/projects`, {
                headers: getAuthHeaders(),
            });
            return { data: await handleResponse(response) };
        },

        get: async (id: string) => {
            const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
                headers: getAuthHeaders(),
            });
            return { data: await handleResponse(response) };
        },

        create: async (data: { name: string; description?: string }) => {
            const response = await fetch(`${API_BASE_URL}/projects`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data),
            });
            return { data: await handleResponse(response) };
        },

        delete: async (id: string) => {
            const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            return { data: await handleResponse(response) };
        },
    },

    files: {
        get: async (id: string) => {
            const response = await fetch(`${API_BASE_URL}/files/${id}`, {
                headers: getAuthHeaders(),
            });
            return { data: await handleResponse(response) };
        },

        create: async (data: { projectId: string; path: string; name: string; content: string; mimeType: string }) => {
            const response = await fetch(`${API_BASE_URL}/files`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data),
            });
            return { data: await handleResponse(response) };
        },

        update: async (id: string, data: { content?: string; path?: string; name?: string }) => {
            const response = await fetch(`${API_BASE_URL}/files/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(data),
            });
            return { data: await handleResponse(response) };
        },

        delete: async (id: string) => {
            const response = await fetch(`${API_BASE_URL}/files/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            return { data: await handleResponse(response) };
        },
    },
};
