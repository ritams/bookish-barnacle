import { useEffect, useState, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { connectSocket, disconnectSocket } from '../services/collaborationService';
import { SocketIOProvider } from '../services/SocketIOProvider';

export interface CollaboratorInfo {
    socketId: string;
    name: string;
    color: string;
}

export interface UseCollaborationResult {
    doc: Y.Doc | null;
    provider: SocketIOProvider | null;
    awareness: Awareness | null;
    collaborators: CollaboratorInfo[];
    isConnected: boolean;
    isSynced: boolean;
}

export function useCollaboration(
    projectId: string | null,
    fileId: string | null,
    enabled: boolean = true
): UseCollaborationResult {
    const [isConnected, setIsConnected] = useState(false);
    const [isSynced, setIsSynced] = useState(false);
    const [collaborators, setCollaborators] = useState<CollaboratorInfo[]>([]);

    const docRef = useRef<Y.Doc | null>(null);
    const providerRef = useRef<SocketIOProvider | null>(null);
    const awarenessRef = useRef<Awareness | null>(null);

    // Force re-render when refs change
    const [, forceUpdate] = useState({});

    const cleanup = useCallback(() => {
        if (providerRef.current) {
            providerRef.current.destroy();
            providerRef.current = null;
        }
        if (docRef.current) {
            docRef.current.destroy();
            docRef.current = null;
        }
        awarenessRef.current = null;
        setIsConnected(false);
        setIsSynced(false);
        setCollaborators([]);
    }, []);

    useEffect(() => {
        if (!enabled || !projectId || !fileId) {
            cleanup();
            return;
        }

        // Connect socket if not connected
        const socket = connectSocket();

        // Create new Yjs document
        const doc = new Y.Doc();
        docRef.current = doc;

        // Create awareness
        const awareness = new Awareness(doc);
        awarenessRef.current = awareness;

        // Create provider
        const provider = new SocketIOProvider(socket, projectId, fileId, doc, { awareness });
        providerRef.current = provider;

        // Listen for connection state
        socket.on('connect', () => {
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
            setIsSynced(false);
        });

        // Listen for initial sync to get current users
        socket.on('sync-init', (data: {
            state: number[];
            users: Array<{ socketId: string; userName: string; color: string }>;
            user: { socketId: string; userName: string; color: string };
        }) => {
            console.log('[Collab] Initial sync users:', data.users);
            console.log('[Collab] Current user info:', data.user);
            console.log('[Collab] Socket ID:', socket.id);
            setIsSynced(true);
            // Filter out current user from collaborators list
            const otherUsers = data.users.filter(u => u.socketId !== socket.id);
            console.log('[Collab] Other users after filtering:', otherUsers);
            setCollaborators(otherUsers.map(u => ({
                socketId: u.socketId,
                name: u.userName,
                color: u.color,
            })));
        });

        // Listen for collaborator updates
        socket.on('user-joined', (data: {
            users: Array<{ socketId: string; userName: string; color: string }>
        }) => {
            console.log('[Collab] User joined event:', data);
            // Filter out current user from collaborators list
            const otherUsers = data.users.filter(u => u.socketId !== socket.id);
            setCollaborators(otherUsers.map(u => ({
                socketId: u.socketId,
                name: u.userName,
                color: u.color,
            })));
        });

        socket.on('user-left', (data: {
            users: Array<{ socketId: string; userName: string; color: string }>
        }) => {
            console.log('[Collab] User left event:', data);
            if (data.users) {
                // Filter out current user from collaborators list
                const otherUsers = data.users.filter(u => u.socketId !== socket.id);
                setCollaborators(otherUsers.map(u => ({
                    socketId: u.socketId,
                    name: u.userName,
                    color: u.color,
                })));
            }
        });

        // Force update to expose refs
        forceUpdate({});

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('sync-init');
            socket.off('user-joined');
            socket.off('user-left');
            cleanup();
        };
    }, [projectId, fileId, enabled, cleanup]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup();
            disconnectSocket();
        };
    }, [cleanup]);

    return {
        doc: docRef.current,
        provider: providerRef.current,
        awareness: awarenessRef.current,
        collaborators,
        isConnected,
        isSynced,
    };
}
