// ============================================================
// Brawl Impact - Client Game Engine
// Manages game loop, rendering, input, and network sync
// ============================================================

import { GameState, PlayerState, HitEffect, GamePhase } from '@shared/types';
import { GAME_CONFIG } from '@shared/gameConfig';
import { GameRenderer } from './Renderer';
import { InputManager } from './InputManager';
import { socketClient } from '../network/SocketClient';

export class ClientGameEngine {
  private renderer: GameRenderer;
  private inputManager: InputManager;
  private animationFrameId: number | null = null;
  private currentState: GameState | null = null;
  private previousState: GameState | null = null;
  private lastStateTime: number = 0;
  private interpolationAlpha: number = 0;
  private localPlayerId: string = '';
  private isRunning: boolean = false;

  // Callbacks for UI updates
  public onGameStateChange?: (state: GameState) => void;
  public onCountdown?: (seconds: number) => void;

  constructor(canvas: HTMLCanvasElement, localPlayerId: string) {
    this.renderer = new GameRenderer(canvas);
    this.inputManager = new InputManager();
    this.localPlayerId = localPlayerId;
    this.renderer.setLocalPlayerId(localPlayerId);
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.inputManager.attach();
    this.setupNetworkListeners();
    this.gameLoop();
  }

  stop(): void {
    this.isRunning = false;
    this.inputManager.detach();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private setupNetworkListeners(): void {
    socketClient.onGameState((data) => {
      this.previousState = this.currentState;
      this.currentState = data.state;
      this.lastStateTime = performance.now();

      // Process hit effects
      for (const effect of data.hitEffects) {
        this.renderer.addHitEffect(effect);
      }

      if (this.onGameStateChange) {
        this.onGameStateChange(data.state);
      }
    });

    socketClient.onPlayerHit((effect: HitEffect) => {
      this.renderer.addHitEffect(effect);
    });

    socketClient.onPlayerEliminated((data) => {
      if (this.currentState) {
        const player = this.currentState.players.find((p) => p.id === data.playerId);
        if (player) {
          this.renderer.addEliminationEffect(player.x, player.y);
        }
      }
    });

    socketClient.onCountdownTick((data) => {
      if (this.onCountdown) {
        this.onCountdown(data.seconds);
      }
    });

    socketClient.onGameOver((result) => {
      if (this.currentState) {
        this.currentState = {
          ...this.currentState,
          phase: GamePhase.GAME_OVER,
          winnerId: result.winnerId,
        };
        if (this.onGameStateChange) {
          this.onGameStateChange(this.currentState);
        }
      }
    });
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return;

    // Send input to server
    const input = this.inputManager.getInput();
    socketClient.sendInput(input);

    // Interpolate and render
    if (this.currentState) {
      const renderState = this.interpolateState();
      this.renderer.render(renderState);
    }

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private interpolateState(): GameState {
    if (!this.previousState || !this.currentState) {
      return this.currentState!;
    }

    const serverTickMs = 1000 / GAME_CONFIG.NETWORK_SEND_RATE;
    const elapsed = performance.now() - this.lastStateTime;
    this.interpolationAlpha = Math.min(elapsed / serverTickMs, 1);

    // Create interpolated state
    const interpolatedPlayers: PlayerState[] = this.currentState.players.map((current) => {
      const previous = this.previousState!.players.find((p) => p.id === current.id);
      if (!previous) return current;

      // Don't interpolate local player (use latest state for responsiveness)
      if (current.id === this.localPlayerId) return current;

      const alpha = this.interpolationAlpha;
      return {
        ...current,
        x: previous.x + (current.x - previous.x) * alpha,
        y: previous.y + (current.y - previous.y) * alpha,
      };
    });

    return {
      ...this.currentState,
      players: interpolatedPlayers,
    };
  }

  getCurrentState(): GameState | null {
    return this.currentState;
  }

  destroy(): void {
    this.stop();
    this.renderer.destroy();
  }
}
