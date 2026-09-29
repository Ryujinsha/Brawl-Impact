// ============================================================
// Brawl Impact - Socket Handler
// ============================================================

import { Server, Socket } from 'socket.io';
import { RoomManager } from '../rooms/RoomManager.js';
import {
  ClientEvent,
  ServerEvent,
  CreateRoomPayload,
  JoinRoomPayload,
  SelectCharacterPayload,
  InputPayload,
  GameState,
  HitEffect,
  GameResult,
} from '../../../shared/types.js';

export class SocketHandler {
  private io: Server;
  private roomManager: RoomManager;

  constructor(io: Server) {
    this.io = io;
    this.roomManager = new RoomManager();
    this.setupRoomCallbacks();
  }

  private setupRoomCallbacks(): void {
    this.roomManager.onGameStateUpdate = (roomCode: string, state: GameState, hitEffects: HitEffect[]) => {
      this.io.to(roomCode).emit(ServerEvent.GAME_STATE, { state, hitEffects });
    };

    this.roomManager.onGameOver = (roomCode: string, result: GameResult) => {
      this.io.to(roomCode).emit(ServerEvent.GAME_OVER, result);
    };

    this.roomManager.onPlayerEliminated = (roomCode: string, playerId: string, eliminatedBy: string | null) => {
      this.io.to(roomCode).emit(ServerEvent.PLAYER_ELIMINATED, { playerId, eliminatedBy });
    };

    this.roomManager.onHit = (roomCode: string, effect: HitEffect) => {
      this.io.to(roomCode).emit(ServerEvent.PLAYER_HIT, effect);
    };

    this.roomManager.onCountdownTick = (roomCode: string, seconds: number) => {
      this.io.to(roomCode).emit(ServerEvent.COUNTDOWN_TICK, { seconds });
    };
  }

  handleConnection(socket: Socket): void {
    console.log(`[Socket] Player connected: ${socket.id}`);

    // Create Room
    socket.on(ClientEvent.ROOM_CREATE, (payload: CreateRoomPayload) => {
      try {
        const mode = payload.mode || 'ffa';
        const room = this.roomManager.createRoom(socket.id, payload.nickname, payload.character, mode);
        socket.join(room.code);
        const roomState = this.roomManager.getRoomState(room);
        socket.emit(ServerEvent.ROOM_CREATED, roomState);
        console.log(`[Room] Created: ${room.code} [${mode}] by ${payload.nickname}`);
      } catch (err) {
        console.error('[Room] Failed to create room:', err);
        socket.emit(ServerEvent.ERROR, { message: 'Failed to create room' });
      }
    });

    // Join Room
    socket.on(ClientEvent.ROOM_JOIN, (payload: JoinRoomPayload) => {
      try {
        const room = this.roomManager.joinRoom(payload.roomCode, socket.id, payload.nickname, payload.character);
        if (!room) {
          socket.emit(ServerEvent.ERROR, { message: 'Cannot join room. Room may be full or not found.' });
          return;
        }
        socket.join(room.code);
        const roomState = this.roomManager.getRoomState(room);
        this.io.to(room.code).emit(ServerEvent.ROOM_STATE, roomState);
        this.io.to(room.code).emit(ServerEvent.PLAYER_JOINED, {
          playerId: socket.id,
          nickname: payload.nickname,
        });
        console.log(`[Room] ${payload.nickname} joined ${room.code}`);
      } catch (err) {
        console.error('[Room] Failed to join room:', err);
        socket.emit(ServerEvent.ERROR, { message: 'Failed to join room' });
      }
    });

    // Leave Room
    socket.on(ClientEvent.ROOM_LEAVE, () => {
      this.handleLeaveRoom(socket);
    });

    // Select Character
    socket.on(ClientEvent.PLAYER_SELECT_CHARACTER, (payload: SelectCharacterPayload) => {
      const room = this.roomManager.selectCharacter(socket.id, payload.character);
      if (room) {
        const roomState = this.roomManager.getRoomState(room);
        this.io.to(room.code).emit(ServerEvent.ROOM_STATE, roomState);
      }
    });

    // Ready
    socket.on(ClientEvent.PLAYER_READY, () => {
      const room = this.roomManager.setReady(socket.id, true);
      if (room) {
        const roomState = this.roomManager.getRoomState(room);
        this.io.to(room.code).emit(ServerEvent.ROOM_STATE, roomState);
      }
    });

    // Start Match
    socket.on(ClientEvent.MATCH_START, () => {
      const roomCode = this.roomManager.getPlayerRoom(socket.id);
      if (!roomCode) return;

      const check = this.roomManager.canStartMatch(roomCode, socket.id);
      if (!check.canStart) {
        socket.emit(ServerEvent.ERROR, { message: check.reason || 'Cannot start match' });
        return;
      }

      const room = this.roomManager.startMatch(roomCode);
      if (room && room.gameEngine) {
        const state = room.gameEngine.getState();
        this.io.to(roomCode).emit(ServerEvent.GAME_START, { state });
        console.log(`[Match] Started in room ${roomCode}`);
      }
    });

    // Player Input
    socket.on(ClientEvent.PLAYER_INPUT, (payload: InputPayload) => {
      this.roomManager.processInput(socket.id, payload.input);
    });

    // Return to Lobby
    socket.on('match:returnToLobby', () => {
      const roomCode = this.roomManager.getPlayerRoom(socket.id);
      if (!roomCode) return;

      const room = this.roomManager.returnToLobby(roomCode);
      if (room) {
        const roomState = this.roomManager.getRoomState(room);
        this.io.to(roomCode).emit(ServerEvent.ROOM_STATE, roomState);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket] Player disconnected: ${socket.id}`);
      this.handleLeaveRoom(socket);
    });
  }

  private handleLeaveRoom(socket: Socket): void {
    const result = this.roomManager.leaveRoom(socket.id);
    if (result) {
      const { room, newHostId } = result;
      socket.leave(room.code);

      if (room.players.size > 0) {
        const roomState = this.roomManager.getRoomState(room);
        this.io.to(room.code).emit(ServerEvent.ROOM_STATE, roomState);
        this.io.to(room.code).emit(ServerEvent.PLAYER_LEFT, {
          playerId: socket.id,
          newHostId,
        });
      }

      console.log(`[Room] Player ${socket.id} left room ${room.code}`);
    }
  }
}
