// ============================================================
// Brawl Impact - Training Mode Arena
// Purely local practice grounds with interactive dummy & debug panel
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { CharacterType, GameState } from '@shared/types';
import { TrainingEngine, DummyBehavior, TrainingDebugStats } from '../game/TrainingEngine';
import { GameHUD } from '../components/GameHUD';

interface TrainingArenaProps {
  playerCharacter: CharacterType;
  playerNickname?: string;
  onExit: () => void;
}

export function TrainingArena({
  playerCharacter,
  playerNickname = 'Warrior',
  onExit,
}: TrainingArenaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<TrainingEngine | null>(null);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [dummyBehavior, setDummyBehavior] = useState<DummyBehavior>('idle');
  const [showDebug, setShowDebug] = useState(false);
  const [debugStats, setDebugStats] = useState<TrainingDebugStats | null>(null);

  // Initialize Training Engine
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new TrainingEngine(
      canvasRef.current,
      playerCharacter,
      playerNickname,
      CharacterType.FIGHTER
    );
    engineRef.current = engine;

    engine.onStateUpdate = (state) => {
      setGameState(state);
    };

    engine.onDebugUpdate = (stats) => {
      setDebugStats(stats);
    };

    engine.start();

    // Keyboard shortcuts: 'R' to reset, 'F3' to toggle debug, 'Escape' to exit
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        engine.resetPositions();
      } else if (e.key === 'F3') {
        e.preventDefault();
        setShowDebug((prev) => !prev);
      } else if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      engine.destroy();
      engineRef.current = null;
    };
  }, [playerCharacter, playerNickname, onExit]);

  const handleReset = useCallback(() => {
    engineRef.current?.resetPositions();
  }, []);

  const handleBehaviorChange = (behavior: DummyBehavior) => {
    setDummyBehavior(behavior);
    engineRef.current?.setDummyBehavior(behavior);
  };

  return (
    <div className="game-container training-mode-container">
      <canvas ref={canvasRef} className="game-canvas" tabIndex={0} />

      {/* Right Side Hover Training Controls Menu */}
      <aside className="training-side-drawer" aria-label="Training Menu">
        <div className="drawer-handle">
          <span className="drawer-handle-icon">⚙</span>
          <span className="drawer-handle-text">MENU</span>
        </div>
        <div className="drawer-content">
          <div className="drawer-header">
            <h4 className="drawer-title">⚜ Training Controls</h4>
          </div>

          {/* Dummy Mode Selector */}
          <div className="drawer-section">
            <label className="drawer-label">Dummy Behavior</label>
            <div className="drawer-btn-group">
              <button
                type="button"
                className={`btn btn-sm ${dummyBehavior === 'idle' ? 'btn-active' : 'btn-secondary'}`}
                onClick={() => handleBehaviorChange('idle')}
                title="Dummy stands stationary"
              >
                Stand
              </button>
              <button
                type="button"
                className={`btn btn-sm ${dummyBehavior === 'walk' ? 'btn-active' : 'btn-secondary'}`}
                onClick={() => handleBehaviorChange('walk')}
                title="Dummy walks back and forth"
              >
                Patrol
              </button>
              <button
                type="button"
                className={`btn btn-sm ${dummyBehavior === 'follow' ? 'btn-active' : 'btn-secondary'}`}
                onClick={() => handleBehaviorChange('follow')}
                title="Dummy moves towards player"
              >
                Chase
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="drawer-section">
            <label className="drawer-label">Actions</label>
            <button
              type="button"
              className="btn btn-secondary btn-sm drawer-action-btn"
              onClick={handleReset}
              title="Reset positions [R]"
            >
              ⚔ Reset Positions [R]
            </button>
            <button
              type="button"
              className={`btn btn-sm drawer-action-btn ${showDebug ? 'btn-active' : 'btn-secondary'}`}
              onClick={() => setShowDebug((prev) => !prev)}
              title="Toggle Debug Telemetry [F3]"
            >
              📊 Debug Diagnostics [F3]
            </button>
          </div>

          {/* Return to Menu */}
          <div className="drawer-section drawer-footer">
            <button
              type="button"
              className="btn btn-danger btn-sm drawer-action-btn"
              onClick={onExit}
              title="Return to Main Menu [Esc]"
            >
              🚪 Return to Menu [Esc]
            </button>
          </div>
        </div>
      </aside>

      {/* Standard HUD */}
      {gameState && (
        <GameHUD gameState={gameState} localPlayerId={engineRef.current?.getPlayerId() || 'player_local'} />
      )}

      {/* Optional Debug Telemetry Panel */}
      {showDebug && debugStats && (
        <div className="training-debug-panel fade-in-up">
          <div className="debug-header">
            <h4>⚜ Telemetry Diagnostics ⚜</h4>
            <span className="debug-fps">{debugStats.fps} FPS</span>
          </div>

          <div className="debug-grid">
            <div className="debug-card">
              <strong className="debug-title">Warrior (Player)</strong>
              <div>Position: X: {debugStats.playerX}, Y: {debugStats.playerY}</div>
              <div>Velocity: Vx: {debugStats.playerVx}, Vy: {debugStats.playerVy}</div>
              <div>Vitality: {debugStats.playerHp} HP ({debugStats.playerDamage}%)</div>
              <div>Grounded: {debugStats.isGrounded ? 'YES' : 'NO'}</div>
              <div>Attacking: {debugStats.isAttacking ? (debugStats.attackType || 'YES') : 'IDLE'}</div>
              <div>Hit Stun: {debugStats.hitStun} frames</div>
              <div>Cooldowns: Ability {debugStats.abilityCd}s | Ult {debugStats.ultimateCd}s</div>
            </div>

            <div className="debug-card">
              <strong className="debug-title">Practice Sparring Dummy</strong>
              <div>Position: X: {debugStats.dummyX}, Y: {debugStats.dummyY}</div>
              <div>Vitality: {debugStats.dummyHp} HP ({debugStats.dummyDamage}%)</div>
              <div>Behavior: {dummyBehavior.toUpperCase()}</div>
              <div>State: Fully Responsive Knockback & Hitbox</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
