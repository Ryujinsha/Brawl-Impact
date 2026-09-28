// ============================================================
// Brawl Impact - Game Arena Page
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { GameState } from '@shared/types';
import { ClientGameEngine } from '../game/ClientGameEngine';
import { GameHUD } from '../components/GameHUD';

interface GameArenaProps {
  localPlayerId: string;
  initialState: GameState;
}

export function GameArena({ localPlayerId, initialState }: GameArenaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ClientGameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState>(initialState);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new ClientGameEngine(canvasRef.current, localPlayerId);
    engineRef.current = engine;

    engine.onGameStateChange = (state) => {
      setGameState(state);
    };

    engine.start();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [localPlayerId]);

  return (
    <div className="game-container">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        tabIndex={0}
      />
      <GameHUD gameState={gameState} localPlayerId={localPlayerId} />
    </div>
  );
}
