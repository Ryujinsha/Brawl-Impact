// ============================================================
// Brawl Impact - Room Manager
// ============================================================

import {
  RoomState,
  PlayerInfo,
  GamePhase,
  CharacterType,
  PlayerInput,
  GameState,
  GameResult,
  HitEffect,
} from '../../../shared/types.js';
import { GAME_CONFIG } from '../../../shared/gameConfig.js';
import { ServerGameEngine } from '../game/GameEngine.js';

export interface Room {
  code: string;
  players: Map<string, PlayerInfo>;
  hostId: string;
  phase: GamePhase;
  maxPlayers: number;
  gameEngine: ServerGameEngine | null;
  gameLoopInterval: ReturnType<typeof setInterval> | null;
  inputs: Map<string, PlayerInput>;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private playerRooms: Map<string, string> = new Map(); // playerId -> roomCode

  // Callbacks
  public onGameStateUpdate?: (roomCode: string, state: GameState, hitEffects: HitEffect[]) => void;
  public onGameOver?: (roomCode: string, result: GameResult) => void;
  public onPlayerEliminated?: (roomCode: string, playerId: string, eliminatedBy: string | null) => void;
  public onHit?: (roomCode: string, effect: HitEffect) => void;
  public onCountdownTick?: (roomCode: string, seconds: number) => void;

  generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Ensure unique
    if (this.rooms.has(code)) return this.generateRoomCode();
    return code;
  }

  createRoom(hostId: string, nickname: string, character: CharacterType): Room {
    const code = this.generateRoomCode();
    const hostInfo: PlayerInfo = {
      id: hostId,
      nickname,
      character,
      isReady: false,
      isHost: true,
    };

    const room: Room = {
      code,
      players: new Map([[hostId, hostInfo]]),
      hostId,
      phase: GamePhase.ROOM,
      maxPlayers: GAME_CONFIG.MAX_PLAYERS,
      gameEngine: null,
      gameLoopInterval: null,
      inputs: new Map(),
    };

    this.rooms.set(code, room);
    this.playerRooms.set(hostId, code);
    this.syncRoomToLaravel(code, nickname, 1, 'waiting');
    return room;
  }

  joinRoom(roomCode: string, playerId: string, nickname: string, character: CharacterType): Room | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    if (room.players.size >= room.maxPlayers) return null;
    if (room.phase !== GamePhase.ROOM) return null;

    const playerInfo: PlayerInfo = {
      id: playerId,
      nickname,
      character,
      isReady: false,
      isHost: false,
    };

    room.players.set(playerId, playerInfo);
    this.playerRooms.set(playerId, roomCode);
    return room;
  }

  leaveRoom(playerId: string): { room: Room; wasHost: boolean; newHostId: string | null } | null {
    const roomCode = this.playerRooms.get(playerId);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const wasHost = room.hostId === playerId;
    room.players.delete(playerId);
    this.playerRooms.delete(playerId);

    let newHostId: string | null = null;

    if (room.players.size === 0) {
      // Clean up empty room
      this.stopGameLoop(room);
      this.rooms.delete(roomCode);
      return { room, wasHost, newHostId: null };
    }

    if (wasHost) {
      // Assign new host
      const firstPlayer = room.players.values().next().value;
      if (firstPlayer) {
        firstPlayer.isHost = true;
        room.hostId = firstPlayer.id;
        newHostId = firstPlayer.id;
      }
    }

    // If game is running and only 1 player left, end game with result
    if ((room.phase === GamePhase.PLAYING || room.phase === GamePhase.COUNTDOWN) && room.players.size <= 1) {
      this.stopGameLoop(room);
      room.phase = GamePhase.GAME_OVER;

      // Generate proper game result if engine exists
      if (room.gameEngine && room.players.size === 1) {
        const result = room.gameEngine.getGameResult();
        // Override: the remaining player is the winner
        const remainingPlayer = room.players.values().next().value;
        if (remainingPlayer) {
          result.winnerId = remainingPlayer.id;
          result.winnerNickname = remainingPlayer.nickname;
          // Fix rankings so remaining player is #1
          const existing = result.rankings.find(r => r.playerId === remainingPlayer.id);
          if (existing) {
            existing.placement = 1;
          }
          result.rankings.sort((a, b) => a.placement - b.placement);
        }
        if (this.onGameOver) this.onGameOver(roomCode, result);
      }
    }

    return { room, wasHost, newHostId };
  }

  setReady(playerId: string, ready: boolean): Room | null {
    const roomCode = this.playerRooms.get(playerId);
    if (!roomCode) return null;
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const player = room.players.get(playerId);
    if (player) {
      player.isReady = ready;
    }
    return room;
  }

  selectCharacter(playerId: string, character: CharacterType): Room | null {
    const roomCode = this.playerRooms.get(playerId);
    if (!roomCode) return null;
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const player = room.players.get(playerId);
    if (player) {
      player.character = character;
    }
    return room;
  }

  canStartMatch(roomCode: string, requesterId: string): { canStart: boolean; reason?: string } {
    const room = this.rooms.get(roomCode);
    if (!room) return { canStart: false, reason: 'Room not found' };
    if (room.hostId !== requesterId) return { canStart: false, reason: 'Not the host' };
    if (room.players.size < GAME_CONFIG.MIN_PLAYERS) {
      return { canStart: false, reason: `Need at least ${GAME_CONFIG.MIN_PLAYERS} players` };
    }
    if (room.phase !== GamePhase.ROOM) return { canStart: false, reason: 'Game already started' };

    return { canStart: true };
  }

  startMatch(roomCode: string): Room | null {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== GamePhase.ROOM) return null;

    // Ensure any prior game loop is cleared
    this.stopGameLoop(room);

    // Create game engine with player info
    const playerInfos = Array.from(room.players.values()).map((p) => ({
      id: p.id,
      nickname: p.nickname,
      character: p.character,
    }));

    room.gameEngine = new ServerGameEngine(playerInfos);
    room.phase = GamePhase.COUNTDOWN;
    room.inputs = new Map();

    // Sync match start to Laravel
    this.syncMatchStartToLaravel(roomCode, playerInfos.length);

    // Set up callbacks
    room.gameEngine.onHit = (effect) => {
      if (this.onHit) this.onHit(roomCode, effect);
    };

    room.gameEngine.onElimination = (playerId, eliminatedBy) => {
      if (this.onPlayerEliminated) this.onPlayerEliminated(roomCode, playerId, eliminatedBy);
    };

    room.gameEngine.onGameOver = (result) => {
      this.stopGameLoop(room);
      room.phase = GamePhase.GAME_OVER;
      console.log(`[Match] Game over in room ${roomCode}. Winner: ${result.winnerNickname || result.winnerId}`);
      this.syncMatchFinishToLaravel(roomCode, result);
      if (this.onGameOver) this.onGameOver(roomCode, result);
    };

    // Start game loop
    let lastCountdown = -1;
    const tickMs = 1000 / GAME_CONFIG.TICK_RATE;
    room.gameLoopInterval = setInterval(() => {
      if (!room.gameEngine) return;

      room.gameEngine.update(room.inputs);
      const state = room.gameEngine.getState();
      const hitEffects = room.gameEngine.getHitEffects();

      // Broadcast countdown ticks
      if (state.phase === GamePhase.COUNTDOWN && state.countdown !== lastCountdown) {
        lastCountdown = state.countdown;
        if (this.onCountdownTick) this.onCountdownTick(roomCode, state.countdown);
      }

      // Update room phase
      if (state.phase === GamePhase.PLAYING && room.phase === GamePhase.COUNTDOWN) {
        room.phase = GamePhase.PLAYING;
      }

      // Broadcast state at network rate
      if (state.tick % Math.floor(GAME_CONFIG.TICK_RATE / GAME_CONFIG.NETWORK_SEND_RATE) === 0) {
        if (this.onGameStateUpdate) this.onGameStateUpdate(roomCode, state, hitEffects);
      }
    }, tickMs);

    return room;
  }

  processInput(playerId: string, input: PlayerInput): void {
    const roomCode = this.playerRooms.get(playerId);
    if (!roomCode) return;
    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.inputs.set(playerId, input);
  }

  returnToLobby(roomCode: string): Room | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    this.stopGameLoop(room);
    room.phase = GamePhase.ROOM;
    room.gameEngine = null;
    room.inputs = new Map();

    // Reset ready states
    for (const player of room.players.values()) {
      player.isReady = false;
    }

    return room;
  }

  private stopGameLoop(room: Room): void {
    if (room.gameLoopInterval) {
      clearInterval(room.gameLoopInterval);
      room.gameLoopInterval = null;
    }
  }

  getRoom(roomCode: string): Room | null {
    return this.rooms.get(roomCode) || null;
  }

  getPlayerRoom(playerId: string): string | undefined {
    return this.playerRooms.get(playerId);
  }

  getRoomState(room: Room): RoomState {
    return {
      code: room.code,
      players: Array.from(room.players.values()),
      hostId: room.hostId,
      phase: room.phase,
      maxPlayers: room.maxPlayers,
    };
  }

  private syncRoomToLaravel(code: string, hostNickname: string, currentPlayers: number, status: string): void {
    const LARAVEL_API = process.env.LARAVEL_API || 'http://localhost:8000/api';
    fetch(`${LARAVEL_API}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        host_nickname: hostNickname,
        current_players: currentPlayers,
        status,
      }),
    }).catch(() => {});
  }

  private syncMatchStartToLaravel(roomCode: string, playerCount: number): void {
    const LARAVEL_API = process.env.LARAVEL_API || 'http://localhost:8000/api';
    fetch(`${LARAVEL_API}/matches/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_code: roomCode, player_count: playerCount }),
    }).catch(() => {});
  }

  private async syncMatchFinishToLaravel(roomCode: string, result: GameResult): Promise<void> {
    try {
      const LARAVEL_API = process.env.LARAVEL_API || 'http://localhost:8000/api';
      const winner = result.rankings.find((r) => r.playerId === result.winnerId);
      const payload = {
        room_code: roomCode,
        winner_nickname: result.winnerNickname || (winner ? winner.nickname : null),
        winner_character: winner ? winner.character : null,
        duration_seconds: 60,
        rankings: result.rankings.map((r) => ({
          player_nickname: r.nickname,
          character: r.character,
          placement: r.placement,
          damage_dealt: r.damageDealt,
          eliminated_by: r.eliminatedBy,
        })),
      };

      const res = await fetch(`${LARAVEL_API}/matches/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        console.log(`[Laravel API] Match recorded in SQLite database for room ${roomCode}`);
      }
    } catch (err) {
      console.warn(`[Laravel API] Sync note:`, (err as Error).message);
    }
  }
}
