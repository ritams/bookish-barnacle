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

export interface User {
    id: string;
    name: string;
    email: string;
}

export interface Collaborator {
    id: string;
    role: 'owner' | 'editor' | 'viewer';
    user: User;
    createdAt: string;
}

export interface AddCollaboratorRequest {
    email: string;
    role?: 'editor' | 'viewer';
}

export interface UpdateCollaboratorRequest {
    role: 'editor' | 'viewer';
}

export const collaboratorsApi = {
    // Get all collaborators for a project
    getCollaborators: async (projectId: string): Promise<{ collaborators: Collaborator[] }> => {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/collaborators`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    // Add a collaborator to a project
    addCollaborator: async (projectId: string, data: AddCollaboratorRequest): Promise<Collaborator> => {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/collaborators`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    // Update collaborator role
    updateCollaborator: async (
        projectId: string, 
        collaboratorId: string, 
        data: UpdateCollaboratorRequest
    ): Promise<Collaborator> => {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/collaborators/${collaboratorId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    // Remove a collaborator from a project
    removeCollaborator: async (projectId: string, collaboratorId: string): Promise<void> => {
        await fetch(`${API_BASE_URL}/projects/${projectId}/collaborators/${collaboratorId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
    },

    // Search for users to add as collaborators
    searchUsers: async (query: string): Promise<{ users: User[] }> => {
        const response = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },
};
