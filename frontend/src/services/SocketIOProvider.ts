import * as Y from 'yjs';
import { Socket } from 'socket.io-client';
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate } from 'y-protocols/awareness';

/**
 * Custom Yjs provider that syncs over Socket.io
 */
export class SocketIOProvider {
    public doc: Y.Doc;
    public awareness: Awareness;

    private socket: Socket;
    private projectId: string;
    private fileId: string;
    private connected: boolean = false;
    private synced: boolean = false;

    constructor(
        socket: Socket,
        projectId: string,
        fileId: string,
        doc: Y.Doc,
        options: {
            awareness?: Awareness;
        } = {}
    ) {
        this.socket = socket;
        this.projectId = projectId;
        this.fileId = fileId;
        this.doc = doc;
        this.awareness = options.awareness || new Awareness(doc);

        this.setupSocketListeners();
        this.setupDocListener();
        this.setupAwarenessListener();

        // Join the room
        this.join();
    }

    private setupSocketListeners(): void {
        // Initial sync from server
        this.socket.on('sync-init', (data: {
            state: number[];
            users: Array<{ socketId: string; userId: string; userName: string; color: string }>;
            user: { socketId: string; userId: string; userName: string; color: string };
        }) => {
            if (data.state.length > 0) {
                Y.applyUpdate(this.doc, new Uint8Array(data.state), 'server');
            }
            this.synced = true;
            this.connected = true;

            // Set local awareness state with our color
            this.awareness.setLocalStateField('user', {
                name: data.user.userName,
                color: data.user.color,
            });

            console.log('[Provider] Synced with server, users:', data.users.length);
        });

        // Receive updates from other clients
        this.socket.on('sync-update', (data: { update: number[]; senderId: string }) => {
            Y.applyUpdate(this.doc, new Uint8Array(data.update), 'remote');
        });

        // Receive awareness updates from other clients
        this.socket.on('awareness-update', (data: { senderId: string; awareness: number[] }) => {
            applyAwarenessUpdate(this.awareness, new Uint8Array(data.awareness), 'remote');
        });

        // Handle user joined
        this.socket.on('user-joined', (data: {
            user: { socketId: string; userId: string; userName: string; color: string };
            users: Array<{ socketId: string; userId: string; userName: string; color: string }>;
        }) => {
            console.log('[Provider] User joined:', data.user.userName);
        });

        // Handle user left
        this.socket.on('user-left', (data: { socketId: string }) => {
            console.log('[Provider] User left:', data.socketId);
        });
    }

    private setupDocListener(): void {
        this.doc.on('update', (update: Uint8Array, origin: unknown) => {
            // Don't send updates that came from the server
            if (origin === 'server' || origin === 'remote') {
                return;
            }

            // Send update to server
            this.socket.emit('sync-update', {
                projectId: this.projectId,
                fileId: this.fileId,
                update: Array.from(update),
            });
        });
    }

    private setupAwarenessListener(): void {
        this.awareness.on('update', ({ added, updated, removed }: { added: number[], updated: number[], removed: number[] }) => {
            const changedClients = added.concat(updated).concat(removed);
            const update = encodeAwarenessUpdate(this.awareness, changedClients);
            this.socket.emit('awareness-update', {
                projectId: this.projectId,
                fileId: this.fileId,
                awareness: Array.from(update),
            });
        });
    }

    private join(): void {
        this.socket.emit('join-file', {
            projectId: this.projectId,
            fileId: this.fileId,
        });
    }

    public leave(): void {
        this.socket.emit('leave-file', {
            projectId: this.projectId,
            fileId: this.fileId,
        });
    }

    public destroy(): void {
        this.leave();
        this.awareness.destroy();
        this.doc.off('update', () => { });
        this.socket.off('sync-init');
        this.socket.off('sync-update');
        this.socket.off('awareness-update');
        this.socket.off('user-joined');
        this.socket.off('user-left');
    }

    public isConnected(): boolean {
        return this.connected;
    }

    public isSynced(): boolean {
        return this.synced;
    }
}
