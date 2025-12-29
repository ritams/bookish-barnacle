import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import {
    getOrCreateRoom,
    addUserToRoom,
    removeUserFromRoom,
    getRoomUsers,
    applyUpdate,
    getDocState,
    getRoom,
} from '../services/collaborationService.js';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    userName?: string;
    userEmail?: string;
}

interface JoinFilePayload {
    projectId: string;
    fileId: string;
}

interface SyncUpdatePayload {
    projectId: string;
    fileId: string;
    update: number[]; // Uint8Array as regular array for JSON serialization
}

interface AwarenessUpdatePayload {
    projectId: string;
    fileId: string;
    awareness: number[]; // Uint8Array as regular array for JSON serialization
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}

// Authentication middleware for Socket.io
export function authenticateSocket(socket: AuthenticatedSocket, next: (err?: Error) => void) {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    console.log('[Socket Auth] Token received:', token ? 'Bearer [REDACTED]' : 'No token');

    if (!token) {
        console.log('[Socket Auth] No token provided');
        return next(new Error('Authentication required'));
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string; email: string; name: string };
        console.log('[Socket Auth] Decoded user:', { userId: decoded.userId, name: decoded.name, email: decoded.email });
        socket.userId = decoded.userId;
        socket.userName = decoded.name;
        socket.userEmail = decoded.email;
        next();
    } catch (error) {
        console.log('[Socket Auth] Token verification failed:', error);
        next(new Error('Invalid token'));
    }
}

export function setupCollaborationHandlers(io: Server) {
    io.use(authenticateSocket);

    io.on('connection', (socket: AuthenticatedSocket) => {
        console.log(`[Collab] User connected: ${socket.userName} (${socket.id})`);

        // Track which rooms this socket is in
        const joinedRooms = new Set<string>();

        // Join a file for collaboration
        socket.on('join-file', async (payload: JoinFilePayload) => {
            try {
                const { projectId, fileId } = payload;
                const roomId = `project:${projectId}:file:${fileId}`;

                // Leave any existing rooms for this file type
                for (const existingRoomId of joinedRooms) {
                    if (existingRoomId !== roomId) {
                        socket.leave(existingRoomId);
                        const [, pId, , fId] = existingRoomId.split(':');
                        const existingRoom = getRoom(pId, fId);
                        if (existingRoom) {
                            removeUserFromRoom(existingRoom, socket.id);
                            io.to(existingRoomId).emit('user-left', {
                                socketId: socket.id,
                                users: getRoomUsers(existingRoom),
                            });
                        }
                        joinedRooms.delete(existingRoomId);
                    }
                }

                // Get or create the room
                const room = await getOrCreateRoom(projectId, fileId);

                // Add user to room
                const user = addUserToRoom(room, socket.id, socket.userId!, socket.userName!);

                // Join Socket.io room
                socket.join(roomId);
                joinedRooms.add(roomId);

                // Send initial document state to the joining user
                const docState = getDocState(room);
                socket.emit('sync-init', {
                    state: Array.from(docState),
                    users: getRoomUsers(room),
                    user: user,
                });

                // Notify other users in the room
                socket.to(roomId).emit('user-joined', {
                    user,
                    users: getRoomUsers(room),
                });

                console.log(`[Collab] ${socket.userName} joined room ${roomId}`);
                console.log('[Collab] User object being sent:', user);
                console.log('[Collab] All users in room:', getRoomUsers(room));
            } catch (error) {
                console.error('[Collab] Error joining file:', error);
                socket.emit('error', { message: 'Failed to join file' });
            }
        });

        // Leave a file
        socket.on('leave-file', (payload: JoinFilePayload) => {
            const { projectId, fileId } = payload;
            const roomId = `project:${projectId}:file:${fileId}`;

            socket.leave(roomId);
            joinedRooms.delete(roomId);

            const room = getRoom(projectId, fileId);
            if (room) {
                removeUserFromRoom(room, socket.id);
                io.to(roomId).emit('user-left', {
                    socketId: socket.id,
                    users: getRoomUsers(room),
                });
            }

            console.log(`[Collab] ${socket.userName} left room ${roomId}`);
        });

        // Receive document update from client
        socket.on('sync-update', (payload: SyncUpdatePayload) => {
            const { projectId, fileId, update } = payload;
            const roomId = `project:${projectId}:file:${fileId}`;

            const room = getRoom(projectId, fileId);
            if (room) {
                // Apply update to server's Yjs document
                applyUpdate(room, new Uint8Array(update));

                // Broadcast to other clients in the room
                socket.to(roomId).emit('sync-update', {
                    update,
                    senderId: socket.id,
                });
            }
        });

        // Receive awareness update (cursor position, selection, etc.)
        socket.on('awareness-update', (payload: AwarenessUpdatePayload) => {
            const { projectId, fileId, awareness } = payload;
            const roomId = `project:${projectId}:file:${fileId}`;

            // Broadcast to other clients in the room
            socket.to(roomId).emit('awareness-update', {
                senderId: socket.id,
                awareness,
            });
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`[Collab] User disconnected: ${socket.userName} (${socket.id})`);

            // Clean up all rooms this user was in
            for (const roomId of joinedRooms) {
                const [, projectId, , fileId] = roomId.split(':');
                const room = getRoom(projectId, fileId);
                if (room) {
                    removeUserFromRoom(room, socket.id);
                    io.to(roomId).emit('user-left', {
                        socketId: socket.id,
                        users: getRoomUsers(room),
                    });
                }
            }
        });
    });
}
