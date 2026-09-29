// ============================================================
// Brawl Impact - Game Renderer
// ============================================================

import {
  PlayerState,
  GameState,
  ArenaConfig,
  Direction,
  AttackType,
  HitEffect,
  CharacterType,
  Projectile,
} from '@shared/types';
import {
  PHYSICS,
  ARENA_MVP,
  CHARACTER_COLORS,
  ATTACK_DEFS,
} from '@shared/gameConfig';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

interface DyingAnimation {
  playerId: string;
  character: CharacterType;
  direction: Direction;
  x: number;
  y: number;
  vx: number;
  vy: number;
  timer: number;
  maxTimer: number;
}

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private arena: ArenaConfig = ARENA_MVP;
  private cameraX: number = 0;
  private cameraY: number = 0;
  private cameraZoom: number = 1.45;
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private screenShake: number = 0;
  private localPlayerId: string = '';
  private bgStars: Array<{ x: number; y: number; size: number; alpha: number }> = [];
  private assassinWalkFrames: HTMLImageElement[] = [];
  private assassinIdleFrames: HTMLImageElement[] = [];
  private assassinJumpFrames: { [key: number]: HTMLImageElement } = {};
  private assassinWalkTicks: Map<string, number> = new Map();
  private assassinIdleTicks: Map<string, number> = new Map();
  private assassinAirTicks: Map<string, number> = new Map();
  private assassinLandingTimers: Map<string, number> = new Map();
  private assassinPrevGrounded: Map<string, boolean> = new Map();
  private assassinThrowFrames: HTMLImageElement[] = [];
  private assassinUltimateFrames: HTMLImageElement[] = [];
  private assassinAttackFrames: HTMLImageElement[] = [];
  private shurikenImg: HTMLImageElement;
  private knightWalkFrames: HTMLImageElement[] = [];
  private knightIdleFrames: HTMLImageElement[] = [];
  private knightWalkTicks: Map<string, number> = new Map();
  private knightIdleTicks: Map<string, number> = new Map();
  private knightAirTicks: Map<string, number> = new Map();
  private knightLandingTimers: Map<string, number> = new Map();
  private knightPrevGrounded: Map<string, boolean> = new Map();
  private showGuideLines: boolean = true;
  private dyingAnimations: Map<string, DyingAnimation> = new Map();
  private prevAlivePlayers: Map<string, boolean> = new Map();
  private scaledImageCache: WeakMap<HTMLImageElement, HTMLCanvasElement> = new WeakMap();
  private handleResize = () => this.resizeCanvas();

  // Arena layered assets (Super Smash Bros style)
  private bgImage: HTMLImageElement;
  private platformMainImg: HTMLImageElement;
  private platformLeftImg: HTMLImageElement;
  private platformRightImg: HTMLImageElement;
  private platformTopImg: HTMLImageElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();

    // Preload Arena Layer Assets
    this.bgImage = new Image();
    this.bgImage.src = '/assets/arena/arena_background.jpg';

    this.platformMainImg = new Image();
    this.platformMainImg.src = '/assets/arena/platform_main.png';

    this.platformLeftImg = new Image();
    this.platformLeftImg.src = '/assets/arena/platform_left.png';

    this.platformRightImg = new Image();
    this.platformRightImg.src = '/assets/arena/platform_right.png';

    this.platformTopImg = new Image();
    this.platformTopImg.src = '/assets/arena/platform_top.png';

    // Preload Assassin walk animation frames (1 to 12)
    for (let i = 1; i <= 12; i++) {
      const img = new Image();
      img.src = `/assets/assasin/assasin_walk/assasin_walk${i}.png`;
      this.assassinWalkFrames.push(img);
    }

    // Preload Assassin idle animation frames (1 to 6)
    for (let i = 1; i <= 6; i++) {
      const img = new Image();
      img.src = `/assets/assasin/assasin_idle/assasin_idle${i}.png`;
      this.assassinIdleFrames.push(img);
    }

    // Preload Assassin jump animation frames (0, 1, 2, 3, 5, 6, 7)
    const jumpIndices = [0, 1, 2, 3, 5, 6, 7];
    for (const idx of jumpIndices) {
      const img = new Image();
      img.src = `/assets/assasin/assasin_jump/assasin_jump${idx}.png`;
      this.assassinJumpFrames[idx] = img;
    }

    // Preload Assassin throw animation frames (1 to 9)
    for (let i = 1; i <= 9; i++) {
      const img = new Image();
      img.src = `/assets/assasin/assasin_throw/assasin_throw${i}.png`;
      this.assassinThrowFrames.push(img);
    }

    // Preload Assassin ultimate animation frames (1 to 9)
    for (let i = 1; i <= 9; i++) {
      const img = new Image();
      img.src = `/assets/assasin/assasin_ultimate/assasin_ultimate${i}.png`;
      this.assassinUltimateFrames.push(img);
    }

    // Preload Assassin basic attack animation frames (1 to 9)
    for (let i = 1; i <= 9; i++) {
      const img = new Image();
      img.src = `/assets/assasin/assasin_attack/assasin_attack${i}.png`;
      this.assassinAttackFrames.push(img);
    }

    // Preload Shuriken weapon image
    this.shurikenImg = new Image();
    this.shurikenImg.src = '/assets/assasin/weapon/shuriken_throw.png';

    // Preload Knight walk animation frames (1, 2, 3, 4, 5, 6, 7, 9)
    const knightWalkIndices = [1, 2, 3, 4, 5, 6, 7, 9];
    for (const idx of knightWalkIndices) {
      const img = new Image();
      img.src = `/assets/knight/knight_walk/knight_walk${idx}.png`;
      this.knightWalkFrames.push(img);
    }

    // Preload Knight idle animation frames (1, 2, 4, 5, 6, 7, 8, 9)
    const knightIdleIndices = [1, 2,3,4,5];
    for (const idx of knightIdleIndices) {
      const img = new Image();
      img.src = `/assets/knight/knight_idle/knight_idle${idx}.png`;
      this.knightIdleFrames.push(img);
    }

    // Generate background stars
    for (let i = 0; i < 60; i++) {
      this.bgStars.push({
        x: Math.random() * 1600,
        y: Math.random() * 1000,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    window.addEventListener('resize', this.handleResize);
  }

  setLocalPlayerId(id: string): void {
    this.localPlayerId = id;
  }

  setGuideLines(enabled: boolean): void {
    this.showGuideLines = enabled;
  }

  getGuideLines(): boolean {
    return this.showGuideLines;
  }

  private resizeCanvas(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  render(gameState: GameState): void {
    const { ctx, canvas } = this;

    // Prune stale map keys for disconnected players to prevent memory leaks
    if (this.assassinWalkTicks.size > Math.max(8, gameState.players.length * 2)) {
      const activeIds = new Set(gameState.players.map((p) => p.id));
      for (const id of this.assassinWalkTicks.keys()) {
        if (!activeIds.has(id)) this.assassinWalkTicks.delete(id);
      }
      for (const id of this.assassinIdleTicks.keys()) {
        if (!activeIds.has(id)) this.assassinIdleTicks.delete(id);
      }
      for (const id of this.assassinAirTicks.keys()) {
        if (!activeIds.has(id)) this.assassinAirTicks.delete(id);
      }
      for (const id of this.assassinLandingTimers.keys()) {
        if (!activeIds.has(id)) this.assassinLandingTimers.delete(id);
      }
      for (const id of this.assassinPrevGrounded.keys()) {
        if (!activeIds.has(id)) this.assassinPrevGrounded.delete(id);
      }
      for (const id of this.knightWalkTicks.keys()) {
        if (!activeIds.has(id)) this.knightWalkTicks.delete(id);
      }
      for (const id of this.knightIdleTicks.keys()) {
        if (!activeIds.has(id)) this.knightIdleTicks.delete(id);
      }
      for (const id of this.knightAirTicks.keys()) {
        if (!activeIds.has(id)) this.knightAirTicks.delete(id);
      }
      for (const id of this.knightLandingTimers.keys()) {
        if (!activeIds.has(id)) this.knightLandingTimers.delete(id);
      }
      for (const id of this.knightPrevGrounded.keys()) {
        if (!activeIds.has(id)) this.knightPrevGrounded.delete(id);
      }
      for (const id of this.prevAlivePlayers.keys()) {
        if (!activeIds.has(id)) this.prevAlivePlayers.delete(id);
      }
    }

    // Calculate camera to center on arena
    this.updateCamera(gameState);

    // Apply screen shake
    let shakeX = 0;
    let shakeY = 0;
    if (this.screenShake > 0) {
      shakeX = (Math.random() - 0.5) * this.screenShake * 4;
      shakeY = (Math.random() - 0.5) * this.screenShake * 4;
      this.screenShake *= 0.9;
      if (this.screenShake < 0.1) this.screenShake = 0;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Clear
    this.drawBackground();

    // Camera transform with dynamic zoom
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(this.cameraZoom, this.cameraZoom);
    ctx.translate(-this.cameraX, -this.cameraY);

    // Draw arena
    this.drawArena();

    // Check dying transitions
    this.checkDyingTransitions(gameState);

    // Draw alive players (only if hp > 0 and isAlive)
    for (const player of gameState.players) {
      if (player.isAlive && (player.hp === undefined || player.hp > 0)) {
        this.drawPlayer(player, gameState);
      }
    }

    // Training mode guide lines (distance & aim assist between local player and dummy)
    if (this.showGuideLines && gameState.mode === 'training') {
      this.drawTrainingGuideLines(gameState);
    }

    // Draw dying players with fade-out animation
    this.updateAndDrawDyingPlayers();

    // Draw projectiles
    if (gameState.projectiles && gameState.projectiles.length > 0) {
      this.drawProjectiles(gameState.projectiles);
    }

    // Draw particles
    this.updateAndDrawParticles();

    // Draw floating texts
    this.updateAndDrawFloatingTexts();

    ctx.restore();

    // Draw death zone indicators
    this.drawDeathBoundIndicators(gameState);

    ctx.restore();

    // Draw countdown overlay
    if (gameState.countdown > 0) {
      this.drawCountdown(gameState.countdown);
    }

    // Draw dramatic Game Over / Victory banner if winner or phase is GAME_OVER
    if (gameState.phase === 'GAME_OVER' || gameState.winnerId) {
      this.drawGameOver(gameState);
    }
  }

  private updateCamera(gameState: GameState): void {
    const alivePlayers = gameState.players.filter((p) => p.isAlive && (p.hp === undefined || p.hp > 0));

    let targetX = this.arena.width / 2;
    let targetY = 460;
    let desiredZoom = 1.48;

    if (alivePlayers.length > 0) {
      let minX = alivePlayers[0].x;
      let maxX = alivePlayers[0].x;
      let minY = alivePlayers[0].y;
      let maxY = alivePlayers[0].y;

      for (const p of alivePlayers) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }

      const localPlayer = alivePlayers.find((p) => p.id === this.localPlayerId);
      if (localPlayer && alivePlayers.length > 1) {
        // Weighted midpoint: 65% midpoint, 35% local player
        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;
        targetX = midX * 0.65 + localPlayer.x * 0.35;
        targetY = (midY * 0.65 + localPlayer.y * 0.35) - 30;
      } else if (localPlayer) {
        targetX = localPlayer.x;
        targetY = localPlayer.y - 30;
      } else {
        targetX = (minX + maxX) / 2;
        targetY = (minY + maxY) / 2 - 30;
      }

      // Bound camera smoothly within arena limits
      targetX = Math.max(300, Math.min(this.arena.width - 300, targetX));
      targetY = Math.max(260, Math.min(this.arena.height - 200, targetY));

      // Dynamic zoom based on player distance (closer action when nearby)
      const dx = maxX - minX;
      const dy = maxY - minY;

      const paddingX = 360;
      const paddingY = 260;
      const zoomX = this.canvas.width / Math.max(dx + paddingX, 600);
      const zoomY = this.canvas.height / Math.max(dy + paddingY, 420);

      // Clamp zoom: close action at ~1.58, far action at ~1.30
      desiredZoom = Math.min(Math.max(Math.min(zoomX, zoomY), 1.30), 1.62);
    }

    // Smooth camera follow and zoom interpolation
    this.cameraX += (targetX - this.cameraX) * 0.08;
    this.cameraY += (targetY - this.cameraY) * 0.08;
    this.cameraZoom += (desiredZoom - this.cameraZoom) * 0.06;
  }

  private drawBackground(): void {
    const { ctx, canvas } = this;

    if (this.bgImage.complete && this.bgImage.naturalWidth > 0) {
      // Parallax camera scrolling factor (Super Smash Bros style)
      const parallaxFactorX = 0.1;
      const parallaxFactorY = 0.06;

      // Scale background to cover viewport with padding for camera motion
      const scale = Math.max(
        (canvas.width + 500) / this.bgImage.naturalWidth,
        (canvas.height + 400) / this.bgImage.naturalHeight,
        1,
      );
      const bgW = this.bgImage.naturalWidth * scale;
      const bgH = this.bgImage.naturalHeight * scale;
      const bgX = (canvas.width - bgW) / 2 - (this.cameraX - this.arena.width / 2) * parallaxFactorX;
      const bgY = (canvas.height - bgH) / 2 - (this.cameraY - this.arena.height / 2) * parallaxFactorY;

      ctx.drawImage(this.bgImage, bgX, bgY, bgW, bgH);

      // Deep atmospheric vignette/tint for battlefield mood
      const vignette = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.25,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.75,
      );
      vignette.addColorStop(0, 'rgba(10, 14, 28, 0.2)');
      vignette.addColorStop(1, 'rgba(5, 7, 18, 0.6)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      // Fallback dark gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0a0a1a');
      gradient.addColorStop(0.5, '#12122a');
      gradient.addColorStop(1, '#0d0d20');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Floating starlight / ambient magic motes (batched single draw call)
    ctx.fillStyle = 'rgba(200, 220, 255, 0.35)';
    ctx.beginPath();
    for (const star of this.bgStars) {
      const sx = ((star.x - this.cameraX * 0.15) % canvas.width + canvas.width) % canvas.width;
      const sy = ((star.y - this.cameraY * 0.08) % canvas.height + canvas.height) % canvas.height;
      ctx.moveTo(sx + star.size, sy);
      ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  private drawArena(): void {
    const { ctx } = this;
    const now = Date.now();

    // -------------------------------------------------------------
    // LAYER 1: Stage Ambient Depth & Under-Island Shadows (Backdrop)
    // -------------------------------------------------------------
    const shadowGrad = ctx.createRadialGradient(600, 680, 80, 600, 720, 520);
    shadowGrad.addColorStop(0, 'rgba(2, 4, 12, 0.7)');
    shadowGrad.addColorStop(1, 'rgba(2, 4, 12, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.fillRect(50, 560, 1100, 240);

    // -------------------------------------------------------------
    // LAYER 2: Main Floating Battlefield Island (platform_main)
    // -------------------------------------------------------------
    // Physical platform: x: 150, y: 550, width: 900, height: 30
    if (this.platformMainImg.complete && this.platformMainImg.naturalWidth > 0) {
      const mainVisualW = 926;
      const mainVisualH = 126;
      const mainX = 600 - mainVisualW / 2; // 137
      const mainY = 547; // Align top walkable ledge with y = 550

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 12;
      ctx.drawImage(this.platformMainImg, mainX, mainY, mainVisualW, mainVisualH);
      ctx.restore();


    } else {
      this.drawFallbackPlatform(150, 550, 900, 30, false);
    }

    // -------------------------------------------------------------
    // LAYER 3: Floating Hover Platforms (Smash Bros Soft Platforms)
    // -------------------------------------------------------------
    // Gentle hovering oscillations
    const hoverLeft = Math.sin(now * 0.0018) * 2;
    const hoverRight = Math.sin(now * 0.0018 + Math.PI) * 2;
    const hoverTop = Math.sin(now * 0.0015 + 1.2) * 2.5;
    const hoverUpperLeft = Math.sin(now * 0.002 + 0.8) * 2;
    const hoverUpperRight = Math.sin(now * 0.002 + Math.PI + 0.8) * 2;
    const hoverWingLeft = Math.sin(now * 0.0016 + 2.1) * 1.8;
    const hoverWingRight = Math.sin(now * 0.0016 + Math.PI + 2.1) * 1.8;

    // LEFT FLOATING PLATFORM (x: 220, y: 400, width: 200, height: 15)
    this.drawFloatingPlatform(
      this.platformLeftImg,
      220,
      400,
      200,
      15,
      hoverLeft,
      216,
      95,
      'rgba(74, 158, 255, 0.45)',
    );

    // RIGHT FLOATING PLATFORM (x: 780, y: 400, width: 200, height: 15)
    this.drawFloatingPlatform(
      this.platformRightImg,
      780,
      400,
      200,
      15,
      hoverRight,
      216,
      95,
      'rgba(74, 158, 255, 0.45)',
    );

    // TOP CENTER FLOATING PLATFORM (x: 475, y: 280, width: 250, height: 15)
    this.drawFloatingPlatform(
      this.platformTopImg,
      475,
      280,
      250,
      15,
      hoverTop,
      264,
      78,
      'rgba(168, 85, 247, 0.45)',
    );

    // UPPER-LEFT HIGH PLATFORM (x: 180, y: 240, width: 180, height: 15)
    this.drawFloatingPlatform(
      this.platformLeftImg,
      180,
      240,
      180,
      15,
      hoverUpperLeft,
      196,
      86,
      'rgba(74, 158, 255, 0.45)',
    );

    // UPPER-RIGHT HIGH PLATFORM (x: 840, y: 240, width: 180, height: 15)
    this.drawFloatingPlatform(
      this.platformRightImg,
      840,
      240,
      180,
      15,
      hoverUpperRight,
      196,
      86,
      'rgba(74, 158, 255, 0.45)',
    );

    // OUTER-LEFT WING PLATFORM (x: 70, y: 460, width: 130, height: 15)
    this.drawFloatingPlatform(
      this.platformTopImg,
      70,
      460,
      130,
      15,
      hoverWingLeft,
      146,
      64,
      'rgba(74, 158, 255, 0.45)',
    );

    // OUTER-RIGHT WING PLATFORM (x: 1000, y: 460, width: 130, height: 15)
    this.drawFloatingPlatform(
      this.platformTopImg,
      1000,
      460,
      130,
      15,
      hoverWingRight,
      146,
      64,
      'rgba(74, 158, 255, 0.45)',
    );
  }

  private drawFloatingPlatform(
    img: HTMLImageElement,
    physX: number,
    physY: number,
    physW: number,
    physH: number,
    hoverOffset: number,
    visualW: number,
    visualH: number,
    glowColor: string,
  ): void {
    const { ctx } = this;
    const centerX = physX + physW / 2;

    if (img.complete && img.naturalWidth > 0) {
      const drawX = centerX - visualW / 2;
      const drawY = physY - 3 + hoverOffset;

      ctx.save();
      // Magical hover glow under floating rock
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 14;
      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.ellipse(centerX, drawY + visualH * 0.65, visualW * 0.25, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Platform rock graphic
      ctx.drawImage(img, drawX, drawY, visualW, visualH);

      // Top ledge highlight for crisp landing edge
      if (this.showGuideLines) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 2;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(physX + 4, physY + hoverOffset);
        ctx.lineTo(physX + physW - 4, physY + hoverOffset);
        ctx.stroke();
      }

      ctx.restore();
    } else {
      this.drawFallbackPlatform(physX, physY + hoverOffset, physW, physH, true);
    }
  }

  private drawFallbackPlatform(
    x: number,
    y: number,
    width: number,
    height: number,
    isPassthrough: boolean,
  ): void {
    const { ctx } = this;
    if (isPassthrough) {
      const gradient = ctx.createLinearGradient(x, y, x, y + height);
      gradient.addColorStop(0, '#4a9eff');
      gradient.addColorStop(1, '#2563eb');
      ctx.fillStyle = gradient;
      this.roundRect(x, y, width, height, 4);
      ctx.fill();
    } else {
      const gradient = ctx.createLinearGradient(x, y, x, y + height);
      gradient.addColorStop(0, '#3b4a6b');
      gradient.addColorStop(1, '#2a3555');
      ctx.fillStyle = gradient;
      this.roundRect(x, y, width, height, 6);
      ctx.fill();
    }
  }

  private drawPlayer(player: PlayerState, _gameState: GameState): void {
    const { ctx } = this;
    const colors = CHARACTER_COLORS[player.character];
    const halfW = PHYSICS.PLAYER_WIDTH / 2;
    const halfH = PHYSICS.PLAYER_HEIGHT / 2;

    ctx.save();
    ctx.translate(player.x, player.y);

    // Invincibility effect
    if (player.isInvincible) {
      const flashAlpha = Math.sin(Date.now() * 0.02) * 0.3 + 0.5;
      ctx.globalAlpha = flashAlpha;
    }

    // Hit stun effect
    if (player.hitStunTimer > 0) {
      const shakeOffset = Math.sin(Date.now() * 0.1) * 3;
      ctx.translate(shakeOffset, 0);
    }

    // Player body
    if (player.character === CharacterType.ASSASSIN && this.areAssassinFramesLoaded()) {
      this.drawAssassin(player);
    } else if (player.character === CharacterType.KNIGHT && this.areKnightFramesLoaded()) {
      this.drawKnight(player);
    } else {
      this.drawDefaultPlayerBody(player, colors, halfW, halfH);
    }

    // Attack visual
    if (player.isAttacking && player.attackType) {
      this.drawAttackVisual(player);
    }

    ctx.globalAlpha = 1;
    ctx.restore();

    // Overhead Health Bar & Nickname
    ctx.font = 'bold 12px "MedievalSharp", cursive, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = player.id === this.localPlayerId ? '#ffd700' : '#e6edf3';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;
    ctx.fillText(player.nickname, player.x, player.y - halfH - 26);
    ctx.shadowBlur = 0;

    // Overhead Health Bar (decreasing from 200 to 0)
    const currentHp = Math.max(0, Math.ceil(player.hp ?? 200));
    const maxHp = player.maxHp || 200;
    const hpRatio = Math.max(0, Math.min(1, currentHp / maxHp));
    const barW = 50;
    const barH = 6;
    const barX = player.x - barW / 2;
    const barY = player.y - halfH - 20;

    // Health bar background frame
    ctx.fillStyle = 'rgba(10, 12, 16, 0.9)';
    this.roundRect(barX - 1.5, barY - 1.5, barW + 3, barH + 3, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(139, 115, 85, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Health bar fill
    const hpColor = this.getHpColor(currentHp, maxHp);
    if (hpRatio > 0) {
      ctx.fillStyle = hpColor;
      ctx.shadowColor = hpColor;
      ctx.shadowBlur = 6;
      this.roundRect(barX, barY, barW * hpRatio, barH, 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // HP Text
    ctx.fillStyle = hpColor;
    ctx.font = 'bold 10px "MedievalSharp", cursive, serif';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 3;
    ctx.fillText(`${currentHp}/${maxHp}`, player.x, player.y - halfH - 7);
    ctx.shadowBlur = 0;


  }

  private drawCharacterIcon(character: CharacterType, x: number, y: number): void {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = 'bold 14px "MedievalSharp", cursive, serif';
    ctx.textAlign = 'center';

    switch (character) {
      case CharacterType.KNIGHT:
        ctx.fillText('⚔', x, y + 5);
        break;
      case CharacterType.MAGE:
        ctx.fillText('✦', x, y + 5);
        break;
      case CharacterType.ASSASSIN:
        ctx.fillText('◆', x, y + 5);
        break;
      case CharacterType.FIGHTER:
        ctx.fillText('✊', x, y + 5);
        break;
    }
  }

  private getOptimizedImage(img: HTMLImageElement): CanvasImageSource {
    if (!img.complete || img.naturalWidth === 0) return img;
    // Only downsample very large textures (> 512px) once to save GPU fill rate
    if (img.naturalWidth <= 512 && img.naturalHeight <= 512) return img;

    let cached = this.scaledImageCache.get(img);
    if (!cached) {
      cached = document.createElement('canvas');
      const targetH = 264; // 3x draw height for super crisp display
      const targetW = Math.max(1, Math.round(img.naturalWidth * (targetH / img.naturalHeight)));
      cached.width = targetW;
      cached.height = targetH;
      const offCtx = cached.getContext('2d');
      if (offCtx) {
        offCtx.imageSmoothingEnabled = true;
        offCtx.imageSmoothingQuality = 'high';
        offCtx.drawImage(img, 0, 0, targetW, targetH);
      }
      this.scaledImageCache.set(img, cached);
    }
    return cached;
  }

  private areKnightFramesLoaded(): boolean {
    return (
      this.knightWalkFrames.length > 0 &&
      this.knightWalkFrames[0].complete &&
      this.knightWalkFrames[0].naturalWidth > 0
    );
  }

  private areAssassinFramesLoaded(): boolean {
    return (
      this.assassinWalkFrames.length > 0 &&
      this.assassinWalkFrames[0].complete &&
      this.assassinWalkFrames[0].naturalWidth > 0
    );
  }

  private areAssassinThrowFramesLoaded(): boolean {
    return (
      this.assassinThrowFrames.length > 0 &&
      this.assassinThrowFrames[0].complete &&
      this.assassinThrowFrames[0].naturalWidth > 0
    );
  }

  private areAssassinUltimateFramesLoaded(): boolean {
    return (
      this.assassinUltimateFrames.length > 0 &&
      this.assassinUltimateFrames[0].complete &&
      this.assassinUltimateFrames[0].naturalWidth > 0
    );
  }

  private areAssassinAttackFramesLoaded(): boolean {
    return (
      this.assassinAttackFrames.length > 0 &&
      this.assassinAttackFrames[0].complete &&
      this.assassinAttackFrames[0].naturalWidth > 0
    );
  }

  private drawAssassin(player: PlayerState): void {
    const { ctx } = this;
    const halfH = PHYSICS.PLAYER_HEIGHT / 2;

    // Track grounded state transitions to detect landing impact
    const wasGrounded = this.assassinPrevGrounded.get(player.id) ?? true;
    this.assassinPrevGrounded.set(player.id, player.isGrounded);

    let landingTimer = this.assassinLandingTimers.get(player.id) || 0;
    if (!wasGrounded && player.isGrounded) {
      // Just hit the ground: show landing crouch for ~7 frames (116ms)
      landingTimer = 7;
    }
    if (landingTimer > 0) {
      landingTimer--;
      this.assassinLandingTimers.set(player.id, landingTimer);
    }

    // Soft ground shadow beneath character feet (only when grounded)
    if (player.isGrounded) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, halfH - 1, 18, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }



    // Select active animation frame based on motion state
    let frameImg: HTMLImageElement | undefined;

    // Check if performing Assassin Ultimate: Shadow Step
    if (
      player.isAttacking &&
      player.attackType === AttackType.ULTIMATE &&
      this.areAssassinUltimateFramesLoaded()
    ) {
      const attackData = ATTACK_DEFS[CharacterType.ASSASSIN][AttackType.ULTIMATE];
      const elapsed = attackData.duration - player.attackTimer;
      const progress = Math.min(0.999, Math.max(0, elapsed / attackData.duration));
      const frameIndex = Math.floor(progress * this.assassinUltimateFrames.length);
      frameImg = this.assassinUltimateFrames[frameIndex];
    } else if (
      player.isAttacking &&
      player.attackType === AttackType.ABILITY &&
      this.areAssassinThrowFramesLoaded()
    ) {
      const attackData = ATTACK_DEFS[CharacterType.ASSASSIN][AttackType.ABILITY];
      const elapsed = attackData.duration - player.attackTimer;
      // 9 frames over 27 ticks (3 ticks per frame). Frame 6 (idx 5) and Frame 7 (idx 6) are the throw releases!
      const frameIndex = Math.min(8, Math.max(0, Math.floor(elapsed / 3)));
      frameImg = this.assassinThrowFrames[frameIndex];
    } else if (
      player.isAttacking &&
      player.attackType === AttackType.BASIC &&
      this.areAssassinAttackFramesLoaded()
    ) {
      const attackData = ATTACK_DEFS[CharacterType.ASSASSIN][AttackType.BASIC];
      const elapsed = attackData.duration - player.attackTimer;
      const progress = Math.min(0.999, Math.max(0, elapsed / attackData.duration));
      const frameIndex = Math.min(
        this.assassinAttackFrames.length - 1,
        Math.floor(progress * this.assassinAttackFrames.length)
      );
      frameImg = this.assassinAttackFrames[frameIndex];
    } else if (!player.isGrounded) {
      // --- AIRBORNE / JUMP ANIMATION ---
      this.assassinLandingTimers.set(player.id, 0);
      const airTicks = (this.assassinAirTicks.get(player.id) || 0) + 1;
      this.assassinAirTicks.set(player.id, airTicks);

      // JUMP ANIMATION TIMING:
      // Slower overall progression with prolonged mid-air floating hang time
      if (airTicks <= 4 && player.vy < -7) {
        // Initial explosive spring / liftoff
        frameImg = this.assassinJumpFrames[2];
      } else if (player.vy < 0) {
        // Mid-air ascent toward apex (held longer!)
        frameImg = this.assassinJumpFrames[3];
      } else if (player.vy < 7.5) {
        // Mid-air apex crest and downward glide (held longer!)
        frameImg = this.assassinJumpFrames[5];
      } else {
        // Fast falling downward plunge
        frameImg = this.assassinJumpFrames[6];
      }
    } else {
      // --- GROUNDED ANIMATION ---
      this.assassinAirTicks.set(player.id, 0);
      const isMoving = Math.abs(player.vx) > 0.3;

      if (isMoving) {
        // Cancel landing animation if player immediately runs
        this.assassinLandingTimers.set(player.id, 0);

        // WALKING: 12-frame sequence
        let walkTick = this.assassinWalkTicks.get(player.id) || 0;
        const animSpeed = Math.min(Math.max(Math.abs(player.vx) * 0.04, 0.16), 0.36);
        walkTick = (walkTick + animSpeed) % this.assassinWalkFrames.length;
        this.assassinWalkTicks.set(player.id, walkTick);

        const frameIndex = Math.floor(walkTick) % this.assassinWalkFrames.length;
        frameImg = this.assassinWalkFrames[frameIndex];
      } else if (landingTimer > 0) {
        // LANDING IMPACT: frame 7 (recovery crouch)
        frameImg = this.assassinJumpFrames[7] || this.assassinIdleFrames[0];
      } else {
        // IDLE: Calm, natural breathing animation cycling across 6 frames (~2.4s full breath cycle)
        let idleTick = (this.assassinIdleTicks.get(player.id) || 0) + 1;
        this.assassinIdleTicks.set(player.id, idleTick);

        // Cycle idle frames every 24 render ticks (~400ms per frame, full breath cycle 2.4s)
        const idleIndex = Math.floor(idleTick / 24) % Math.max(1, this.assassinIdleFrames.length);
        frameImg = this.assassinIdleFrames[idleIndex];
      }
    }

    // Safety fallback if selected frame is not yet fully loaded
    if (!frameImg || !frameImg.complete || frameImg.naturalWidth === 0) {
      frameImg = this.assassinWalkFrames[0];
    }
    if (!frameImg || !frameImg.complete || frameImg.naturalWidth === 0) {
      return;
    }

    // Sprite dimensions (original frame aspect ratio 960x1280 = 0.75)
    const drawHeight = 88;
    const drawWidth = 66;
    // Align sprite feet with player's ground contact (halfH = 30)
    // Feet are at ~98.8% of image height
    const drawY = halfH - drawHeight * 0.988;
    const drawX = -drawWidth / 2;

    const currentDrawWidth = frameImg.naturalHeight > 0
      ? Math.round(frameImg.naturalWidth * (drawHeight / frameImg.naturalHeight))
      : drawWidth;

    ctx.save();

    // Flip horizontally when facing Direction.LEFT
    // Default sprite frames face Direction.RIGHT; flipping symmetrically on the X-axis
    if (player.direction === Direction.LEFT) {
      ctx.scale(-1, 1);
    }

    // Shadow afterimage for Assassin Ultimate (Shadow Step)
    if (player.isAttacking && player.attackType === AttackType.ULTIMATE) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.drawImage(this.getOptimizedImage(frameImg), drawX - 10, drawY, currentDrawWidth, drawHeight);
      ctx.globalAlpha = 0.18;
      ctx.drawImage(this.getOptimizedImage(frameImg), drawX - 20, drawY, currentDrawWidth, drawHeight);
      ctx.restore();
    }

    // Draw active animation frame (using pre-scaled cache for high-res assets)
    ctx.drawImage(this.getOptimizedImage(frameImg), drawX, drawY, currentDrawWidth, drawHeight);

    ctx.restore();
  }

  private drawKnight(player: PlayerState): void {
    const { ctx } = this;
    const halfH = PHYSICS.PLAYER_HEIGHT / 2;

    // Track grounded state transitions to detect landing impact
    const wasGrounded = this.knightPrevGrounded.get(player.id) ?? true;
    this.knightPrevGrounded.set(player.id, player.isGrounded);

    let landingTimer = this.knightLandingTimers.get(player.id) || 0;
    if (!wasGrounded && player.isGrounded) {
      // Just hit the ground: show landing crouch for ~7 frames (116ms)
      landingTimer = 7;
    }
    if (landingTimer > 0) {
      landingTimer--;
      this.knightLandingTimers.set(player.id, landingTimer);
    }

    // Soft ground shadow beneath character feet (only when grounded)
    if (player.isGrounded) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, halfH - 1, 20, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Select active animation frame based on motion state
    let frameImg: HTMLImageElement | undefined;

    if (player.isAttacking) {
      // Dynamic combat stance when performing attacks
      if (player.attackType === AttackType.ULTIMATE) {
        // Ultimate power strike pose (walk frame 7 or 3)
        frameImg = this.knightWalkFrames[6] || this.knightWalkFrames[2];
      } else if (player.attackType === AttackType.ABILITY) {
        // Shield charge pose (walk frame 2 or 3)
        frameImg = this.knightWalkFrames[1] || this.knightWalkFrames[2];
      } else {
        // Basic sword slash pose (walk frame 3)
        frameImg = this.knightWalkFrames[2] || this.knightWalkFrames[0];
      }
    } else if (!player.isGrounded) {
      // --- AIRBORNE / JUMP ANIMATION ---
      this.knightLandingTimers.set(player.id, 0);
      const airTicks = (this.knightAirTicks.get(player.id) || 0) + 1;
      this.knightAirTicks.set(player.id, airTicks);

      if (airTicks <= 4 && player.vy < -7) {
        // Initial explosive spring / liftoff
        frameImg = this.knightWalkFrames[2] || this.knightWalkFrames[0];
      } else if (player.vy < 0) {
        // Mid-air ascent toward apex
        frameImg = this.knightWalkFrames[6] || this.knightWalkFrames[2];
      } else if (player.vy < 7.5) {
        // Mid-air apex crest
        frameImg = this.knightWalkFrames[4] || this.knightWalkFrames[3];
      } else {
        // Falling downward plunge
        frameImg = this.knightWalkFrames[2] || this.knightWalkFrames[1];
      }
    } else {
      // --- GROUNDED ANIMATION ---
      this.knightAirTicks.set(player.id, 0);
      const isMoving = Math.abs(player.vx) > 0.3;

      if (isMoving) {
        // Cancel landing animation if player immediately runs
        this.knightLandingTimers.set(player.id, 0);

        // WALKING: 8-frame sequence
        let walkTick = this.knightWalkTicks.get(player.id) || 0;
        const animSpeed = Math.min(Math.max(Math.abs(player.vx) * 0.04, 0.14), 0.34);
        walkTick = (walkTick + animSpeed) % this.knightWalkFrames.length;
        this.knightWalkTicks.set(player.id, walkTick);

        const frameIndex = Math.floor(walkTick) % this.knightWalkFrames.length;
        frameImg = this.knightWalkFrames[frameIndex];
      } else if (landingTimer > 0) {
        // LANDING IMPACT: crouch recovery pose
        frameImg = this.knightWalkFrames[1] || this.knightIdleFrames[0];
      } else {
        // IDLE: Calm, rhythmic breathing animation cycling across 8 frames (~2.4s full cycle)
        let idleTick = (this.knightIdleTicks.get(player.id) || 0) + 1;
        this.knightIdleTicks.set(player.id, idleTick);

        // Cycle idle frames every 18 render ticks (~300ms per frame, full breath cycle ~2.4s)
        const idleIndex = Math.floor(idleTick / 18) % Math.max(1, this.knightIdleFrames.length);
        frameImg = this.knightIdleFrames[idleIndex];
      }
    }

    // Safety fallback if selected frame is not yet fully loaded
    if (!frameImg || !frameImg.complete || frameImg.naturalWidth === 0) {
      frameImg = this.knightIdleFrames[0] || this.knightWalkFrames[0];
    }
    if (!frameImg || !frameImg.complete || frameImg.naturalWidth === 0) {
      return;
    }

    // Sprite dimensions (original frame 1536x2048, aspect ratio 0.75)
    // Knight stands slightly taller and sturdier than assassin
    const drawHeight = 78;
    const drawWidth = 58;
    // Align sprite feet with player's ground contact (halfH = 30)
    // Feet are at ~99.5% of image height
    const drawY = halfH - drawHeight * 0.995;
    const drawX = -drawWidth / 2;

    const currentDrawWidth = frameImg.naturalHeight > 0
      ? Math.round(frameImg.naturalWidth * (drawHeight / frameImg.naturalHeight))
      : drawWidth;

    ctx.save();

    // Flip horizontally when facing Direction.LEFT
    // Default sprite frames face Direction.RIGHT; flipping symmetrically on the X-axis
    if (player.direction === Direction.LEFT) {
      ctx.scale(-1, 1);
    }

    // Radiant power afterimage for Knight Ultimate
    if (player.isAttacking && player.attackType === AttackType.ULTIMATE) {
      ctx.save();
      ctx.globalAlpha = 0.32;
      ctx.drawImage(this.getOptimizedImage(frameImg), drawX - 10, drawY, currentDrawWidth, drawHeight);
      ctx.globalAlpha = 0.16;
      ctx.drawImage(this.getOptimizedImage(frameImg), drawX - 20, drawY, currentDrawWidth, drawHeight);
      ctx.restore();
    }

    // Draw active animation frame (using pre-scaled cache for high-res assets)
    ctx.drawImage(this.getOptimizedImage(frameImg), drawX, drawY, currentDrawWidth, drawHeight);

    ctx.restore();
  }

  private drawDefaultPlayerBody(
    player: PlayerState,
    colors: (typeof CHARACTER_COLORS)[CharacterType],
    halfW: number,
    halfH: number,
  ): void {
    const { ctx } = this;

    // Player body
    const bodyGradient = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
    bodyGradient.addColorStop(0, colors.accent);
    bodyGradient.addColorStop(0.5, colors.primary);
    bodyGradient.addColorStop(1, colors.secondary);
    ctx.fillStyle = bodyGradient;
    this.roundRect(-halfW, -halfH, PHYSICS.PLAYER_WIDTH, PHYSICS.PLAYER_HEIGHT, 8);
    ctx.fill();

    // Player outline glow
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 2;
    ctx.shadowColor = colors.primary;
    ctx.shadowBlur = player.id === this.localPlayerId ? 15 : 6;
    this.roundRect(-halfW, -halfH, PHYSICS.PLAYER_WIDTH, PHYSICS.PLAYER_HEIGHT, 8);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Direction indicator (eyes)
    const eyeX = player.direction === Direction.RIGHT ? 6 : -6;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeX - 4, -10, 5, 0, Math.PI * 2);
    ctx.arc(eyeX + 6, -10, 5, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    const pupilOffset = player.direction === Direction.RIGHT ? 2 : -2;
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(eyeX - 4 + pupilOffset, -10, 2.5, 0, Math.PI * 2);
    ctx.arc(eyeX + 6 + pupilOffset, -10, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Character icon/indicator
    this.drawCharacterIcon(player.character, 0, 5);
  }

  private drawAttackVisual(player: PlayerState): void {
    const { ctx } = this;
    if (!player.attackType) return;

    // Assassin Ability is Shuriken Throw - animated via sprite and projectile, skip melee box
    if (player.character === CharacterType.ASSASSIN && player.attackType === AttackType.ABILITY) {
      return;
    }

    // Assassin Basic Attack is fully animated with custom dagger slash sprite frames
    if (
      player.character === CharacterType.ASSASSIN &&
      player.attackType === AttackType.BASIC &&
      this.areAssassinAttackFramesLoaded()
    ) {
      return;
    }

    const attackData = ATTACK_DEFS[player.character][player.attackType];
    const dirMult = player.direction === Direction.RIGHT ? 1 : -1;

    // Calculate hitbox position relative to player center
    const hbX = player.direction === Direction.RIGHT
      ? attackData.hitboxOffsetX
      : -attackData.hitboxOffsetX - attackData.hitboxWidth;
    const hbY = attackData.hitboxOffsetY;

    // Attack arc/slash visual
    let attackColor = 'rgba(255, 255, 255, 0.6)';
    if (player.attackType === AttackType.ABILITY) {
      attackColor = 'rgba(100, 200, 255, 0.6)';
    } else if (player.attackType === AttackType.ULTIMATE) {
      attackColor = player.character === CharacterType.ASSASSIN
        ? 'rgba(168, 85, 247, 0.75)'
        : player.character === CharacterType.KNIGHT
        ? 'rgba(235, 180, 50, 0.85)'
        : 'rgba(255, 200, 50, 0.7)';
    }

    ctx.fillStyle = attackColor;
    ctx.globalAlpha = 0.5;

    // Draw attack arc
    const elapsed = attackData.duration - player.attackTimer;
    if (elapsed >= attackData.startupFrames && elapsed < attackData.startupFrames + attackData.activeFrames) {
      // Active frames - show hitbox
      ctx.fillStyle = attackColor;
      ctx.shadowColor = attackColor;
      ctx.shadowBlur = 20;
      this.roundRect(hbX, hbY, attackData.hitboxWidth, attackData.hitboxHeight, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Slash lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      const slashProgress = (elapsed - attackData.startupFrames) / attackData.activeFrames;
      const slashAngle = (slashProgress * Math.PI * 0.5 - Math.PI * 0.25) * dirMult;

      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(
        Math.cos(slashAngle) * 40,
        Math.sin(slashAngle) * 40 - 5,
      );
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private drawTrainingGuideLines(gameState: GameState): void {
    const local = gameState.players.find((p) => p.id === this.localPlayerId);
    if (!local || !local.isAlive) return;

    const { ctx } = this;
    for (const player of gameState.players) {
      if (player.id === this.localPlayerId || !player.isAlive) continue;

      const dx = player.x - local.x;
      const dy = player.y - local.y;
      const dist = Math.round(Math.hypot(dx, dy));

      ctx.save();
      // Distance line connecting player and sparring dummy
      ctx.strokeStyle = 'rgba(74, 158, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(local.x, local.y);
      ctx.lineTo(player.x, player.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Distance badge floating at midpoint
      const midX = (local.x + player.x) / 2;
      const midY = (local.y + player.y) / 2 - 12;
      ctx.fillStyle = 'rgba(12, 16, 26, 0.85)';
      this.roundRect(midX - 26, midY - 9, 52, 18, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(74, 158, 255, 0.6)';
      ctx.lineWidth = 1;
      this.roundRect(midX - 26, midY - 9, 52, 18, 4);
      ctx.stroke();

      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${dist}px`, midX, midY);
      ctx.restore();
    }
  }



  private getHpColor(hp: number, maxHp: number = 200): string {
    const pct = (hp / maxHp) * 100;
    if (pct > 60) return '#44d76b';
    if (pct > 30) return '#c9a44e';
    if (pct > 15) return '#e67e22';
    return '#e74c3c';
  }



  private drawDeathBoundIndicators(_gameState: GameState): void {
    const { ctx, canvas } = this;

    // Subtle warning indicators at screen edges
    const gradient = ctx.createLinearGradient(0, canvas.height - 60, 0, canvas.height);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, 'rgba(255, 50, 50, 0.15)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
  }

  private drawCountdown(seconds: number): void {
    const { ctx, canvas } = this;

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Countdown number
    const text = seconds > 0 ? seconds.toString() : 'FIGHT!';
    ctx.fillStyle = seconds > 0 ? '#f5e6c8' : '#c9a44e';
    ctx.font = `bold ${seconds > 0 ? 100 : 70}px "MedievalSharp", cursive, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = seconds > 0 ? '#c9a44e' : '#a84040';
    ctx.shadowBlur = 30;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    ctx.shadowBlur = 0;
    ctx.textBaseline = 'alphabetic';
  }

  private drawGameOver(gameState: GameState): void {
    const { ctx, canvas } = this;
    const winner = gameState.players.find((p) => p.id === gameState.winnerId);
    const isWinner = gameState.winnerId === this.localPlayerId;

    ctx.save();
    // Dark overlay
    ctx.fillStyle = 'rgba(10, 10, 18, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerY = canvas.height / 2;

    // Victory parchment box
    const bannerW = Math.min(520, canvas.width - 40);
    const bannerH = 150;
    const bannerX = (canvas.width - bannerW) / 2;
    const bannerY = centerY - bannerH / 2;

    ctx.fillStyle = 'rgba(26, 30, 33, 0.95)';
    ctx.strokeStyle = '#c9a44e';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#c9a44e';
    ctx.shadowBlur = 20;
    this.roundRect(bannerX, bannerY, bannerW, bannerH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner gold border line
    ctx.strokeStyle = 'rgba(201, 164, 78, 0.4)';
    ctx.lineWidth = 1;
    this.roundRect(bannerX + 5, bannerY + 5, bannerW - 10, bannerH - 10, 6);
    ctx.stroke();

    // Title
    ctx.fillStyle = '#f5e6c8';
    ctx.font = 'bold 32px "MedievalSharp", cursive, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#c9a44e';
    ctx.shadowBlur = 12;
    ctx.fillText(isWinner ? '⚔ GLORIOUS VICTORY! ⚔' : '⚔ BATTLE CONCLUDED ⚔', canvas.width / 2, centerY - 28);

    // Winner announcement
    ctx.fillStyle = '#c9a44e';
    ctx.font = 'bold 20px "MedievalSharp", cursive, serif';
    ctx.shadowBlur = 6;
    const winnerText = winner ? `Champion: ${winner.nickname}` : 'The dust settles...';
    ctx.fillText(winnerText, canvas.width / 2, centerY + 12);

    // Subtitle
    ctx.fillStyle = '#a09880';
    ctx.font = '13px "MedievalSharp", cursive, serif';
    ctx.shadowBlur = 0;
    ctx.fillText('Preparing the halls for the victor...', canvas.width / 2, centerY + 44);

    ctx.restore();
  }

  private checkDyingTransitions(gameState: GameState): void {
    for (const player of gameState.players) {
      const wasAlive = this.prevAlivePlayers.get(player.id) ?? true;
      const isNowDead = !player.isAlive || (player.hp !== undefined && player.hp <= 0);

      if (wasAlive && isNowDead && !this.dyingAnimations.has(player.id)) {
        this.dyingAnimations.set(player.id, {
          playerId: player.id,
          character: player.character,
          direction: player.direction,
          x: player.x,
          y: player.y,
          vx: player.vx * 0.25,
          vy: -1.2,
          timer: 75,
          maxTimer: 75,
        });

        // Spawn death burst particles
        for (let i = 0; i < 22; i++) {
          this.particles.push({
            x: player.x + (Math.random() - 0.5) * 28,
            y: player.y + (Math.random() - 0.5) * 36,
            vx: (Math.random() - 0.5) * 2.5,
            vy: -Math.random() * 2.2 - 0.6,
            life: 40,
            maxLife: 40,
            color: player.character === CharacterType.ASSASSIN ? '#4a5568' : player.character === CharacterType.KNIGHT ? '#4e6a73' : '#e74c3c',
            size: Math.random() * 3.5 + 1.5,
          });
        }
      } else if (!isNowDead && player.isAlive) {
        this.dyingAnimations.delete(player.id);
      }

      this.prevAlivePlayers.set(player.id, player.isAlive && (player.hp === undefined || player.hp > 0));
    }
  }

  private updateAndDrawDyingPlayers(): void {
    const { ctx } = this;
    const halfW = PHYSICS.PLAYER_WIDTH / 2;
    const halfH = PHYSICS.PLAYER_HEIGHT / 2;

    for (const [playerId, anim] of this.dyingAnimations.entries()) {
      const progress = anim.timer / anim.maxTimer; // 1.0 down to 0.0
      const alpha = Math.max(0, Math.min(1, progress));

      // Drift upward and slow horizontal momentum
      anim.x += anim.vx;
      anim.y += anim.vy;
      anim.vx *= 0.94;
      anim.vy *= 0.94;
      anim.timer--;

      ctx.save();
      ctx.translate(anim.x, anim.y);
      ctx.globalAlpha = alpha;

      if (anim.character === CharacterType.ASSASSIN && this.areAssassinFramesLoaded()) {
        const frameImg = this.assassinJumpFrames[7] || this.assassinWalkFrames[0];
        const drawHeight = 88;
        const drawWidth = 66;
        const drawY = halfH - drawHeight * 0.988;
        const drawX = -drawWidth / 2;

        ctx.save();
        if (anim.direction === Direction.LEFT) {
          ctx.scale(-1, 1);
        }
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 12;
        ctx.drawImage(this.getOptimizedImage(frameImg), drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
      } else if (anim.character === CharacterType.KNIGHT && this.areKnightFramesLoaded()) {
        const frameImg = this.knightIdleFrames[0] || this.knightWalkFrames[0];
        const drawHeight = 78;
        const drawWidth = 58;
        const drawY = halfH - drawHeight * 0.995;
        const drawX = -drawWidth / 2;

        ctx.save();
        if (anim.direction === Direction.LEFT) {
          ctx.scale(-1, 1);
        }
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 12;
        ctx.drawImage(this.getOptimizedImage(frameImg), drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
      } else {
        const colors = CHARACTER_COLORS[anim.character];
        ctx.fillStyle = colors.secondary;
        this.roundRect(-halfW, -halfH, PHYSICS.PLAYER_WIDTH, PHYSICS.PLAYER_HEIGHT, 8);
        ctx.fill();
      }

      ctx.restore();

      // Dissolving spirit particles
      if (Math.random() < 0.35 && anim.timer > 8) {
        this.particles.push({
          x: anim.x + (Math.random() - 0.5) * 22,
          y: anim.y + (Math.random() - 0.5) * 28,
          vx: (Math.random() - 0.5) * 1.0,
          vy: -Math.random() * 1.4 - 0.3,
          life: 25,
          maxLife: 25,
          color: 'rgba(200, 210, 225, 0.7)',
          size: Math.random() * 3 + 1,
        });
      }

      if (anim.timer <= 0) {
        this.dyingAnimations.delete(playerId);
      }
    }
  }

  private drawProjectiles(projectiles: Projectile[]): void {
    const { ctx } = this;

    for (const proj of projectiles) {
      ctx.save();
      ctx.translate(proj.x, proj.y);
      ctx.rotate(proj.rotation);

      if (this.shurikenImg.complete && this.shurikenImg.naturalWidth > 0) {
        const size = 26;
        ctx.shadowColor = '#5dade2';
        ctx.shadowBlur = 10;
        ctx.drawImage(this.shurikenImg, -size / 2, -size / 2, size, size);
      } else {
        // Fallback ninja star
        ctx.fillStyle = '#a0aec0';
        ctx.shadowColor = '#5dade2';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2;
          ctx.lineTo(Math.cos(angle) * 12, Math.sin(angle) * 12);
          ctx.lineTo(Math.cos(angle + Math.PI / 4) * 4, Math.sin(angle + Math.PI / 4) * 4);
        }
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();

      // Spinning wind particle trail
      if (Math.random() < 0.4) {
        this.particles.push({
          x: proj.x,
          y: proj.y + (Math.random() - 0.5) * 6,
          vx: -proj.vx * 0.12 + (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.8,
          life: 14,
          maxLife: 14,
          color: '#7fb3d5',
          size: Math.random() * 2.5 + 1,
        });
      }
    }
  }

  // --- Effects ---

  addHitEffect(effect: HitEffect): void {
    this.screenShake = Math.min(this.screenShake + effect.damage * 0.3, 10);

    // Particles
    const count = Math.floor(effect.damage * 0.5) + 5;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: effect.x,
        y: effect.y,
        vx: (Math.random() - 0.5) * 8 + effect.knockbackX * 0.3,
        vy: (Math.random() - 0.5) * 8 + effect.knockbackY * 0.3,
        life: 20 + Math.random() * 20,
        maxLife: 40,
        color: `hsl(${30 + Math.random() * 30}, 100%, ${50 + Math.random() * 30}%)`,
        size: 2 + Math.random() * 4,
      });
    }

    // Floating damage text
    this.floatingTexts.push({
      x: effect.x,
      y: effect.y - 20,
      text: `${effect.damage}`,
      color: '#ff4444',
      life: 40,
      maxLife: 40,
    });
  }

  addEliminationEffect(x: number, y: number): void {
    this.screenShake = 8;
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * (3 + Math.random() * 5),
        vy: Math.sin(angle) * (3 + Math.random() * 5),
        life: 40 + Math.random() * 20,
        maxLife: 60,
        color: `hsl(${Math.random() * 60}, 100%, 60%)`,
        size: 3 + Math.random() * 5,
      });
    }
  }

  private updateAndDrawParticles(): void {
    const { ctx } = this;
    this.particles = this.particles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.vx *= 0.98;
      p.life--;

      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.1, p.size * alpha), 0, Math.PI * 2);
      ctx.fill();

      return p.life > 0;
    });
    ctx.globalAlpha = 1;
  }

  private updateAndDrawFloatingTexts(): void {
    const { ctx } = this;
    this.floatingTexts = this.floatingTexts.filter((ft) => {
      ft.y -= 1;
      ft.life--;

      const alpha = ft.life / ft.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 16px "MedievalSharp", cursive, serif';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);

      return ft.life > 0;
    });
    ctx.globalAlpha = 1;
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  destroy(): void {
    window.removeEventListener('resize', this.handleResize);
  }
}
