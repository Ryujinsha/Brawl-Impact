// ============================================================
// Brawl Impact - Training Engine (Local Single-Player Simulation)
// Runs 100% offline in browser using shared GameEngine & Renderer
// ============================================================

import { GameState, CharacterType, PlayerInput, Direction, HitEffect } from '@shared/types';
import { GameEngine } from '@shared/GameEngine';
import { GameRenderer } from './Renderer';
import { InputManager } from './InputManager';

export type DummyBehavior = 'idle' | 'walk' | 'follow';

export interface TrainingDebugStats {
  fps: number;
  playerX: number;
  playerY: number;
  playerVx: number;
  playerVy: number;
  playerDamage: number;
  playerHp: number;
  isGrounded: boolean;
  isAttacking: boolean;
  attackType: string | null;
  abilityCd: number;
  ultimateCd: number;
  hitStun: number;
  dummyX: number;
  dummyY: number;
  dummyDamage: number;
  dummyHp: number;
}

export class TrainingEngine {
  private renderer: GameRenderer;
  private inputManager: InputManager;
  private simEngine: GameEngine;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private localPlayerId = 'player_local';
  private dummyPlayerId = 'dummy';
  private dummyBehavior: DummyBehavior = 'idle';
  private dummyWalkDir: Direction = Direction.RIGHT;
  private dummySeq: number = 0;

  // Performance / FPS tracking
  private frameCount: number = 0;
  private lastFpsTime: number = performance.now();
  private currentFps: number = 60;

  // Callbacks
  public onStateUpdate?: (state: GameState) => void;
  public onDebugUpdate?: (stats: TrainingDebugStats) => void;

  constructor(
    canvas: HTMLCanvasElement,
    playerCharacter: CharacterType,
    playerNickname: string = 'Warrior',
    dummyCharacter: CharacterType = CharacterType.FIGHTER
  ) {
    this.renderer = new GameRenderer(canvas);
    this.renderer.setLocalPlayerId(this.localPlayerId);
    this.inputManager = new InputManager();

    // Create 100% local simulation using the shared authoritative GameEngine
    this.simEngine = new GameEngine(
      [
        { id: this.localPlayerId, nickname: playerNickname, character: playerCharacter },
        { id: this.dummyPlayerId, nickname: 'Training Dummy', character: dummyCharacter },
      ],
      'training'
    );

    // Initial setup: place dummy on the right side of the main platform
    this.resetPositions();

    // Route hit effects from simulation to renderer
    this.simEngine.onHit = (effect: HitEffect) => {
      this.renderer.addHitEffect(effect);
    };
  }

  public setDummyBehavior(behavior: DummyBehavior): void {
    this.dummyBehavior = behavior;
  }

  public getDummyBehavior(): DummyBehavior {
    return this.dummyBehavior;
  }

  public resetPositions(): void {
    const spawns = new Map<string, { x: number; y: number }>([
      [this.localPlayerId, { x: 380, y: 480 }],
      [this.dummyPlayerId, { x: 720, y: 480 }],
    ]);
    this.simEngine.reset(spawns);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.inputManager.attach();
    this.lastFpsTime = performance.now();
    this.frameCount = 0;
    this.loop();
  }

  public stop(): void {
    this.isRunning = false;
    this.inputManager.detach();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public destroy(): void {
    this.stop();
    this.renderer.destroy();
  }

  private loop = (): void => {
    if (!this.isRunning) return;

    // 1. Calculate FPS
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
      this.frameCount = 0;
      this.lastFpsTime = now;
    }

    // 2. Fetch Player Input
    const playerInput = this.inputManager.getInput();

    // 3. Compute Dummy Input based on current behavior
    const dummyInput = this.computeDummyInput();

    // 4. Step local game simulation
    const inputs = new Map<string, PlayerInput>([
      [this.localPlayerId, playerInput],
      [this.dummyPlayerId, dummyInput],
    ]);
    this.simEngine.update(inputs);

    // 5. Query state & hit effects
    const state = this.simEngine.getState();
    const hitEffects = this.simEngine.getHitEffects();
    for (const effect of hitEffects) {
      this.renderer.addHitEffect(effect);
    }

    // 6. Render state onto canvas
    this.renderer.render(state);

    // 7. Update UI callbacks
    if (this.onStateUpdate) {
      this.onStateUpdate(state);
    }

    if (this.onDebugUpdate) {
      const p = this.simEngine.getPlayer(this.localPlayerId);
      const d = this.simEngine.getPlayer(this.dummyPlayerId);
      if (p && d) {
        this.onDebugUpdate({
          fps: this.currentFps,
          playerX: Math.round(p.x),
          playerY: Math.round(p.y),
          playerVx: Math.round(p.vx * 10) / 10,
          playerVy: Math.round(p.vy * 10) / 10,
          playerDamage: p.damagePercent,
          playerHp: p.hp,
          isGrounded: p.isGrounded,
          isAttacking: p.isAttacking,
          attackType: p.attackType,
          abilityCd: Math.ceil(p.abilityCooldownTimer / 60),
          ultimateCd: Math.ceil(p.ultimateCooldownTimer / 60),
          hitStun: p.hitStunTimer,
          dummyX: Math.round(d.x),
          dummyY: Math.round(d.y),
          dummyDamage: d.damagePercent,
          dummyHp: d.hp,
        });
      }
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private computeDummyInput(): PlayerInput {
    this.dummySeq++;
    const dummy = this.simEngine.getPlayer(this.dummyPlayerId);
    const player = this.simEngine.getPlayer(this.localPlayerId);

    const baseInput: PlayerInput = {
      left: false,
      right: false,
      jump: false,
      attack: false,
      ability: false,
      ultimate: false,
      sequence: this.dummySeq,
    };

    if (!dummy || !dummy.isAlive || dummy.hitStunTimer > 0) {
      return baseInput;
    }

    if (this.dummyBehavior === 'idle') {
      return baseInput;
    }

    if (this.dummyBehavior === 'walk') {
      // Patrol on main platform (x: 250 to 850)
      if (dummy.x <= 280) {
        this.dummyWalkDir = Direction.RIGHT;
      } else if (dummy.x >= 820) {
        this.dummyWalkDir = Direction.LEFT;
      }

      baseInput.left = this.dummyWalkDir === Direction.LEFT;
      baseInput.right = this.dummyWalkDir === Direction.RIGHT;
      return baseInput;
    }

    if (this.dummyBehavior === 'follow' && player && player.isAlive) {
      const dx = player.x - dummy.x;
      if (Math.abs(dx) > 60) {
        baseInput.left = dx < 0;
        baseInput.right = dx > 0;
      }
      // Jump if player is higher and dummy is grounded
      if (player.y < dummy.y - 70 && dummy.isGrounded && Math.abs(dx) < 150) {
        baseInput.jump = true;
      }
      return baseInput;
    }

    return baseInput;
  }

  public getPlayerId(): string {
    return this.localPlayerId;
  }

  public getDummyId(): string {
    return this.dummyPlayerId;
  }
}
