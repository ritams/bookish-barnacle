import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

const SOCKET_URL = import.meta.env.VITE_WS_URL ||
    (import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001');

let socket: Socket | null = null;

export function getSocket(): Socket | null {
    return socket;
}

export function connectSocket(): Socket {
    if (socket?.connected) {
        return socket;
    }

    const { user, token } = useAuthStore.getState();

    console.log('[Socket] Connecting with user:', user);
    console.log('[Socket] Connecting with token:', token ? 'Bearer [REDACTED]' : 'No token');

    socket = io(SOCKET_URL, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
        console.log('[Socket] Connected:', socket?.id);
    });

    socket.on('connect_error', (error) => {
        console.error('[Socket] Connection error:', error.message);
    });

    socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
    });

    return socket;
}

export function disconnectSocket(): void {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
