// ============================================================
// Brawl Impact - Socket Client
// ============================================================

import { io, Socket } from 'socket.io-client';
import {
  ClientEvent,
  ServerEvent,
  RoomState,
  GameState,
  GameResult,
  HitEffect,
  CharacterType,
  PlayerInput,
  CreateRoomPayload,
  JoinRoomPayload,
  SelectCharacterPayload,
  InputPayload,
  GameMode,
} from '@shared/types';

type EventCallback = (...args: unknown[]) => void;

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
      this.emit('_connected', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      this.emit('_disconnected', reason);
    });

    // Register all server event listeners
    Object.values(ServerEvent).forEach((event) => {
      this.socket!.on(event, (...args: unknown[]) => {
        this.emit(event, ...args);
      });
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  getId(): string | undefined {
    return this.socket?.id;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // --- Room Actions ---

  createRoom(nickname: string, character: CharacterType, mode?: GameMode): void {
    const payload: CreateRoomPayload = { nickname, character, mode };
    this.socket?.emit(ClientEvent.ROOM_CREATE, payload);
  }

  joinRoom(roomCode: string, nickname: string, character: CharacterType): void {
    const payload: JoinRoomPayload = { roomCode, nickname, character };
    this.socket?.emit(ClientEvent.ROOM_JOIN, payload);
  }

  leaveRoom(): void {
    this.socket?.emit(ClientEvent.ROOM_LEAVE);
  }

  selectCharacter(character: CharacterType): void {
    const payload: SelectCharacterPayload = { character };
    this.socket?.emit(ClientEvent.PLAYER_SELECT_CHARACTER, payload);
  }

  setReady(): void {
    this.socket?.emit(ClientEvent.PLAYER_READY);
  }

  startMatch(): void {
    this.socket?.emit(ClientEvent.MATCH_START);
  }

  sendInput(input: PlayerInput): void {
    const payload: InputPayload = { input, timestamp: Date.now() };
    this.socket?.emit(ClientEvent.PLAYER_INPUT, payload);
  }

  returnToLobby(): void {
    this.socket?.emit('match:returnToLobby');
  }

  // --- Event System ---

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((cb) => cb(...args));
  }

  // --- Typed Event Helpers ---

  onRoomCreated(cb: (state: RoomState) => void): () => void {
    const handler = (data: unknown) => cb(data as RoomState);
    this.on(ServerEvent.ROOM_CREATED, handler);
    return () => this.off(ServerEvent.ROOM_CREATED, handler);
  }

  onRoomState(cb: (state: RoomState) => void): () => void {
    const handler = (data: unknown) => cb(data as RoomState);
    this.on(ServerEvent.ROOM_STATE, handler);
    return () => this.off(ServerEvent.ROOM_STATE, handler);
  }

  onGameStart(cb: (data: { state: GameState }) => void): () => void {
    const handler = (data: unknown) => cb(data as { state: GameState });
    this.on(ServerEvent.GAME_START, handler);
    return () => this.off(ServerEvent.GAME_START, handler);
  }

  onGameState(cb: (data: { state: GameState; hitEffects: HitEffect[] }) => void): () => void {
    const handler = (data: unknown) => cb(data as { state: GameState; hitEffects: HitEffect[] });
    this.on(ServerEvent.GAME_STATE, handler);
    return () => this.off(ServerEvent.GAME_STATE, handler);
  }

  onGameOver(cb: (result: GameResult) => void): () => void {
    const handler = (data: unknown) => cb(data as GameResult);
    this.on(ServerEvent.GAME_OVER, handler);
    return () => this.off(ServerEvent.GAME_OVER, handler);
  }

  onPlayerHit(cb: (effect: HitEffect) => void): () => void {
    const handler = (data: unknown) => cb(data as HitEffect);
    this.on(ServerEvent.PLAYER_HIT, handler);
    return () => this.off(ServerEvent.PLAYER_HIT, handler);
  }

  onPlayerEliminated(cb: (data: { playerId: string; eliminatedBy: string | null }) => void): () => void {
    const handler = (data: unknown) => cb(data as { playerId: string; eliminatedBy: string | null });
    this.on(ServerEvent.PLAYER_ELIMINATED, handler);
    return () => this.off(ServerEvent.PLAYER_ELIMINATED, handler);
  }

  onCountdownTick(cb: (data: { seconds: number }) => void): () => void {
    const handler = (data: unknown) => cb(data as { seconds: number });
    this.on(ServerEvent.COUNTDOWN_TICK, handler);
    return () => this.off(ServerEvent.COUNTDOWN_TICK, handler);
  }

  onError(cb: (data: { message: string }) => void): () => void {
    const handler = (data: unknown) => cb(data as { message: string });
    this.on(ServerEvent.ERROR, handler);
    return () => this.off(ServerEvent.ERROR, handler);
  }

  onConnected(cb: (id: string) => void): () => void {
    const handler = (id: unknown) => cb(id as string);
    this.on('_connected', handler);
    return () => this.off('_connected', handler);
  }

  onDisconnected(cb: (reason: string) => void): () => void {
    const handler = (reason: unknown) => cb(reason as string);
    this.on('_disconnected', handler);
    return () => this.off('_disconnected', handler);
  }
}

// Singleton
export const socketClient = new SocketClient();
