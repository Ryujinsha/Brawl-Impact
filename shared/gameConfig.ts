// ============================================================
// Brawl Impact - Shared Game Configuration
// ============================================================

import { CharacterType, CharacterStats, ArenaConfig, AttackData, AttackType, GameMode, MatchConfig } from './types';

// --- Game Modes ---
export const GAME_MODES: Record<GameMode, MatchConfig> = {
  training: {
    mode: 'training',
    name: 'Training Grounds',
    maxPlayers: 1,
    minPlayers: 1,
    stocks: 99,
    allowRespawn: true,
    damageResetOnRespawn: true,
  },
  '1v1': {
    mode: '1v1',
    name: '1v1 Duel',
    maxPlayers: 2,
    minPlayers: 2,
    stocks: 3,
    allowRespawn: true,
    damageResetOnRespawn: true,
  },
  ffa: {
    mode: 'ffa',
    name: 'Free For All',
    maxPlayers: 4,
    minPlayers: 2,
    stocks: 3,
    allowRespawn: true,
    damageResetOnRespawn: true,
  },
};

// --- Physics ---
export const PHYSICS = {
  GRAVITY: 0.6,
  MAX_FALL_SPEED: 15,
  FRICTION_GROUND: 0.8,
  FRICTION_AIR: 0.95,
  PLAYER_WIDTH: 40,
  PLAYER_HEIGHT: 60,
} as const;

// --- Game ---
export const GAME_CONFIG = {
  TICK_RATE: 60,
  NETWORK_SEND_RATE: 20, // server sends state 20 times/sec
  COUNTDOWN_SECONDS: 3,
  MAX_PLAYERS: 4,
  MIN_PLAYERS: 2,
  STOCKS_PER_PLAYER: 3,
  INVINCIBLE_FRAMES: 60, // 1 second of invincibility after respawn
  HIT_STUN_MULTIPLIER: 0.04, // hit stun based on damage percent
  RESPAWN_DELAY_FRAMES: 90, // 1.5 seconds
} as const;

// --- Knockback ---
export const KNOCKBACK_CONFIG = {
  BASE_KNOCKBACK: 3,
  KNOCKBACK_SCALING: 0.12,
  HITSTUN_BASE: 8,
  HITSTUN_SCALING: 0.06,
  DI_INFLUENCE: 0.15, // directional influence
} as const;

// --- Characters ---
export const CHARACTER_STATS: Record<CharacterType, CharacterStats> = {
  [CharacterType.KNIGHT]: {
    maxHp: 200,
    moveSpeed: 3.5,
    jumpForce: -15.2,
    attackDamage: 12,
    knockbackPower: 1.2,
    abilityCooldown: 90, // 1.5 sec at 60fps
    ultimateCooldown: 480, // 8 sec
    abilityDamage: 8,
    ultimateDamage: 18,
  },
  [CharacterType.MAGE]: {
    maxHp: 200,
    moveSpeed: 3.0,
    jumpForce: -14.8,
    attackDamage: 10,
    knockbackPower: 1.0,
    abilityCooldown: 120, // 2 sec
    ultimateCooldown: 600, // 10 sec
    abilityDamage: 15,
    ultimateDamage: 25,
  },
  [CharacterType.ASSASSIN]: {
    maxHp: 200,
    moveSpeed: 4.6,
    jumpForce: -16.5,
    attackDamage: 8,
    knockbackPower: 0.8,
    abilityCooldown: 75, // 1.25 sec
    ultimateCooldown: 420, // 7 sec
    abilityDamage: 8,
    ultimateDamage: 20,
  },
  [CharacterType.FIGHTER]: {
    maxHp: 200,
    moveSpeed: 3.2,
    jumpForce: -15.0,
    attackDamage: 14,
    knockbackPower: 1.4,
    abilityCooldown: 75, // 1.25 sec
    ultimateCooldown: 540, // 9 sec
    abilityDamage: 10,
    ultimateDamage: 22,
  },
};

// --- Attack Definitions ---

