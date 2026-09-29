// ============================================================
// Brawl Impact - Main Application
// State machine managing game flow:
// MENU ──┬──> TRAINING (Local single-player)
//        └──> ROOM (1v1 Duel or FFA) ──> PLAYING ──> RESULT
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { GamePhase, RoomState, GameState, GameResult, CharacterType, GameMode } from '@shared/types';
import { socketClient } from './network/SocketClient';
import { MainMenu } from './pages/MainMenu';
import { RoomLobby } from './pages/RoomLobby';
import { GameArena } from './pages/GameArena';
import { ResultScreen } from './pages/ResultScreen';
import { TrainingArena } from './pages/TrainingArena';

type AppPhase = 'CONNECTING' | 'MENU' | 'TRAINING' | 'ROOM' | 'PLAYING' | 'RESULT';

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('CONNECTING');
  const [localPlayerId, setLocalPlayerId] = useState<string>('');
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Training mode parameters
  const [trainingChar, setTrainingChar] = useState<CharacterType>(CharacterType.KNIGHT);
  const [trainingNick, setTrainingNick] = useState<string>('Warrior');

  // Connect to game server
  useEffect(() => {
    socketClient.connect();

    const unsubConnect = socketClient.onConnected((id) => {
      setLocalPlayerId(id);
      setIsConnected(true);
      setPhase((prev) => (prev === 'CONNECTING' ? 'MENU' : prev));
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
    let gameOverTimeout: ReturnType<typeof setTimeout> | null = null;
    const unsubGameOver = socketClient.onGameOver((result) => {
      setGameResult(result);
      // Allow players to celebrate the victory banner in the arena before showing result summary
      gameOverTimeout = setTimeout(() => {
        setPhase('RESULT');
      }, 2500);
    });

    // Fallback: If server is offline or slow, don't trap player on CONNECTING screen; allow offline access
    const connectTimer = setTimeout(() => {
      setPhase((prev) => (prev === 'CONNECTING' ? 'MENU' : prev));
    }, 1500);

    return () => {
      clearTimeout(connectTimer);
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

  // --- Handlers ---

  const handleRoomCreated = useCallback((_mode: GameMode) => {
    // Handled by socket onRoomCreated
  }, []);

  const handleRoomJoined = useCallback(() => {
    // Handled by socket onRoomState
  }, []);

  const handleStartTraining = useCallback((character: CharacterType, nickname: string) => {
    setTrainingChar(character);
    setTrainingNick(nickname);
    setPhase('TRAINING');
  }, []);

  const handleExitTraining = useCallback(() => {
    setPhase('MENU');
  }, []);

  const handleLeaveRoom = useCallback(() => {
    setRoomState(null);
    setPhase('MENU');
  }, []);

  const handleReturnToLobby = useCallback(() => {
    setGameResult(null);
    setGameState(null);
    // Transition to ROOM will occur via server room:state broadcast
  }, []);

  const handleReturnToMainMenu = useCallback(() => {
    setGameResult(null);
    setGameState(null);
    setRoomState(null);
    setPhase('MENU');
  }, []);

  return (
    <>
      {/* Error Toast */}
      {error && <div className="error-toast">{error}</div>}

      {/* Connection Status indicator */}
      <div className="connection-status">
        <div className={`connection-dot ${isConnected ? 'connected' : 'disconnected'}`} />
        <span>{isConnected ? 'Realm Connected' : 'Local / Disconnected'}</span>
      </div>

      {/* Phase 1: Connecting Screen */}
      {phase === 'CONNECTING' && (
        <div className="main-menu">
          <h1 className="game-title">BRAWL IMPACT</h1>
          <p className="game-subtitle" style={{ marginTop: 16 }}>Summoning the realm...</p>
        </div>
      )}

      {/* Phase 2: Main Menu */}
      {phase === 'MENU' && (
        <MainMenu
          onRoomCreated={handleRoomCreated}
          onRoomJoined={handleRoomJoined}
          onStartTraining={handleStartTraining}
        />
      )}

      {/* Phase 3: Local Offline Training Mode */}
      {phase === 'TRAINING' && (
        <TrainingArena
          playerCharacter={trainingChar}
          playerNickname={trainingNick}
          onExit={handleExitTraining}
        />
      )}

      {/* Phase 4: Room Lobby (1v1 Duel or FFA) */}
      {phase === 'ROOM' && roomState && (
        <RoomLobby
          roomState={roomState}
          localPlayerId={localPlayerId}
          onLeave={handleLeaveRoom}
        />
      )}

      {/* Phase 5: Multiplayer Match (1v1 or FFA) */}
      {phase === 'PLAYING' && gameState && (
        <GameArena
          localPlayerId={localPlayerId}
          initialState={gameState}
        />
      )}

      {/* Phase 6: Result Screen */}
      {phase === 'RESULT' && gameResult && (
        <ResultScreen
          result={gameResult}
          localPlayerId={localPlayerId}
          onReturnToLobby={handleReturnToLobby}
          onReturnToMainMenu={handleReturnToMainMenu}
        />
      )}
    </>
  );
}
