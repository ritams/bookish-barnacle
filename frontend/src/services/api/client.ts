import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth API
export const authApi = {
    register: async (data: { email: string; password: string; name: string }) => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },
    login: async (data: { email: string; password: string }) => {
        const response = await api.post('/auth/login', data);
        return response.data;
    },
};

// Projects API
export const projectsApi = {
    list: async () => {
        const response = await api.get('/projects');
        return response.data;
    },
    create: async (data: { name: string; description?: string }) => {
        const response = await api.post('/projects', data);
        return response.data;
    },
    get: async (id: string) => {
        const response = await api.get(`/projects/${id}`);
        return response.data;
    },
    update: async (id: string, data: { name?: string; description?: string; mainFile?: string }) => {
        const response = await api.put(`/projects/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/projects/${id}`);
        return response.data;
    },
};

// Files API
export const filesApi = {
    get: async (id: string) => {
        const response = await api.get(`/files/${id}`);
        return response.data;
    },
    create: async (data: { projectId: string; path: string; name: string; content?: string; mimeType?: string }) => {
        const response = await api.post('/files', data);
        return response.data;
    },
    update: async (id: string, data: { content?: string; path?: string; name?: string }) => {
        const response = await api.put(`/files/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/files/${id}`);
        return response.data;
    },
};

export default api;