export const ATTACK_DEFS: Record<CharacterType, Record<AttackType, AttackData>> = {
  [CharacterType.KNIGHT]: {
    [AttackType.BASIC]: {
      type: AttackType.BASIC,
      damage: 12,
      knockbackBase: 3,
      knockbackMultiplier: 0.12,
      knockbackAngle: -Math.PI / 4, // 45 degrees up
      hitboxWidth: 60,
      hitboxHeight: 40,
      hitboxOffsetX: 30,
      hitboxOffsetY: -10,
      duration: 20,
      startupFrames: 4,
      activeFrames: 6,
      recoveryFrames: 10,
      cooldown: 25,
    },
    [AttackType.ABILITY]: {
      type: AttackType.ABILITY,
      damage: 8,
      knockbackBase: 5,
      knockbackMultiplier: 0.1,
      knockbackAngle: 0, // horizontal
      hitboxWidth: 50,
      hitboxHeight: 50,
      hitboxOffsetX: 20,
      hitboxOffsetY: -5,
      duration: 30,
      startupFrames: 8,
      activeFrames: 10,
      recoveryFrames: 12,
      cooldown: 90,
    },
    [AttackType.ULTIMATE]: {
      type: AttackType.ULTIMATE,
      damage: 18,
      knockbackBase: 8,
      knockbackMultiplier: 0.15,
      knockbackAngle: -Math.PI / 3,
      hitboxWidth: 80,
      hitboxHeight: 60,
      hitboxOffsetX: 25,
      hitboxOffsetY: -20,
      duration: 40,
      startupFrames: 12,
      activeFrames: 10,
      recoveryFrames: 18,
      cooldown: 480,
    },
  },
  [CharacterType.MAGE]: {
    [AttackType.BASIC]: {
      type: AttackType.BASIC,
      damage: 10,
      knockbackBase: 2.5,
      knockbackMultiplier: 0.1,
      knockbackAngle: -Math.PI / 6,
      hitboxWidth: 40,
      hitboxHeight: 30,
      hitboxOffsetX: 35,
      hitboxOffsetY: -5,
      duration: 18,
      startupFrames: 5,
      activeFrames: 5,
      recoveryFrames: 8,
      cooldown: 20,
    },
    [AttackType.ABILITY]: {
      type: AttackType.ABILITY,
      damage: 15,
      knockbackBase: 4,
      knockbackMultiplier: 0.13,
      knockbackAngle: -Math.PI / 4,
      hitboxWidth: 30,
      hitboxHeight: 30,
      hitboxOffsetX: 60,
      hitboxOffsetY: -10,
      duration: 25,
      startupFrames: 8,
      activeFrames: 8,
      recoveryFrames: 9,
      cooldown: 120,
    },
    [AttackType.ULTIMATE]: {
      type: AttackType.ULTIMATE,
      damage: 25,
      knockbackBase: 10,
      knockbackMultiplier: 0.18,
      knockbackAngle: -Math.PI / 2,
      hitboxWidth: 120,
      hitboxHeight: 100,
      hitboxOffsetX: 0,
      hitboxOffsetY: -80,
      duration: 60,
      startupFrames: 20,
      activeFrames: 15,
      recoveryFrames: 25,
      cooldown: 600,
    },
  },
  [CharacterType.ASSASSIN]: {
    [AttackType.BASIC]: {
      type: AttackType.BASIC,
      damage: 8,
      knockbackBase: 2,
      knockbackMultiplier: 0.08,
      knockbackAngle: -Math.PI / 5,
      hitboxWidth: 45,
      hitboxHeight: 35,
      hitboxOffsetX: 25,
      hitboxOffsetY: -5,
      duration: 12,
      startupFrames: 2,
      activeFrames: 4,
      recoveryFrames: 6,
      cooldown: 15,
    },
    [AttackType.ABILITY]: {
      type: AttackType.ABILITY,
      damage: 8,
      knockbackBase: 3,
      knockbackMultiplier: 0.08,
      knockbackAngle: -Math.PI / 8,
      hitboxWidth: 24,
      hitboxHeight: 24,
      hitboxOffsetX: 35,
      hitboxOffsetY: -8,
      duration: 27,
      startupFrames: 15,
      activeFrames: 6,
      recoveryFrames: 6,
      cooldown: 75,
    },
    [AttackType.ULTIMATE]: {
      type: AttackType.ULTIMATE,
      damage: 20,
      knockbackBase: 7,
      knockbackMultiplier: 0.14,
      knockbackAngle: -Math.PI / 4,
      hitboxWidth: 60,
      hitboxHeight: 50,
      hitboxOffsetX: 30,
      hitboxOffsetY: -10,
      duration: 25,
      startupFrames: 5,
      activeFrames: 8,
      recoveryFrames: 12,
      cooldown: 420,
    },
  },
  [CharacterType.FIGHTER]: {
    [AttackType.BASIC]: {
      type: AttackType.BASIC,
      damage: 14,
      knockbackBase: 3.5,
      knockbackMultiplier: 0.13,
      knockbackAngle: -Math.PI / 4,
      hitboxWidth: 50,
      hitboxHeight: 45,
      hitboxOffsetX: 25,
      hitboxOffsetY: -10,
      duration: 22,
      startupFrames: 5,
      activeFrames: 7,
      recoveryFrames: 10,
      cooldown: 28,
    },
    [AttackType.ABILITY]: {
      type: AttackType.ABILITY,
      damage: 10,
      knockbackBase: 6,
      knockbackMultiplier: 0.12,
      knockbackAngle: -Math.PI / 2, // straight up
      hitboxWidth: 45,
      hitboxHeight: 60,
      hitboxOffsetX: 15,
      hitboxOffsetY: -40,
      duration: 28,
      startupFrames: 6,
      activeFrames: 8,
      recoveryFrames: 14,
      cooldown: 75,
    },
    [AttackType.ULTIMATE]: {
      type: AttackType.ULTIMATE,
      damage: 22,
      knockbackBase: 9,
      knockbackMultiplier: 0.16,
      knockbackAngle: -Math.PI / 6,
      hitboxWidth: 100,
      hitboxHeight: 40,
      hitboxOffsetX: 0,
      hitboxOffsetY: 10,
      duration: 45,
      startupFrames: 15,
      activeFrames: 12,
      recoveryFrames: 18,
      cooldown: 540,
    },
  },
};

