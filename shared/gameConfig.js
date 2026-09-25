// ============================================================
// Brawl Impact - Shared Game Configuration
// ============================================================
import { CharacterType, AttackType } from './types';
// --- Physics ---
export const PHYSICS = {
    GRAVITY: 0.6,
    MAX_FALL_SPEED: 15,
    FRICTION_GROUND: 0.8,
    FRICTION_AIR: 0.95,
    PLAYER_WIDTH: 40,
    PLAYER_HEIGHT: 60,
};
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
};
// --- Knockback ---
export const KNOCKBACK_CONFIG = {
    BASE_KNOCKBACK: 3,
    KNOCKBACK_SCALING: 0.12,
    HITSTUN_BASE: 8,
    HITSTUN_SCALING: 0.06,
    DI_INFLUENCE: 0.15, // directional influence
};
// --- Characters ---
export const CHARACTER_STATS = {
    [CharacterType.KNIGHT]: {
        maxHp: 0, // percentage system, no max HP
        moveSpeed: 4.5,
        jumpForce: -12,
        attackDamage: 12,
        knockbackPower: 1.2,
        abilityCooldown: 90, // 1.5 sec at 60fps
        ultimateCooldown: 480, // 8 sec
        abilityDamage: 8,
        ultimateDamage: 18,
    },
    [CharacterType.MAGE]: {
        maxHp: 0,
        moveSpeed: 3.8,
        jumpForce: -11,
        attackDamage: 10,
        knockbackPower: 1.0,
        abilityCooldown: 120, // 2 sec
        ultimateCooldown: 600, // 10 sec
        abilityDamage: 15,
        ultimateDamage: 25,
    },
    [CharacterType.ASSASSIN]: {
        maxHp: 0,
        moveSpeed: 6.0,
        jumpForce: -13,
        attackDamage: 8,
        knockbackPower: 0.8,
        abilityCooldown: 60, // 1 sec
        ultimateCooldown: 420, // 7 sec
        abilityDamage: 6,
        ultimateDamage: 20,
    },
    [CharacterType.FIGHTER]: {
        maxHp: 0,
        moveSpeed: 4.0,
        jumpForce: -11.5,
        attackDamage: 14,
        knockbackPower: 1.4,
        abilityCooldown: 75, // 1.25 sec
        ultimateCooldown: 540, // 9 sec
        abilityDamage: 10,
        ultimateDamage: 22,
    },
};
// --- Attack Definitions ---
export const ATTACK_DEFS = {
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
            damage: 6,
            knockbackBase: 2,
            knockbackMultiplier: 0.08,
            knockbackAngle: -Math.PI / 6,
            hitboxWidth: 20,
            hitboxHeight: 20,
            hitboxOffsetX: 80,
            hitboxOffsetY: 0,
            duration: 15,
            startupFrames: 3,
            activeFrames: 5,
            recoveryFrames: 7,
            cooldown: 60,
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
export const ARENA_MVP = {
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
export const CHARACTER_COLORS = {
    [CharacterType.KNIGHT]: { primary: '#4A90D9', secondary: '#2C5F8A', accent: '#7CB8F0' },
    [CharacterType.MAGE]: { primary: '#9B59B6', secondary: '#6C3483', accent: '#C39BD3' },
    [CharacterType.ASSASSIN]: { primary: '#2C3E50', secondary: '#1A252F', accent: '#5D6D7E' },
    [CharacterType.FIGHTER]: { primary: '#E74C3C', secondary: '#A93226', accent: '#F1948A' },
};
// --- Character Ability Names ---
export const CHARACTER_ABILITIES = {
    [CharacterType.KNIGHT]: { basic: 'Sword Slash', ability: 'Shield Charge', ultimate: 'Grand Slash' },
    [CharacterType.MAGE]: { basic: 'Staff Strike', ability: 'Fireball', ultimate: 'Meteor' },
    [CharacterType.ASSASSIN]: { basic: 'Quick Slash', ability: 'Kunai Throw', ultimate: 'Shadow Step' },
    [CharacterType.FIGHTER]: { basic: 'Punch', ability: 'Uppercut', ultimate: 'Ground Slam' },
};
//# sourceMappingURL=gameConfig.js.map