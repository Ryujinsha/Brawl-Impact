// ============================================================
// Brawl Impact - Main Application
// State machine managing game flow: LOBBY → ROOM → PLAYING → RESULT
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { GamePhase, RoomState, GameState, GameResult } from '@shared/types';
import { socketClient } from './network/SocketClient';
import { MainMenu } from './pages/MainMenu';
import { RoomLobby } from './pages/RoomLobby';
import { GameArena } from './pages/GameArena';
import { ResultScreen } from './pages/ResultScreen';

type AppPhase = 'CONNECTING' | 'LOBBY' | 'ROOM' | 'PLAYING' | 'RESULT';

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('CONNECTING');
  const [localPlayerId, setLocalPlayerId] = useState<string>('');
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // --- Connect to server ---
  useEffect(() => {
    socketClient.connect();

    const unsubConnect = socketClient.onConnected((id) => {
      setLocalPlayerId(id);
      setIsConnected(true);
      setPhase('LOBBY');
    });

    const unsubDisconnect = socketClient.onDisconnected(() => {
      setIsConnected(false);
    });

    const unsubError = socketClient.onError((data) => {
      setError(data.message);
      setTimeout(() => setError(null), 3000);
    });

    // Room created
    const unsubRoomCreated = socketClient.onRoomCreated((state) => {
      setRoomState(state);
      setPhase('ROOM');
    });

    // Room state updates
    const unsubRoomState = socketClient.onRoomState((state) => {
      setRoomState(state);
      // If we're in the result phase and server sends room state, transition back
      if (state.phase === GamePhase.ROOM) {
        setPhase('ROOM');
      }
    });

    // Game start
    const unsubGameStart = socketClient.onGameStart((data) => {
      setGameState(data.state);
      setPhase('PLAYING');
    });

    // Game over
    let gameOverTimeout: any = null;
    const unsubGameOver = socketClient.onGameOver((result) => {
      setGameResult(result);
      // Allow players to celebrate the victory banner in the arena before showing ranking summary
      gameOverTimeout = setTimeout(() => {
        setPhase('RESULT');
      }, 2500);
    });

    return () => {
      if (gameOverTimeout) clearTimeout(gameOverTimeout);
      unsubConnect();
      unsubDisconnect();
      unsubError();
      unsubRoomCreated();
      unsubRoomState();
      unsubGameStart();
      unsubGameOver();
      socketClient.disconnect();
    };
  }, []);

  const handleRoomCreated = useCallback(() => {
    // Phase transition handled by socket event
  }, []);

  const handleRoomJoined = useCallback(() => {
    // Phase transition handled by socket event
  }, []);

  const handleLeaveRoom = useCallback(() => {
    setRoomState(null);
    setPhase('LOBBY');
  }, []);

  const handleReturnToLobby = useCallback(() => {
    setGameResult(null);
    setGameState(null);
    // Phase transition handled by socket event (room:state)
  }, []);

  return (
    <>
      {/* Error Toast */}
      {error && <div className="error-toast">{error}</div>}

      {/* Connection Status */}
      <div className="connection-status">
        <div className={`connection-dot ${isConnected ? 'connected' : 'disconnected'}`} />
        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>

      {/* Phase Rendering */}
      {phase === 'CONNECTING' && (
        <div className="main-menu">
          <h1 className="game-title">BRAWL IMPACT</h1>
          <p className="game-subtitle" style={{ marginTop: 16 }}>Summoning the realm...</p>
        </div>
      )}

      {phase === 'LOBBY' && (
        <MainMenu
          onRoomCreated={handleRoomCreated}
          onRoomJoined={handleRoomJoined}
        />
      )}

      {phase === 'ROOM' && roomState && (
        <RoomLobby
          roomState={roomState}
          localPlayerId={localPlayerId}
          onLeave={handleLeaveRoom}
        />
      )}

      {phase === 'PLAYING' && gameState && (
        <GameArena
          localPlayerId={localPlayerId}
          initialState={gameState}
        />
      )}

      {phase === 'RESULT' && gameResult && (
        <ResultScreen
          result={gameResult}
          localPlayerId={localPlayerId}
          onReturnToLobby={handleReturnToLobby}
        />
      )}
    </>
  );
}