// --- Arena ---
export const ARENA_MVP: ArenaConfig = {
  id: 'arena_01',
  name: 'Brawl Arena',
  width: 1200,
  height: 800,
  platforms: [
    // Main platform
    {
      x: 150,
      y: 550,
      width: 900,
      height: 30,
      isPassthrough: false,
    },
    // Left floating platform
    {
      x: 220,
      y: 400,
      width: 200,
      height: 15,
      isPassthrough: true,
    },
    // Right floating platform
    {
      x: 780,
      y: 400,
      width: 200,
      height: 15,
      isPassthrough: true,
    },
    // Center top platform
    {
      x: 475,
      y: 280,
      width: 250,
      height: 15,
      isPassthrough: true,
    },
    // Upper-left high platform
    {
      x: 180,
      y: 240,
      width: 180,
      height: 15,
      isPassthrough: true,
    },
    // Upper-right high platform
    {
      x: 840,
      y: 240,
      width: 180,
      height: 15,
      isPassthrough: true,
    },
    // Outer-left wing platform
    {
      x: 70,
      y: 460,
      width: 130,
      height: 15,
      isPassthrough: true,
    },
    // Outer-right wing platform
    {
      x: 1000,
      y: 460,
      width: 130,
      height: 15,
      isPassthrough: true,
    },
  ],
  deathBounds: {
    left: -200,
    right: 1400,
    top: -400,
    bottom: 900,
  },
  spawnPoints: [
    { x: 350, y: 480 },
    { x: 850, y: 480 },
    { x: 500, y: 210 },
    { x: 700, y: 210 },
  ],
};

// --- Character Colors (for rendering) ---
export const CHARACTER_COLORS: Record<CharacterType, { primary: string; secondary: string; accent: string }> = {
  [CharacterType.KNIGHT]: { primary: '#4A90D9', secondary: '#2C5F8A', accent: '#7CB8F0' },
  [CharacterType.MAGE]: { primary: '#9B59B6', secondary: '#6C3483', accent: '#C39BD3' },
  [CharacterType.ASSASSIN]: { primary: '#2C3E50', secondary: '#1A252F', accent: '#5D6D7E' },
  [CharacterType.FIGHTER]: { primary: '#E74C3C', secondary: '#A93226', accent: '#F1948A' },
};

// --- Character Ability Names ---
export const CHARACTER_ABILITIES: Record<CharacterType, { basic: string; ability: string; ultimate: string }> = {
  [CharacterType.KNIGHT]: { basic: 'Sword Slash', ability: 'Shield Charge', ultimate: 'Grand Slash' },
  [CharacterType.MAGE]: { basic: 'Staff Strike', ability: 'Fireball', ultimate: 'Meteor' },
  [CharacterType.ASSASSIN]: { basic: 'Quick Slash', ability: 'Shuriken Throw', ultimate: 'Shadow Step' },
  [CharacterType.FIGHTER]: { basic: 'Punch', ability: 'Uppercut', ultimate: 'Ground Slam' },
};
