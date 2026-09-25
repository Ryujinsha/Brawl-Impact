// ============================================================
// Brawl Impact - Server Game Engine
// Handles authoritative game simulation
// ============================================================

import {
  PlayerState,
  GameState,
  GamePhase,
  ArenaConfig,
  Platform,
  PlayerInput,
  CharacterType,
  AttackType,
  Direction,
  HitEffect,
  GameResult,
  AttackData,
} from '../../../shared/types.js';
import {
  PHYSICS,
  GAME_CONFIG,
  KNOCKBACK_CONFIG,
  CHARACTER_STATS,
  ATTACK_DEFS,
  ARENA_MVP,
} from '../../../shared/gameConfig.js';

export class ServerGameEngine {
  private players: Map<string, PlayerState> = new Map();
  private arena: ArenaConfig = ARENA_MVP;
  private phase: GamePhase = GamePhase.COUNTDOWN;
  private countdown: number = GAME_CONFIG.COUNTDOWN_SECONDS * GAME_CONFIG.TICK_RATE;
  private tick: number = 0;
  private winnerId: string | null = null;
  private hitEffects: HitEffect[] = [];
  private eliminationOrder: Array<{ playerId: string; eliminatedBy: string | null }> = [];
  private damageDealt: Map<string, number> = new Map();
  private lastAttacker: Map<string, string> = new Map(); // targetId -> attackerId
  private respawnTimers: Map<string, number> = new Map();
  // Track which players have been hit by the current attack instance
  private attackHitTargets: Map<string, Set<string>> = new Map();

  // Callbacks
  public onHit?: (effect: HitEffect) => void;
  public onElimination?: (playerId: string, eliminatedBy: string | null) => void;
  public onGameOver?: (result: GameResult) => void;

  constructor(playerInfos: Array<{ id: string; nickname: string; character: CharacterType }>) {
    playerInfos.forEach((info, index) => {
      const spawn = this.arena.spawnPoints[index % this.arena.spawnPoints.length];
      const stats = CHARACTER_STATS[info.character];
      const player: PlayerState = {
        id: info.id,
        nickname: info.nickname,
        character: info.character,
        x: spawn.x,
        y: spawn.y,
        vx: 0,
        vy: 0,
        direction: index % 2 === 0 ? Direction.RIGHT : Direction.LEFT,
        damagePercent: 0,
        isAlive: true,
        isGrounded: false,
        isAttacking: false,
        attackType: null,
        attackTimer: 0,
        abilityCooldownTimer: 0,
        ultimateCooldownTimer: 0,
        isShielding: false,
        isInvincible: true,
        invincibleTimer: GAME_CONFIG.INVINCIBLE_FRAMES,
        hitStunTimer: 0,
        stocks: GAME_CONFIG.STOCKS_PER_PLAYER,
      };
      this.players.set(info.id, player);
      this.damageDealt.set(info.id, 0);
    });
  }

  public update(inputs: Map<string, PlayerInput>): void {
    this.tick++;
    this.hitEffects = [];

    if (this.phase === GamePhase.COUNTDOWN) {
      this.countdown--;
      if (this.countdown <= 0) {
        this.phase = GamePhase.PLAYING;
      }
      return;
    }

    if (this.phase !== GamePhase.PLAYING) return;

    // Process respawn timers
    for (const [playerId, timer] of this.respawnTimers.entries()) {
      if (timer <= 0) {
        this.respawnPlayer(playerId);
        this.respawnTimers.delete(playerId);
      } else {
        this.respawnTimers.set(playerId, timer - 1);
      }
    }

    // Process each player
    for (const [playerId, player] of this.players.entries()) {
      if (!player.isAlive) continue;

      const input = inputs.get(playerId);

      // Update timers
      this.updateTimers(player);

      // Process input
      if (input && player.hitStunTimer <= 0) {
        this.processInput(player, input);
      }

      // Apply physics
      this.applyPhysics(player);

      // Check platform collisions
      this.checkPlatformCollisions(player);

      // Process attacks
      if (player.isAttacking) {
        this.processAttack(player);
      }

      // Check death bounds
      this.checkDeathBounds(player);
    }

    // Check win condition
    this.checkWinCondition();
  }

