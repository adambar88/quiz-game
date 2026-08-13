import Peer, { DataConnection } from 'peerjs';
import type { Question } from '../types/quiz.ts';
import type { QuizMode } from '../state/useQuizStore.ts';

export interface PlayerState {
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
  | 'START_GAME'
  | 'PROGRESS_UPDATE'
  | 'PLAYER_FINISHED';

export interface PeerMessage {
  type: PeerMessageType;
  senderName?: string;
  questions?: Question[];
  mode?: QuizMode;
  category?: string;
  playerState?: PlayerState;
}

type MessageCallback = (msg: PeerMessage) => void;
type ConnectionCallback = (connected: boolean) => void;

class PeerService {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private roomCode: string = '';
  private isHost: boolean = false;
  private onMessageCb: MessageCallback | null = null;
  private onConnectCb: ConnectionCallback | null = null;

  public getRoomCode(): string {
    return this.roomCode;
  }

  public getIsHost(): boolean {
    return this.isHost;
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
      this.roomCode = roomCode || this.generateRoomCode();
      this.onConnectCb = onConnect || null;
      this.onMessageCb = onMessage || null;

      const peerId = `barczynski-quiz-room-${this.roomCode.toLowerCase()}`;
      this.peer = new Peer(peerId, {
        debug: 1,
      });

      this.peer.on('open', () => {
        resolve(this.roomCode);
      });

      this.peer.on('connection', (conn) => {
        this.connection = conn;
        this.setupConnectionHandlers();
        if (this.onConnectCb) this.onConnectCb(true);
      });

      this.peer.on('error', (err) => {
        console.warn('[PeerService] Host peer error:', err);
        // Fallback room code if collision
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
      this.roomCode = roomCode.toUpperCase().trim();
      this.onConnectCb = onConnect || null;
      this.onMessageCb = onMessage || null;

      this.peer = new Peer({
        debug: 1,
      });

      this.peer.on('open', () => {
        const targetId = `barczynski-quiz-room-${this.roomCode.toLowerCase()}`;
        const conn = this.peer!.connect(targetId, { reliable: true });
        this.connection = conn;
        this.setupConnectionHandlers();

        conn.on('open', () => {
          if (this.onConnectCb) this.onConnectCb(true);
          this.sendMessage({ type: 'HANDSHAKE' });
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

  private setupConnectionHandlers() {
    if (!this.connection) return;

    this.connection.on('data', (data: any) => {
      const msg = data as PeerMessage;
      if (this.onMessageCb) this.onMessageCb(msg);
    });

    this.connection.on('close', () => {
      if (this.onConnectCb) this.onConnectCb(false);
    });

    this.connection.on('error', (err) => {
      console.warn('[PeerService] Connection error:', err);
      if (this.onConnectCb) this.onConnectCb(false);
    });
  }

  public sendMessage(msg: PeerMessage) {
    if (this.connection && this.connection.open) {
      this.connection.send(msg);
    }
  }

  public setCallbacks(onConnect?: ConnectionCallback, onMessage?: MessageCallback) {
    if (onConnect) this.onConnectCb = onConnect;
    if (onMessage) this.onMessageCb = onMessage;
  }

  public destroy() {
    if (this.connection) {
      try { this.connection.close(); } catch (_) {}
      this.connection = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (_) {}
      this.peer = null;
    }
    this.isHost = false;
  }
}

export const peerService = new PeerService();
