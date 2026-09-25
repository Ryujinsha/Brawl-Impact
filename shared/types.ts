// ============================================================
// Brawl Impact - Shared Types
// ============================================================

// --- Enums ---

export enum GamePhase {
  LOBBY = 'LOBBY',
  ROOM = 'ROOM',
  COUNTDOWN = 'COUNTDOWN',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  RESULT = 'RESULT',
}

export enum CharacterType {
  KNIGHT = 'KNIGHT',
  MAGE = 'MAGE',
  ASSASSIN = 'ASSASSIN',
  FIGHTER = 'FIGHTER',
}

export enum AttackType {
  BASIC = 'BASIC',
  ABILITY = 'ABILITY',
  ULTIMATE = 'ULTIMATE',
}

export enum Direction {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

// --- Character Stats ---

export interface CharacterStats {
  maxHp: number;
  moveSpeed: number;
  jumpForce: number;
  attackDamage: number;
  knockbackPower: number;
  abilityCooldown: number;
  ultimateCooldown: number;
  abilityDamage: number;
  ultimateDamage: number;
}

// --- Player ---

export interface PlayerInput {
  left: boolean;
  right: boolean;
  jump: boolean;
  attack: boolean;
  ability: boolean;
  ultimate: boolean;
  sequence: number;
}

export interface PlayerState {
  id: string;
  nickname: string;
  character: CharacterType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  direction: Direction;
  damagePercent: number;
  isAlive: boolean;
  isGrounded: boolean;
  isAttacking: boolean;
  attackType: AttackType | null;
  attackTimer: number;
  abilityCooldownTimer: number;
  ultimateCooldownTimer: number;
  isShielding: boolean;
  isInvincible: boolean;
  invincibleTimer: number;
  hitStunTimer: number;
  stocks: number;
}

export interface PlayerInfo {
  id: string;
  nickname: string;
  character: CharacterType;
  isReady: boolean;
  isHost: boolean;
}

// --- Room ---

export interface RoomState {
  code: string;
  players: PlayerInfo[];
  hostId: string;
  phase: GamePhase;
  maxPlayers: number;
}

// --- Game ---

export interface GameState {
  phase: GamePhase;
  players: PlayerState[];
  countdown: number;
  winnerId: string | null;
  arenaId: string;
  tick: number;
}

export interface GameResult {
  winnerId: string;
  winnerNickname: string;
  rankings: Array<{
    playerId: string;
    nickname: string;
    character: CharacterType;
    placement: number;
    damageDealt: number;
    eliminatedBy: string | null;
  }>;
}

// --- Platform / Arena ---

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  isPassthrough: boolean;
}

export interface ArenaConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  platforms: Platform[];
  deathBounds: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  spawnPoints: Array<{ x: number; y: number }>;
}

// --- Attack / Hitbox ---

export interface Hitbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AttackData {
  type: AttackType;
  damage: number;
  knockbackBase: number;
  knockbackMultiplier: number;
  knockbackAngle: number; // in radians
  hitboxWidth: number;
  hitboxHeight: number;
  hitboxOffsetX: number;
  hitboxOffsetY: number;
  duration: number; // frames
  startupFrames: number;
  activeFrames: number;
  recoveryFrames: number;
  cooldown: number;
}

// --- Network Events ---

export enum ClientEvent {
  PLAYER_JOIN = 'player:join',
  ROOM_CREATE = 'room:create',
  ROOM_JOIN = 'room:join',
  ROOM_LEAVE = 'room:leave',
  PLAYER_INPUT = 'player:input',
  PLAYER_READY = 'player:ready',
  PLAYER_SELECT_CHARACTER = 'player:selectCharacter',
  MATCH_START = 'match:start',
}

export enum ServerEvent {
  ROOM_STATE = 'room:state',
  PLAYER_JOINED = 'player:joined',
  PLAYER_LEFT = 'player:left',
  GAME_START = 'game:start',
  GAME_STATE = 'game:state',
  PLAYER_HIT = 'player:hit',
  PLAYER_ELIMINATED = 'player:eliminated',
  GAME_OVER = 'game:over',
  ERROR = 'error',
  ROOM_CREATED = 'room:created',
  COUNTDOWN_TICK = 'countdown:tick',
}

// --- Hit Effect ---

export interface HitEffect {
  x: number;
  y: number;
  attackerId: string;
  targetId: string;
  damage: number;
  knockbackX: number;
  knockbackY: number;
}

// --- Network Messages ---

export interface JoinPayload {
  nickname: string;
}

export interface CreateRoomPayload {
  nickname: string;
  character: CharacterType;
}

export interface JoinRoomPayload {
  roomCode: string;
  nickname: string;
  character: CharacterType;
}

export interface SelectCharacterPayload {
  character: CharacterType;
}

export interface InputPayload {
  input: PlayerInput;
  timestamp: number;
}
