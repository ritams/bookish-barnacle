import * as Y from 'yjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// In-memory storage for active Yjs documents and rooms
interface RoomUser {
    socketId: string;
    userId: string;
    userName: string;
    color: string;
}

interface Room {
    fileId: string;
    projectId: string;
    doc: Y.Doc;
    users: Map<string, RoomUser>;
    saveTimeout: NodeJS.Timeout | null;
}

// Map of roomId -> Room
const rooms = new Map<string, Room>();

// Predefined colors for user cursors
const CURSOR_COLORS = [
    '#E91E63', // Pink
    '#9C27B0', // Purple
    '#3F51B5', // Indigo
    '#2196F3', // Blue
    '#00BCD4', // Cyan
    '#009688', // Teal
    '#4CAF50', // Green
    '#FF9800', // Orange
    '#FF5722', // Deep Orange
    '#795548', // Brown
];

function getColorForUser(userIndex: number): string {
    return CURSOR_COLORS[userIndex % CURSOR_COLORS.length];
}

function getRoomId(projectId: string, fileId: string): string {
    return `project:${projectId}:file:${fileId}`;
}

export async function getOrCreateRoom(projectId: string, fileId: string): Promise<Room> {
    const roomId = getRoomId(projectId, fileId);

    if (rooms.has(roomId)) {
        return rooms.get(roomId)!;
    }

    // Create new Yjs document
    const doc = new Y.Doc();

    // Try to load existing state from database
    const file = await prisma.file.findUnique({
        where: { id: fileId },
        select: { yjsState: true, content: true },
    });

    if (file?.yjsState) {
        // Load persisted Yjs state
        Y.applyUpdate(doc, new Uint8Array(file.yjsState));
    } else if (file?.content) {
        // Initialize with existing file content
        const ytext = doc.getText('content');
        ytext.insert(0, file.content);
    }

    const room: Room = {
        fileId,
        projectId,
        doc,
        users: new Map(),
        saveTimeout: null,
    };

    rooms.set(roomId, room);
    return room;
}

export function addUserToRoom(
    room: Room,
    socketId: string,
    userId: string,
    userName: string
): RoomUser {
    const userIndex = room.users.size;
    const user: RoomUser = {
        socketId,
        userId,
        userName,
        color: getColorForUser(userIndex),
    };
    room.users.set(socketId, user);
    return user;
}

export function removeUserFromRoom(room: Room, socketId: string): boolean {
    room.users.delete(socketId);

    // If room is empty, schedule cleanup
    if (room.users.size === 0) {
        // Save before cleanup
        scheduleSave(room);

        // Remove room after a delay (in case users reconnect)
        setTimeout(() => {
            const roomId = getRoomId(room.projectId, room.fileId);
            const currentRoom = rooms.get(roomId);
            if (currentRoom && currentRoom.users.size === 0) {
                currentRoom.doc.destroy();
                rooms.delete(roomId);
            }
        }, 30000); // 30 second delay before cleanup

        return true; // Room is now empty
    }
    return false;
}

export function getRoomUsers(room: Room): RoomUser[] {
    return Array.from(room.users.values());
}

export function applyUpdate(room: Room, update: Uint8Array): void {
    Y.applyUpdate(room.doc, update);
    scheduleSave(room);
}

export function getDocState(room: Room): Uint8Array {
    return Y.encodeStateAsUpdate(room.doc);
}

export function getDocStateVector(room: Room): Uint8Array {
    return Y.encodeStateVector(room.doc);
}

function scheduleSave(room: Room): void {
    // Debounce saves - wait 2 seconds of inactivity
    if (room.saveTimeout) {
        clearTimeout(room.saveTimeout);
    }

    room.saveTimeout = setTimeout(async () => {
        await saveRoom(room);
    }, 2000);
}

async function saveRoom(room: Room): Promise<void> {
    try {
        const state = Y.encodeStateAsUpdate(room.doc);
        const content = room.doc.getText('content').toString();

        await prisma.file.update({
            where: { id: room.fileId },
            data: {
                yjsState: Buffer.from(state),
                content: content,
            },
        });

        console.log(`[Collab] Saved room state for file ${room.fileId}`);
    } catch (error) {
        console.error(`[Collab] Failed to save room state:`, error);
    }
}

export function getRoom(projectId: string, fileId: string): Room | undefined {
    return rooms.get(getRoomId(projectId, fileId));
}

export function getAllRooms(): Map<string, Room> {
    return rooms;
}
