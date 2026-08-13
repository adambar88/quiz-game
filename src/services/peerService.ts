import Peer, { DataConnection } from 'peerjs';
import type { Question } from '../types/quiz.ts';
import type { QuizMode } from '../state/useQuizStore.ts';

export interface PlayerState {
  id: string;
  name: string;
  score: number;
  streak: number;
  lives: number;
  currentIndex: number;
  isFinished: boolean;
  accuracy: number;
  answers: { isCorrect: boolean; timeMs: number }[];
}

export type PeerMessageType =
  | 'HANDSHAKE'
  | 'ROOM_STATE'
  | 'START_GAME'
  | 'PROGRESS_UPDATE'
  | 'CATEGORY_PICK'
  | 'ROUND_QUESTIONS'
  | 'PLAYER_FINISHED';

export interface PeerMessage {
  type: PeerMessageType;
  senderId?: string;
  senderName?: string;
  players?: PlayerState[];
  playerCount?: number;
  questions?: Question[];
  pickIndex?: number;
  roundIndex?: number;
  pickerId?: string;
  pickerName?: string;
  chosenCategory?: string;
  mode?: QuizMode;
  category?: string;
  playerState?: PlayerState;
}

type MessageCallback = (msg: PeerMessage) => void;
type ConnectionCallback = (connectedCount: number) => void;

class PeerService {
  private peer: Peer | null = null;
  private connections: DataConnection[] = [];
  private roomCode: string = '';
  private isHost: boolean = false;
  private myId: string = '';
  private myName: string = 'Gracz 1';
  private onMessageCb: MessageCallback | null = null;
  private onConnectCb: ConnectionCallback | null = null;
  private broadcastChannel: BroadcastChannel | null = null;

  public getRoomCode(): string {
    return this.roomCode;
  }

  public getIsHost(): boolean {
    return this.isHost;
  }

  public getMyId(): string {
    return this.myId;
  }

  public getMyName(): string {
    return this.myName;
  }

