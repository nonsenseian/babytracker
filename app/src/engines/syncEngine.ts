/**
 * Multi-User Real-time Sync Engine & Couples Account Service
 * Provides zero-dependency cross-device and cross-tab synchronization
 * via BroadcastChannel, URL room tokens (?room=...), and cloud relay topics.
 */

export interface RemoteSyncPayload {
    type: 'STATE_UPDATE' | 'SYNC_REQUEST' | 'PING' | 'PONG';
    senderId: string;
    roomId: string;
    timestamp: number;
    payload?: {
        logs?: any[];
        children?: any[];
        activeChildId?: string;
        appointments?: any[];
        caregivers?: any[];
        childTimersMap?: Record<string, any>;
        settings?: any;
        caregiverShift?: any;
    };
}

export class SyncService {
    private channel: BroadcastChannel | null = null;
    private roomId: string = '';
    private deviceId: string = '';
    private eventSource: EventSource | null = null;
    private listeners: ((payload: any) => void)[] = [];
    private pingListeners: ((senderId: string) => void)[] = [];
    private isConnected: boolean = false;

    public getIsConnected(): boolean {
        return this.isConnected;
    }

    constructor() {
        this.initDeviceId();
        this.initRoomId();
        this.initChannel();
        this.initCloudRelay();

        if (typeof window !== 'undefined') {
            (window as any).__BT_INJECT_SYNC__ = (payload: any) => {
                this.handleIncomingMessage(payload);
            };
        }
    }

    private initDeviceId() {
        try {
            if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                const urlDev = params.get('dev');
                if (urlDev) {
                    this.deviceId = urlDev.trim();
                    return;
                }
            }
        } catch (e) {}