  private updateTimers(player: PlayerState): void {
    if (player.invincibleTimer > 0) {
      player.invincibleTimer--;
      if (player.invincibleTimer <= 0) {
        player.isInvincible = false;
      }
    }

    if (player.hitStunTimer > 0) {
      player.hitStunTimer--;
    }

    if (player.abilityCooldownTimer > 0) {
      player.abilityCooldownTimer--;
    }

    if (player.ultimateCooldownTimer > 0) {
      player.ultimateCooldownTimer--;
    }

    if (player.isAttacking) {
      player.attackTimer--;
      if (player.attackTimer <= 0) {
        player.isAttacking = false;
        player.attackType = null;
        // Clear hit targets for this attack
        this.attackHitTargets.delete(player.id);
      }
    }
  }

  private processInput(player: PlayerState, input: PlayerInput): void {
    if (player.isAttacking) return; // Can't move while attacking

    const stats = CHARACTER_STATS[player.character];

    // Movement
    if (input.left) {
      player.vx = -stats.moveSpeed;
      player.direction = Direction.LEFT;
    } else if (input.right) {
      player.vx = stats.moveSpeed;
      player.direction = Direction.RIGHT;
    }

    // Jump
    if (input.jump && player.isGrounded) {
      player.vy = stats.jumpForce;
      player.isGrounded = false;
    }

    // Attacks (Prioritize Ultimate -> Ability -> Basic Attack)
    if (input.ultimate && !player.isAttacking && player.ultimateCooldownTimer <= 0) {
      this.startAttack(player, AttackType.ULTIMATE);
      player.ultimateCooldownTimer = ATTACK_DEFS[player.character][AttackType.ULTIMATE].cooldown;
    } else if (input.ability && !player.isAttacking && player.abilityCooldownTimer <= 0) {
      this.startAttack(player, AttackType.ABILITY);
      player.abilityCooldownTimer = ATTACK_DEFS[player.character][AttackType.ABILITY].cooldown;
    } else if (input.attack && !player.isAttacking) {
      this.startAttack(player, AttackType.BASIC);
    }
  }

  private startAttack(player: PlayerState, type: AttackType): void {
    const attackData = ATTACK_DEFS[player.character][type];
    player.isAttacking = true;
    player.attackType = type;
    player.attackTimer = attackData.duration;
    // Initialize hit targets tracking for this attack
    this.attackHitTargets.set(player.id, new Set());
  }

  private processAttack(attacker: PlayerState): void {
    if (!attacker.attackType) return;
    const attackData = ATTACK_DEFS[attacker.character][attacker.attackType];
    const elapsed = attackData.duration - attacker.attackTimer;

    // Only process hits during active frames
    if (elapsed < attackData.startupFrames || elapsed >= attackData.startupFrames + attackData.activeFrames) {
      return;
    }

    // Calculate hitbox position
    const dirMult = attacker.direction === Direction.RIGHT ? 1 : -1;
    const hitboxX = attacker.x + (attacker.direction === Direction.RIGHT ? attackData.hitboxOffsetX : -attackData.hitboxOffsetX - attackData.hitboxWidth);
    const hitboxY = attacker.y + attackData.hitboxOffsetY;

    // Get the set of already-hit targets for this attack instance
    const hitTargets = this.attackHitTargets.get(attacker.id) || new Set();

    // Check collision with other players
    for (const [targetId, target] of this.players.entries()) {
      if (targetId === attacker.id || !target.isAlive || target.isInvincible) continue;
      // Skip if this target was already hit by this attack instance
      if (hitTargets.has(targetId)) continue;

      // AABB collision
      if (
        hitboxX < target.x + PHYSICS.PLAYER_WIDTH / 2 &&
        hitboxX + attackData.hitboxWidth > target.x - PHYSICS.PLAYER_WIDTH / 2 &&
        hitboxY < target.y + PHYSICS.PLAYER_HEIGHT / 2 &&
        hitboxY + attackData.hitboxHeight > target.y - PHYSICS.PLAYER_HEIGHT / 2
      ) {
        // Hit!
        this.applyHit(attacker, target, attackData, dirMult);
        // Mark target as hit by this attack
        hitTargets.add(targetId);
      }
    }
  }

