import { CharacterType, CharacterStats, ArenaConfig, AttackData, AttackType, GameMode, MatchConfig } from './types';
export declare const GAME_MODES: Record<GameMode, MatchConfig>;
export declare const PHYSICS: {
    readonly GRAVITY: 0.6;
    readonly MAX_FALL_SPEED: 15;
    readonly FRICTION_GROUND: 0.8;
    readonly FRICTION_AIR: 0.95;
    readonly PLAYER_WIDTH: 40;
    readonly PLAYER_HEIGHT: 60;
};
export declare const GAME_CONFIG: {
    readonly TICK_RATE: 60;
    readonly NETWORK_SEND_RATE: 20;
    readonly COUNTDOWN_SECONDS: 3;
    readonly MAX_PLAYERS: 4;
    readonly MIN_PLAYERS: 2;
    readonly STOCKS_PER_PLAYER: 3;
    readonly INVINCIBLE_FRAMES: 60;
    readonly HIT_STUN_MULTIPLIER: 0.04;
    readonly RESPAWN_DELAY_FRAMES: 90;
};
export declare const KNOCKBACK_CONFIG: {
    readonly BASE_KNOCKBACK: 3;
    readonly KNOCKBACK_SCALING: 0.12;
    readonly HITSTUN_BASE: 8;
    readonly HITSTUN_SCALING: 0.06;
    readonly DI_INFLUENCE: 0.15;
};
export declare const CHARACTER_STATS: Record<CharacterType, CharacterStats>;
export declare const ATTACK_DEFS: Record<CharacterType, Record<AttackType, AttackData>>;
export declare const ARENA_MVP: ArenaConfig;
export declare const CHARACTER_COLORS: Record<CharacterType, {
    primary: string;
    secondary: string;
    accent: string;
}>;
export declare const CHARACTER_ABILITIES: Record<CharacterType, {
    basic: string;
    ability: string;
    ultimate: string;
}>;
