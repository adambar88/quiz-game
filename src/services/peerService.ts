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
    return new Promise((resolve, reject) => {
      this.destroy();
      this.isHost = true;
      this.myId = 'host';
      this.roomCode = roomCode || this.generateRoomCode();
      this.onConnectCb = onConnect || null;
      this.onMessageCb = onMessage || null;

      const peerId = `barczynski-quiz-room-${this.roomCode.toLowerCase()}`;
      this.peer = new Peer(peerId, { debug: 1 });

      this.peer.on('open', () => {
        resolve(this.roomCode);
      });

      this.peer.on('connection', (conn) => {
        if (this.connections.length >= 3) {
          // Room full (max 4 players)
          conn.close();
          return;
        }
        this.connections.push(conn);
        this.setupConnectionHandlers(conn);
        if (this.onConnectCb) this.onConnectCb(this.connections.length + 1);
      });

      this.peer.on('error', (err) => {
        console.warn('[PeerService] Host peer error:', err);
        if (err.type === 'unavailable-id') {
          this.roomCode = this.generateRoomCode();
          this.createRoom(this.roomCode, onConnect, onMessage).then(resolve).catch(reject);
        } else {
          reject(err);
        }
      });
    });
  }

  public joinRoom(roomCode: string, onConnect?: ConnectionCallback, onMessage?: MessageCallback): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.destroy();
      this.isHost = false;
      this.myId = `guest_${Math.random().toString(36).substring(2, 7)}`;
      this.roomCode = roomCode.toUpperCase().trim();
      this.onConnectCb = onConnect || null;
      this.onMessageCb = onMessage || null;

      this.peer = new Peer({ debug: 1 });

      this.peer.on('open', () => {
        const targetId = `barczynski-quiz-room-${this.roomCode.toLowerCase()}`;
        const conn = this.peer!.connect(targetId, { reliable: true });
        this.connections = [conn];
        this.setupConnectionHandlers(conn);

        conn.on('open', () => {
          if (this.onConnectCb) this.onConnectCb(2);
          this.sendMessage({ type: 'HANDSHAKE', senderId: this.myId, senderName: this.myName });
          resolve(true);
        });

        conn.on('error', (err) => {
          reject(err);
        });
      });

      this.peer.on('error', (err) => {
        console.warn('[PeerService] Guest peer error:', err);
        reject(err);
      });
    });
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
    this.connections.forEach((conn) => {
      if (conn && conn.open) {
        conn.send(payload);
      }
    });
  }

  public setCallbacks(onConnect?: ConnectionCallback, onMessage?: MessageCallback) {
    if (onConnect) this.onConnectCb = onConnect;
    if (onMessage) this.onMessageCb = onMessage;
  }

  public getConnectedCount(): number {
    return this.isHost ? this.connections.length + 1 : (this.connections.length > 0 ? 2 : 1);
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
    this.isHost = false;
  }
}

export const peerService = new PeerService();