  private applyHit(attacker: PlayerState, target: PlayerState, attackData: AttackData, dirMult: number): void {
    // Apply damage
    target.damagePercent += attackData.damage;

    // Track damage dealt
    const currentDamage = this.damageDealt.get(attacker.id) || 0;
    this.damageDealt.set(attacker.id, currentDamage + attackData.damage);

    // Track last attacker
    this.lastAttacker.set(target.id, attacker.id);

    // Calculate knockback
    const knockbackMagnitude = KNOCKBACK_CONFIG.BASE_KNOCKBACK + attackData.knockbackBase +
      (target.damagePercent * KNOCKBACK_CONFIG.KNOCKBACK_SCALING * attackData.knockbackMultiplier * 10);

    const kbAngle = attackData.knockbackAngle;
    const knockbackX = Math.cos(kbAngle) * knockbackMagnitude * dirMult * CHARACTER_STATS[attacker.character].knockbackPower;
    const knockbackY = Math.sin(kbAngle) * knockbackMagnitude * CHARACTER_STATS[attacker.character].knockbackPower;

    target.vx = knockbackX;
    target.vy = knockbackY;

    // Apply hit stun
    target.hitStunTimer = Math.floor(
      KNOCKBACK_CONFIG.HITSTUN_BASE + target.damagePercent * KNOCKBACK_CONFIG.HITSTUN_SCALING
    );

    // Create hit effect
    const effect: HitEffect = {
      x: (attacker.x + target.x) / 2,
      y: (attacker.y + target.y) / 2,
      attackerId: attacker.id,
      targetId: target.id,
      damage: attackData.damage,
      knockbackX,
      knockbackY,
    };
    this.hitEffects.push(effect);

    if (this.onHit) {
      this.onHit(effect);
    }
  }

  private applyPhysics(player: PlayerState): void {
    // Gravity
    if (!player.isGrounded) {
      player.vy += PHYSICS.GRAVITY;
      if (player.vy > PHYSICS.MAX_FALL_SPEED) {
        player.vy = PHYSICS.MAX_FALL_SPEED;
      }
    }

    // Friction
    if (player.hitStunTimer <= 0 && !player.isAttacking) {
      if (player.isGrounded) {
        player.vx *= PHYSICS.FRICTION_GROUND;
      } else {
        player.vx *= PHYSICS.FRICTION_AIR;
      }
    }

    // Apply velocity
    player.x += player.vx;
    player.y += player.vy;

    // Reset grounded state (will be set by collision check)
    player.isGrounded = false;
  }

  private checkPlatformCollisions(player: PlayerState): void {
    const halfW = PHYSICS.PLAYER_WIDTH / 2;
    const halfH = PHYSICS.PLAYER_HEIGHT / 2;

    for (const platform of this.arena.platforms) {
      const playerBottom = player.y + halfH;
      const playerTop = player.y - halfH;
      const playerLeft = player.x - halfW;
      const playerRight = player.x + halfW;

      const platTop = platform.y;
      const platBottom = platform.y + platform.height;
      const platLeft = platform.x;
      const platRight = platform.x + platform.width;

      if (platform.isPassthrough) {
        // Only collide from above, and only when falling
        if (
          player.vy >= 0 &&
          playerBottom >= platTop &&
          playerBottom <= platTop + player.vy + 10 &&
          playerRight > platLeft &&
          playerLeft < platRight &&
          playerTop < platTop // Player was above platform
        ) {
          player.y = platTop - halfH;
          player.vy = 0;
          player.isGrounded = true;
        }
      } else {
        // Solid platform - check all sides
        if (
          playerRight > platLeft &&
          playerLeft < platRight &&
          playerBottom > platTop &&
          playerTop < platBottom
        ) {
          // Determine overlap on each side
          const overlapLeft = playerRight - platLeft;
          const overlapRight = platRight - playerLeft;
          const overlapTop = playerBottom - platTop;
          const overlapBottom = platBottom - playerTop;

          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

          if (minOverlap === overlapTop && player.vy >= 0) {
            // Landing on top
            player.y = platTop - halfH;
            player.vy = 0;
            player.isGrounded = true;
          } else if (minOverlap === overlapBottom && player.vy < 0) {
            // Hitting bottom
            player.y = platBottom + halfH;
            player.vy = 0;
          } else if (minOverlap === overlapLeft) {
            // Hitting right side of player against left side of platform
            player.x = platLeft - halfW;
            player.vx = 0;
          } else if (minOverlap === overlapRight) {
            // Hitting left side of player against right side of platform
            player.x = platRight + halfW;
            player.vx = 0;
          }
        }
      }
    }
  }

