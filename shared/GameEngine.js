// ============================================================
// Brawl Impact - Core Game Simulation Engine
// Authoritative simulation for Physics, Combat, Collision & Modes
// Used by both game-server (1v1, FFA) and frontend (Training)
// ============================================================
import { GamePhase, CharacterType, AttackType, Direction, } from './types';
import { PHYSICS, GAME_CONFIG, KNOCKBACK_CONFIG, CHARACTER_STATS, ATTACK_DEFS, ARENA_MVP, GAME_MODES, } from './gameConfig';
export class GameEngine {
    players = new Map();
    arena = ARENA_MVP;
    mode = 'ffa';
    phase = GamePhase.COUNTDOWN;
    countdown = GAME_CONFIG.COUNTDOWN_SECONDS * GAME_CONFIG.TICK_RATE;
    tick = 0;
    winnerId = null;
    hitEffects = [];
    eliminationOrder = [];
    damageDealt = new Map();
    lastAttacker = new Map(); // targetId -> attackerId
    respawnTimers = new Map();
    // Track which players have been hit by the current attack instance
    attackHitTargets = new Map();
    projectiles = [];
    shurikensSpawned = new Map();
    // Callbacks
    onHit;
    onElimination;
    onGameOver;
    constructor(playerInfos, mode = 'ffa') {
        this.mode = mode;
        const modeConfig = GAME_MODES[mode] || GAME_MODES.ffa;
        // Training mode starts playing immediately without 3s countdown
        if (mode === 'training') {
            this.phase = GamePhase.PLAYING;
            this.countdown = 0;
        }
        else {
            this.phase = GamePhase.COUNTDOWN;
            this.countdown = GAME_CONFIG.COUNTDOWN_SECONDS * GAME_CONFIG.TICK_RATE;
        }
        playerInfos.forEach((info, index) => {
            const spawn = this.arena.spawnPoints[index % this.arena.spawnPoints.length];
            const stats = CHARACTER_STATS[info.character];
            const player = {
                id: info.id,
                nickname: info.nickname,
                character: info.character,
                x: spawn.x,
                y: spawn.y,
                vx: 0,
                vy: 0,
                direction: index % 2 === 0 ? Direction.RIGHT : Direction.LEFT,
                damagePercent: 0,
                hp: stats.maxHp || 200,
                maxHp: stats.maxHp || 200,
                isAlive: true,
                isGrounded: false,
                isAttacking: false,
                attackType: null,
                attackTimer: 0,
                abilityCooldownTimer: 0,
                ultimateCooldownTimer: 0,
                isShielding: false,
                isInvincible: mode !== 'training',
                invincibleTimer: mode !== 'training' ? GAME_CONFIG.INVINCIBLE_FRAMES : 0,
                hitStunTimer: 0,
                stocks: modeConfig.stocks,
            };
            this.players.set(info.id, player);
            this.damageDealt.set(info.id, 0);
        });
    }
    reset(customSpawns) {
        let index = 0;
        for (const [id, player] of this.players.entries()) {
            const stats = CHARACTER_STATS[player.character];
            const spawn = customSpawns?.get(id) || this.arena.spawnPoints[index % this.arena.spawnPoints.length];
            player.x = spawn.x;
            player.y = spawn.y;
            player.vx = 0;
            player.vy = 0;
            player.direction = index % 2 === 0 ? Direction.RIGHT : Direction.LEFT;
            player.damagePercent = 0;
            player.hp = stats.maxHp || 200;
            player.isAlive = true;
            player.isGrounded = false;
            player.isAttacking = false;
            player.attackType = null;
            player.attackTimer = 0;
            player.abilityCooldownTimer = 0;
            player.ultimateCooldownTimer = 0;
            player.isShielding = false;
            player.isInvincible = false;
            player.invincibleTimer = 0;
            player.hitStunTimer = 0;
            player.stocks = GAME_MODES[this.mode]?.stocks || 3;
            index++;
        }
        this.projectiles = [];
        this.hitEffects = [];
        this.respawnTimers.clear();
        this.attackHitTargets.clear();
        this.shurikensSpawned.clear();
    }
    update(inputs) {
        this.tick++;
        this.hitEffects = [];
        if (this.phase === GamePhase.COUNTDOWN) {
            this.countdown--;
            if (this.countdown <= 0) {
                this.phase = GamePhase.PLAYING;
            }
            return;
        }
        if (this.phase !== GamePhase.PLAYING)
            return;
        // Process respawn timers
        for (const [playerId, timer] of this.respawnTimers.entries()) {
            if (timer <= 0) {
                this.respawnPlayer(playerId);
                this.respawnTimers.delete(playerId);
            }
            else {
                this.respawnTimers.set(playerId, timer - 1);
            }
        }
        // Process each player
        for (const [playerId, player] of this.players.entries()) {
            if (!player.isAlive)
                continue;
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
        // Process projectiles
        this.updateProjectiles();
        // Check win condition (not applicable in training mode)
        if (this.mode !== 'training') {
            this.checkWinCondition();
        }
    }
    updateTimers(player) {
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
                this.attackHitTargets.delete(player.id);
                this.shurikensSpawned.delete(player.id);
            }
        }
    }
    processInput(player, input) {
        if (player.isAttacking)
            return; // Can't move while attacking
        const stats = CHARACTER_STATS[player.character];
        // Movement
        if (input.left) {
            player.vx = -stats.moveSpeed;
            player.direction = Direction.LEFT;
        }
        else if (input.right) {
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
        }
        else if (input.ability && !player.isAttacking && player.abilityCooldownTimer <= 0) {
            this.startAttack(player, AttackType.ABILITY);
            player.abilityCooldownTimer = ATTACK_DEFS[player.character][AttackType.ABILITY].cooldown;
        }
        else if (input.attack && !player.isAttacking) {
            this.startAttack(player, AttackType.BASIC);
        }
    }
    startAttack(player, type) {
        const attackData = ATTACK_DEFS[player.character][type];
        player.isAttacking = true;
        player.attackType = type;
        player.attackTimer = attackData.duration;
        this.attackHitTargets.set(player.id, new Set());
        this.shurikensSpawned.delete(player.id);
    }
    processAttack(attacker) {
        if (!attacker.attackType)
            return;
        const attackData = ATTACK_DEFS[attacker.character][attacker.attackType];
        const elapsed = attackData.duration - attacker.attackTimer;
        // Special handling for Assassin Ability: Shuriken Throw
        if (attacker.character === CharacterType.ASSASSIN && attacker.attackType === AttackType.ABILITY) {
            const spawnedSet = this.shurikensSpawned.get(attacker.id) || new Set();
            if (elapsed >= 15 && !spawnedSet.has(1)) {
                spawnedSet.add(1);
                this.shurikensSpawned.set(attacker.id, spawnedSet);
                this.spawnShuriken(attacker, 0);
            }
            if (elapsed >= 18 && !spawnedSet.has(2)) {
                spawnedSet.add(2);
                this.shurikensSpawned.set(attacker.id, spawnedSet);
                this.spawnShuriken(attacker, -0.4);
            }
            return;
        }
        // Only process hits during active frames
        if (elapsed < attackData.startupFrames || elapsed >= attackData.startupFrames + attackData.activeFrames) {
            return;
        }
        // Calculate hitbox position
        const dirMult = attacker.direction === Direction.RIGHT ? 1 : -1;
        const hitboxX = attacker.x + (attacker.direction === Direction.RIGHT ? attackData.hitboxOffsetX : -attackData.hitboxOffsetX - attackData.hitboxWidth);
        const hitboxY = attacker.y + attackData.hitboxOffsetY;
        const hitTargets = this.attackHitTargets.get(attacker.id) || new Set();
        // Check collision with other players
        for (const [targetId, target] of this.players.entries()) {
            if (targetId === attacker.id || !target.isAlive || target.isInvincible)
                continue;
            if (hitTargets.has(targetId))
                continue;
            // AABB collision
            if (hitboxX < target.x + PHYSICS.PLAYER_WIDTH / 2 &&
                hitboxX + attackData.hitboxWidth > target.x - PHYSICS.PLAYER_WIDTH / 2 &&
                hitboxY < target.y + PHYSICS.PLAYER_HEIGHT / 2 &&
                hitboxY + attackData.hitboxHeight > target.y - PHYSICS.PLAYER_HEIGHT / 2) {
                this.applyHit(attacker, target, attackData, dirMult);
                hitTargets.add(targetId);
            }
        }
    }
    spawnShuriken(attacker, vy) {
        const dirMult = attacker.direction === Direction.RIGHT ? 1 : -1;
        const speed = 15;
        const proj = {
            id: `${attacker.id}_shuriken_${this.tick}_${Math.random().toString(36).substring(2, 6)}`,
            ownerId: attacker.id,
            character: attacker.character,
            type: 'SHURIKEN',
            x: attacker.x + (attacker.direction === Direction.RIGHT ? 35 : -35),
            y: attacker.y - 8,
            vx: dirMult * speed,
            vy,
            width: 24,
            height: 24,
            damage: 8,
            knockbackBase: 3,
            knockbackMultiplier: 0.08,
            knockbackAngle: -Math.PI / 8,
            distanceTraveled: 0,
            maxDistance: 650,
            rotation: 0,
            rotationSpeed: dirMult * 0.35,
        };
        this.projectiles.push(proj);
    }
    updateProjectiles() {
        const nextProjectiles = [];
        for (const proj of this.projectiles) {
            proj.x += proj.vx;
            proj.y += proj.vy;
            proj.distanceTraveled += Math.abs(proj.vx);
            proj.rotation += proj.rotationSpeed;
            if (proj.distanceTraveled >= proj.maxDistance ||
                proj.x < this.arena.deathBounds.left ||
                proj.x > this.arena.deathBounds.right ||
                proj.y < this.arena.deathBounds.top ||
                proj.y > this.arena.deathBounds.bottom) {
                continue;
            }
            let hasHit = false;
            const projHalfW = proj.width / 2;
            const projHalfH = proj.height / 2;
            for (const [targetId, target] of this.players.entries()) {
                if (targetId === proj.ownerId || !target.isAlive || target.isInvincible)
                    continue;
                const targetHalfW = PHYSICS.PLAYER_WIDTH / 2;
                const targetHalfH = PHYSICS.PLAYER_HEIGHT / 2;
                if (proj.x - projHalfW < target.x + targetHalfW &&
                    proj.x + projHalfW > target.x - targetHalfW &&
                    proj.y - projHalfH < target.y + targetHalfH &&
                    proj.y + projHalfH > target.y - targetHalfH) {
                    this.applyProjectileHit(proj, target);
                    hasHit = true;
                    break;
                }
            }
            if (!hasHit) {
                nextProjectiles.push(proj);
            }
        }
        this.projectiles = nextProjectiles;
    }
    applyProjectileHit(proj, target) {
        target.hp = Math.max(0, target.hp - proj.damage);
        target.damagePercent = Math.min(100, Math.floor(((target.maxHp - target.hp) / target.maxHp) * 100));
        const currentDamage = this.damageDealt.get(proj.ownerId) || 0;
        this.damageDealt.set(proj.ownerId, currentDamage + proj.damage);
        this.lastAttacker.set(target.id, proj.ownerId);
        const dirMult = proj.vx >= 0 ? 1 : -1;
        const knockbackMag = KNOCKBACK_CONFIG.BASE_KNOCKBACK + proj.knockbackBase +
            (target.damagePercent * KNOCKBACK_CONFIG.KNOCKBACK_SCALING * proj.knockbackMultiplier * 10);
        const knockbackX = Math.cos(proj.knockbackAngle) * knockbackMag * dirMult;
        const knockbackY = Math.sin(proj.knockbackAngle) * knockbackMag;
        target.vx = knockbackX;
        target.vy = knockbackY;
        target.hitStunTimer = Math.floor(KNOCKBACK_CONFIG.HITSTUN_BASE + target.damagePercent * KNOCKBACK_CONFIG.HITSTUN_SCALING);
        const effect = {
            x: proj.x,
            y: proj.y,
            attackerId: proj.ownerId,
            targetId: target.id,
            damage: proj.damage,
            knockbackX,
            knockbackY,
        };
        this.hitEffects.push(effect);
        if (this.onHit) {
            this.onHit(effect);
        }
        if (target.hp <= 0) {
            this.eliminateStock(target);
        }
    }
    applyHit(attacker, target, attackData, dirMult) {
        target.hp = Math.max(0, target.hp - attackData.damage);
        target.damagePercent = Math.min(100, Math.floor(((target.maxHp - target.hp) / target.maxHp) * 100));
        const currentDamage = this.damageDealt.get(attacker.id) || 0;
        this.damageDealt.set(attacker.id, currentDamage + attackData.damage);
        this.lastAttacker.set(target.id, attacker.id);
        const knockbackMagnitude = KNOCKBACK_CONFIG.BASE_KNOCKBACK + attackData.knockbackBase +
            (target.damagePercent * KNOCKBACK_CONFIG.KNOCKBACK_SCALING * attackData.knockbackMultiplier * 10);
        const kbAngle = attackData.knockbackAngle;
        const knockbackX = Math.cos(kbAngle) * knockbackMagnitude * dirMult * CHARACTER_STATS[attacker.character].knockbackPower;
        const knockbackY = Math.sin(kbAngle) * knockbackMagnitude * CHARACTER_STATS[attacker.character].knockbackPower;
        target.vx = knockbackX;
        target.vy = knockbackY;
        target.hitStunTimer = Math.floor(KNOCKBACK_CONFIG.HITSTUN_BASE + target.damagePercent * KNOCKBACK_CONFIG.HITSTUN_SCALING);
        const effect = {
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
        if (target.hp <= 0) {
            this.eliminateStock(target);
        }
    }
    applyPhysics(player) {
        if (!player.isGrounded) {
            player.vy += PHYSICS.GRAVITY;
            if (player.vy > PHYSICS.MAX_FALL_SPEED) {
                player.vy = PHYSICS.MAX_FALL_SPEED;
            }
        }
        if (player.hitStunTimer <= 0 && !player.isAttacking) {
            if (player.isGrounded) {
                player.vx *= PHYSICS.FRICTION_GROUND;
            }
            else {
                player.vx *= PHYSICS.FRICTION_AIR;
            }
        }
        player.x += player.vx;
        player.y += player.vy;
        player.isGrounded = false;
    }
    checkPlatformCollisions(player) {
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
                if (player.vy >= 0 &&
                    playerBottom >= platTop &&
                    playerBottom <= platTop + player.vy + 10 &&
                    playerRight > platLeft &&
                    playerLeft < platRight &&
                    playerTop < platTop) {
                    player.y = platTop - halfH;
                    player.vy = 0;
                    player.isGrounded = true;
                }
            }
            else {
                if (playerRight > platLeft &&
                    playerLeft < platRight &&
                    playerBottom > platTop &&
                    playerTop < platBottom) {
                    const overlapLeft = playerRight - platLeft;
                    const overlapRight = platRight - playerLeft;
                    const overlapTop = playerBottom - platTop;
                    const overlapBottom = platBottom - playerTop;
                    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                    if (minOverlap === overlapTop && player.vy >= 0) {
                        player.y = platTop - halfH;
                        player.vy = 0;
                        player.isGrounded = true;
                    }
                    else if (minOverlap === overlapBottom && player.vy < 0) {
                        player.y = platBottom + halfH;
                        player.vy = 0;
                    }
                    else if (minOverlap === overlapLeft) {
                        player.x = platLeft - halfW;
                        player.vx = 0;
                    }
                    else if (minOverlap === overlapRight) {
                        player.x = platRight + halfW;
                        player.vx = 0;
                    }
                }
            }
        }
    }
    checkDeathBounds(player) {
        const bounds = this.arena.deathBounds;
        if (player.x < bounds.left ||
            player.x > bounds.right ||
            player.y < bounds.top ||
            player.y > bounds.bottom) {
            this.eliminateStock(player);
        }
    }
    eliminateStock(player) {
        if (this.mode === 'training') {
            // Training mode: dummy or player immediately respawns without losing finite stocks
            player.isAlive = false;
            this.respawnTimers.set(player.id, 15); // quick 0.25s respawn
            return;
        }
        player.stocks--;
        player.hp = 0;
        if (player.stocks <= 0) {
            player.isAlive = false;
            const eliminatedBy = this.lastAttacker.get(player.id) || null;
            this.eliminationOrder.push({ playerId: player.id, eliminatedBy });
            if (this.onElimination) {
                this.onElimination(player.id, eliminatedBy);
            }
        }
        else {
            player.isAlive = false;
            this.respawnTimers.set(player.id, GAME_CONFIG.RESPAWN_DELAY_FRAMES);
        }
    }
    respawnPlayer(playerId) {
        const player = this.players.get(playerId);
        if (!player)
            return;
        const spawnIndex = Math.floor(Math.random() * this.arena.spawnPoints.length);
        const spawn = this.arena.spawnPoints[spawnIndex];
        player.x = spawn.x;
        player.y = spawn.y;
        player.vx = 0;
        player.vy = 0;
        player.damagePercent = 0;
        player.hp = player.maxHp || 200;
        player.isAlive = true;
        player.isAttacking = false;
        player.attackType = null;
        player.attackTimer = 0;
        player.hitStunTimer = 0;
        player.isInvincible = this.mode !== 'training';
        player.invincibleTimer = this.mode !== 'training' ? GAME_CONFIG.INVINCIBLE_FRAMES : 0;
    }
    checkWinCondition() {
        const alivePlayers = Array.from(this.players.values()).filter((p) => p.isAlive || p.stocks > 0);
        if (alivePlayers.length <= 1 && this.players.size > 1) {
            const winner = alivePlayers[0];
            this.winnerId = winner ? winner.id : null;
            this.phase = GamePhase.GAME_OVER;
            if (this.onGameOver) {
                this.onGameOver(this.getGameResult());
            }
        }
    }
    getGameResult() {
        const allPlayers = Array.from(this.players.values());
        const winnerPlayer = this.winnerId ? this.players.get(this.winnerId) : undefined;
        const rankings = allPlayers
            .map((p) => {
            const elimInfo = this.eliminationOrder.find((e) => e.playerId === p.id);
            return {
                playerId: p.id,
                nickname: p.nickname,
                character: p.character,
                placement: 0,
                damageDealt: this.damageDealt.get(p.id) || 0,
                eliminatedBy: elimInfo?.eliminatedBy || null,
                stocksRemaining: Math.max(0, p.stocks),
            };
        })
            .sort((a, b) => {
            if (a.playerId === this.winnerId)
                return -1;
            if (b.playerId === this.winnerId)
                return 1;
            const aElimIndex = this.eliminationOrder.findIndex((e) => e.playerId === a.playerId);
            const bElimIndex = this.eliminationOrder.findIndex((e) => e.playerId === b.playerId);
            return bElimIndex - aElimIndex;
        });
        rankings.forEach((r, i) => {
            r.placement = i + 1;
        });
        return {
            winnerId: this.winnerId || '',
            winnerNickname: winnerPlayer?.nickname || '',
            winnerCharacter: winnerPlayer?.character,
            winnerStocksRemaining: winnerPlayer ? Math.max(0, winnerPlayer.stocks) : undefined,
            mode: this.mode,
            rankings,
        };
    }
    getState() {
        return {
            phase: this.phase,
            players: Array.from(this.players.values()),
            projectiles: this.projectiles.map((p) => ({ ...p })),
            countdown: Math.ceil(this.countdown / GAME_CONFIG.TICK_RATE),
            winnerId: this.winnerId,
            arenaId: this.arena.id,
            tick: this.tick,
            mode: this.mode,
        };
    }
    getHitEffects() {
        return this.hitEffects;
    }
    getPhase() {
        return this.phase;
    }
    getPlayer(id) {
        return this.players.get(id);
    }
    getArena() {
        return this.arena;
    }
    getMode() {
        return this.mode;
    }
}