        let dev = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('bt_device_id') : null) || localStorage.getItem('bt_device_id');
        if (!dev) {
            dev = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
            try { sessionStorage.setItem('bt_device_id', dev); } catch (e) {}
            localStorage.setItem('bt_device_id', dev);
        }
        this.deviceId = dev;
    }

    private initRoomId() {
        try {
            if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                const urlRoom = params.get('room');
                if (urlRoom) {
                    this.roomId = urlRoom.trim();
                    localStorage.setItem('bt_room_id', this.roomId);
                    return;
                }
            }
        } catch (e) {}

        const stored = localStorage.getItem('bt_room_id');
        if (stored) {
            this.roomId = stored;
        } else {
            this.roomId = 'family-' + Math.random().toString(36).substring(2, 8);
            localStorage.setItem('bt_room_id', this.roomId);
        }
    }

    private initChannel() {
        try {
            if (typeof BroadcastChannel !== 'undefined') {
                if (this.channel) {
                    this.channel.close();
                }
                this.channel = new BroadcastChannel(`bt_family_channel_${this.roomId}`);
                this.channel.onmessage = (e) => {
                    this.handleIncomingMessage(e.data);
                };
            }
            this.isConnected = true;
        } catch (e) {
            console.warn('BroadcastChannel error:', e);
        }
    }

    private initCloudRelay() {
        if (typeof window === 'undefined') return;
        // Don't keep persistent SSE open during automated headless testing to avoid blocking page load
        if (typeof navigator !== 'undefined' && /Headless|Playwright|Puppeteer/i.test(navigator.userAgent)) {
            return;
        }
        try {
            if (this.eventSource) {
                this.eventSource.close();
            }
            // ntfy.sh is a public zero-auth SSE relay supporting standard pub/sub
            const topic = `bt_relay_${this.roomId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
            this.eventSource = new EventSource(`https://ntfy.sh/${topic}/sse`);
            this.eventSource.onmessage = (event) => {
                try {
                    const parsed = JSON.parse(event.data);
                    if (parsed && parsed.message) {
                        const payload: RemoteSyncPayload = JSON.parse(parsed.message);
                        this.handleIncomingMessage(payload);
                    }
                } catch (e) {}
            };
        } catch (e) {
            // Cloud SSE fallback silently gracefully
        }
    }

    private handleIncomingMessage(msg: RemoteSyncPayload) {
        if (!msg || msg.senderId === this.deviceId) return;

        if (msg.type === 'STATE_UPDATE' && msg.payload) {
            this.listeners.forEach(fn => {
                try { fn(msg.payload); } catch (e) {}
            });
        } else if (msg.type === 'PING') {
            this.broadcastPong();
        } else if (msg.type === 'PONG') {
            this.pingListeners.forEach(fn => {
                try { fn(msg.senderId); } catch (e) {}
            });
        }
    }

    public getRoomId(): string {
        return this.roomId;
    }

    public getDeviceId(): string {
        return this.deviceId;
    }

    public setRoomId(newRoom: string) {
        if (!newRoom || newRoom.trim() === this.roomId) return;
        this.roomId = newRoom.trim();
        localStorage.setItem('bt_room_id', this.roomId);

        try {
            if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                url.searchParams.set('room', this.roomId);
                window.history.replaceState({}, '', url.toString());
            }
        } catch (e) {}

        this.initChannel();
        this.initCloudRelay();
        this.broadcastPing();
    }

    public getPartnerInviteUrl(): string {
        if (typeof window === 'undefined') return '';
        const url = new URL(window.location.href);
        url.searchParams.set('room', this.roomId);
        return url.toString();
    }

    public broadcastState(state: any) {
        const message: RemoteSyncPayload = {
            type: 'STATE_UPDATE',
            senderId: this.deviceId,
            roomId: this.roomId,
            timestamp: Date.now(),
            payload: state
        };

        // 1. BroadcastChannel for local devices/tabs
        if (this.channel) {
            try {
                this.channel.postMessage(message);
            } catch (e) {}
        }

        // 2. Cloud Relay for remote partner devices
        try {
            const topic = `bt_relay_${this.roomId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
            fetch(`https://ntfy.sh/${topic}`, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(message)
            }).catch(() => {});
        } catch (e) {}

        // 3. Optional local bridge hook for testing cross-context devices
        if (typeof window !== 'undefined' && (window as any).__BT_SYNC_HOOK__) {
            try {
                (window as any).__BT_SYNC_HOOK__(message);
            } catch (e) {}
        }
    }

    public broadcastPing() {
        const message: RemoteSyncPayload = {
            type: 'PING',
            senderId: this.deviceId,
            roomId: this.roomId,
            timestamp: Date.now()
        };
        if (this.channel) {
            try { this.channel.postMessage(message); } catch (e) {}
        }
        try {
            const topic = `bt_relay_${this.roomId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
            fetch(`https://ntfy.sh/${topic}`, {
                method: 'POST',
                body: JSON.stringify(message)
            }).catch(() => {});
        } catch (e) {}
    }

    public broadcastPong() {
        const message: RemoteSyncPayload = {
            type: 'PONG',
            senderId: this.deviceId,
            roomId: this.roomId,
            timestamp: Date.now()
        };
        if (this.channel) {
            try { this.channel.postMessage(message); } catch (e) {}
        }
    }

    public onRemoteUpdate(handler: (state: any) => void): () => void {
        this.listeners.push(handler);
        return () => {
            this.listeners = this.listeners.filter(fn => fn !== handler);
        };
    }

    public onPartnerPing(handler: (senderId: string) => void): () => void {
        this.pingListeners.push(handler);
        return () => {
            this.pingListeners = this.pingListeners.filter(fn => fn !== handler);
        };
    }

    /**
     * Generate an exportable transfer bundle for offline backup or instant transfer
     */
    public generateTransferCode(data: any): string {
        try {
            const json = JSON.stringify({
                version: 1,
                room: this.roomId,
                exportedAt: Date.now(),
                data
            });
            return btoa(unescape(encodeURIComponent(json)));
        } catch (e) {
            return '';
        }
    }

    /**
     * Import a transfer code
     */
    public importTransferCode(rawCode: string): any | null {
        try {
            const json = decodeURIComponent(escape(atob(rawCode.trim())));
            const parsed = JSON.parse(json);
            if (parsed && parsed.data) {
                if (parsed.room) {
                    this.setRoomId(parsed.room);
                }
                return parsed.data;
            }
        } catch (e) {
            console.warn('Failed to parse transfer code:', e);
        }
        return null;
    }
}

export const syncService = new SyncService();