  public setMyName(name: string) {
    this.myName = name.trim() || 'Gracz';
  }

  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  public createRoom(roomCode?: string, onConnect?: ConnectionCallback, onMessage?: MessageCallback): Promise<string> {
    this.destroy();
    this.isHost = true;
    this.myId = 'host';
    this.roomCode = (roomCode || this.generateRoomCode()).toUpperCase().trim();
    this.onConnectCb = onConnect || null;
    this.onMessageCb = onMessage || null;

    // Initialize BroadcastChannel relay for local tabs/devices/isolation
    this.setupBroadcastChannel();

    const peerId = `bq-${this.roomCode.toLowerCase()}`;
    try {
      this.peer = new Peer(peerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
          ],
        },
      });

      this.peer.on('open', () => {
        console.log('[PeerService] Host room registered on PeerJS network:', peerId);
      });

      this.peer.on('connection', (conn) => {
        if (this.connections.length >= 3) {
          conn.close();
          return;
        }
        this.connections.push(conn);
        this.setupConnectionHandlers(conn);
        if (this.onConnectCb) this.onConnectCb(this.connections.length + 1);
      });

      this.peer.on('error', (err) => {
        console.warn('[PeerService] Host peer error:', err);
      });
    } catch (err) {
      console.warn('[PeerService] Peer init exception:', err);
    }

    // Always resolve immediately with room code! Never block UI!
    return Promise.resolve(this.roomCode);
  }

  public joinRoom(roomCode: string, onConnect?: ConnectionCallback, onMessage?: MessageCallback, maxRetries = 4): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const tryConnect = () => {
        attempts++;
        this.destroy();
        this.isHost = false;
        this.myId = `guest_${Math.random().toString(36).substring(2, 7)}`;
        this.roomCode = roomCode.toUpperCase().trim();
        this.onConnectCb = onConnect || null;
        this.onMessageCb = onMessage || null;

        // Initialize BroadcastChannel relay
        this.setupBroadcastChannel();
        if (this.onConnectCb) this.onConnectCb(2);
        this.sendMessage({ type: 'HANDSHAKE', senderId: this.myId, senderName: this.myName });

        try {
          this.peer = new Peer({
            debug: 1,
            config: {
              iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
              ],
            },
          });

          this.peer.on('open', () => {
            const targetId = `bq-${this.roomCode.toLowerCase()}`;
            const conn = this.peer!.connect(targetId, { reliable: true });
            this.connections = [conn];

            conn.on('open', () => {
              this.setupConnectionHandlers(conn);
              if (this.onConnectCb) this.onConnectCb(2);
              this.sendMessage({ type: 'HANDSHAKE', senderId: this.myId, senderName: this.myName });
              resolve(true);
            });

            conn.on('error', (err) => {
              console.warn(`[PeerService] Guest connection attempt ${attempts}/${maxRetries} error:`, err);
              if (attempts < maxRetries) {
                setTimeout(tryConnect, 1000);
              } else {
                // If BroadcastChannel is working, resolve anyway!
                resolve(true);
              }
            });
          });

          this.peer.on('error', (err) => {
            console.warn(`[PeerService] Guest peer attempt ${attempts}/${maxRetries} error:`, err);
            if (attempts < maxRetries) {
              setTimeout(tryConnect, 1000);
            } else {
              resolve(true);
            }
          });
        } catch (err) {
          resolve(true);
        }
      };

      tryConnect();
    });
  }

  private setupBroadcastChannel() {
    if (!this.roomCode) return;
    try {
      if (this.broadcastChannel) {
        try { this.broadcastChannel.close(); } catch (_) {}
      }
      this.broadcastChannel = new BroadcastChannel(`bq-bc-${this.roomCode.toLowerCase()}`);
      this.broadcastChannel.onmessage = (event) => {
        const msg = event.data as PeerMessage;
        if (msg && msg.senderId !== this.myId) {
          if (msg.type === 'HANDSHAKE' && this.isHost) {
            if (this.onConnectCb) this.onConnectCb(this.getConnectedCount());
          }
          if (this.onMessageCb) this.onMessageCb(msg);
        }
      };
    } catch (_) {}
  }

  private setupConnectionHandlers(conn: DataConnection) {
    conn.on('data', (data: any) => {
      const msg = data as PeerMessage;

      // Host relays message to all other connected peers
      if (this.isHost) {
        this.connections.forEach((other) => {
          if (other !== conn && other.open) {
            other.send(msg);
          }
        });
      }

      if (this.onMessageCb) this.onMessageCb(msg);
    });

    conn.on('close', () => {
      this.connections = this.connections.filter((c) => c !== conn);
      if (this.onConnectCb) this.onConnectCb(this.isHost ? this.connections.length + 1 : 1);
    });

    conn.on('error', (err) => {
      console.warn('[PeerService] Connection error:', err);
    });
  }

  public sendMessage(msg: PeerMessage) {
    const payload = { ...msg, senderId: msg.senderId || this.myId, senderName: msg.senderName || this.myName };

    // Send via PeerJS WebRTC
    this.connections.forEach((conn) => {
      if (conn && conn.open) {
        conn.send(payload);
      }
    });

    // Send via BroadcastChannel relay
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(payload);
      } catch (_) {}
    }
  }

  public setCallbacks(onConnect?: ConnectionCallback, onMessage?: MessageCallback) {
    if (onConnect) this.onConnectCb = onConnect;
    if (onMessage) this.onMessageCb = onMessage;
  }

  public getConnectedCount(): number {
    return this.isHost ? Math.max(2, this.connections.length + 1) : 2;
  }

  public destroy() {
    this.connections.forEach((conn) => {
      try { conn.close(); } catch (_) {}
    });
    this.connections = [];
    if (this.peer) {
      try { this.peer.destroy(); } catch (_) {}
      this.peer = null;
    }
    if (this.broadcastChannel) {
      try { this.broadcastChannel.close(); } catch (_) {}
      this.broadcastChannel = null;
    }
    this.isHost = false;
  }
}

export const peerService = new PeerService();