  private checkDeathBounds(player: PlayerState): void {
    const bounds = this.arena.deathBounds;
    if (
      player.x < bounds.left ||
      player.x > bounds.right ||
      player.y < bounds.top ||
      player.y > bounds.bottom
    ) {
      this.eliminateStock(player);
    }
  }

  private eliminateStock(player: PlayerState): void {
    player.stocks--;

    if (player.stocks <= 0) {
      // Player eliminated
      player.isAlive = false;
      const eliminatedBy = this.lastAttacker.get(player.id) || null;
      this.eliminationOrder.push({ playerId: player.id, eliminatedBy });

      if (this.onElimination) {
        this.onElimination(player.id, eliminatedBy);
      }
    } else {
      // Respawn
      player.isAlive = false;
      this.respawnTimers.set(player.id, GAME_CONFIG.RESPAWN_DELAY_FRAMES);
    }
  }

  private respawnPlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    const spawnIndex = Math.floor(Math.random() * this.arena.spawnPoints.length);
    const spawn = this.arena.spawnPoints[spawnIndex];

    player.x = spawn.x;
    player.y = spawn.y;
    player.vx = 0;
    player.vy = 0;
    player.damagePercent = 0;
    player.isAlive = true;
    player.isAttacking = false;
    player.attackType = null;
    player.attackTimer = 0;
    player.hitStunTimer = 0;
    player.isInvincible = true;
    player.invincibleTimer = GAME_CONFIG.INVINCIBLE_FRAMES;
  }

  private checkWinCondition(): void {
    const alivePlayers = Array.from(this.players.values()).filter(
      (p) => p.isAlive || (p.stocks > 0)
    );

    if (alivePlayers.length <= 1 && this.players.size > 1) {
      const winner = alivePlayers[0];
      this.winnerId = winner ? winner.id : null;
      this.phase = GamePhase.GAME_OVER;

      if (this.onGameOver) {
        this.onGameOver(this.getGameResult());
      }
    }
  }

  public getGameResult(): GameResult {
    const allPlayers = Array.from(this.players.values());
    const rankings = allPlayers
      .map((p, _i) => {
        const elimInfo = this.eliminationOrder.find((e) => e.playerId === p.id);
        return {
          playerId: p.id,
          nickname: p.nickname,
          character: p.character,
          placement: 0,
          damageDealt: this.damageDealt.get(p.id) || 0,
          eliminatedBy: elimInfo?.eliminatedBy || null,
        };
      })
      .sort((a, b) => {
        // Winner first, then reverse elimination order
        if (a.playerId === this.winnerId) return -1;
        if (b.playerId === this.winnerId) return 1;
        const aElimIndex = this.eliminationOrder.findIndex((e) => e.playerId === a.playerId);
        const bElimIndex = this.eliminationOrder.findIndex((e) => e.playerId === b.playerId);
        return bElimIndex - aElimIndex; // Later elimination = higher placement
      });

    rankings.forEach((r, i) => {
      r.placement = i + 1;
    });

    return {
      winnerId: this.winnerId || '',
      winnerNickname: this.players.get(this.winnerId || '')?.nickname || '',
      rankings,
    };
  }

  public getState(): GameState {
    return {
      phase: this.phase,
      players: Array.from(this.players.values()),
      countdown: Math.ceil(this.countdown / GAME_CONFIG.TICK_RATE),
      winnerId: this.winnerId,
      arenaId: this.arena.id,
      tick: this.tick,
    };
  }

  public getHitEffects(): HitEffect[] {
    return this.hitEffects;
  }

  public getPhase(): GamePhase {
    return this.phase;
  }
}
