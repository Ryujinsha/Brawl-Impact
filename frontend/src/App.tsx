// ============================================================
// Brawl Impact - Main Application
// State machine managing game flow:
// MENU ──> CHARACTER_SELECT ──┬──> TRAINING (Local single-player)
//                             └──> ROOM (1v1 Duel or FFA) ──> PLAYING ──> RESULT
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { GamePhase, RoomState, GameState, GameResult, CharacterType, GameMode } from '@shared/types';
import { socketClient } from './network/SocketClient';
import { MainMenu } from './pages/MainMenu';
import { CharacterSelectScreen } from './pages/CharacterSelectScreen';
import { RoomLobby } from './pages/RoomLobby';
import { GameArena } from './pages/GameArena';
import { ResultScreen } from './pages/ResultScreen';
import { TrainingArena } from './pages/TrainingArena';

type AppPhase = 'CONNECTING' | 'MENU' | 'CHARACTER_SELECT' | 'TRAINING' | 'ROOM' | 'PLAYING' | 'RESULT';

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('CONNECTING');
  const [localPlayerId, setLocalPlayerId] = useState<string>('');
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Selected mode and champion parameters
  const [selectedMode, setSelectedMode] = useState<GameMode | 'training'>('1v1');
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [joinRoomCode, setJoinRoomCode] = useState('');

  const [chosenCharacter, setChosenCharacter] = useState<CharacterType>(() => {
    const saved = localStorage.getItem('brawl_player_character') as CharacterType;
    return saved && Object.values(CharacterType).includes(saved) ? saved : CharacterType.KNIGHT;
  });

  const [chosenNickname, setChosenNickname] = useState<string>(() => {
    return localStorage.getItem('brawl_player_nickname') || 'Warrior';
  });

  // Training parameters
  const [trainingChar, setTrainingChar] = useState<CharacterType>(chosenCharacter);
  const [trainingNick, setTrainingNick] = useState<string>(chosenNickname);

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
      setTimeout(() => setError(null), 3500);
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

  // --- Navigation Handlers ---

  const handleSelectMode = useCallback((mode: GameMode | 'training', isJoining = false, roomCode = '') => {
    setSelectedMode(mode);
    setIsJoiningRoom(isJoining);
    setJoinRoomCode(roomCode);
    setPhase('CHARACTER_SELECT');
  }, []);

  const handleConfirmCharacter = useCallback((character: CharacterType, nickname: string, code?: string) => {
    setChosenCharacter(character);
    setChosenNickname(nickname);

    // If changing character while already inside a room
    if (roomState) {
      socketClient.selectCharacter(character);
      setPhase('ROOM');
      return;
    }

    if (selectedMode === 'training') {
      setTrainingChar(character);
      setTrainingNick(nickname);
      setPhase('TRAINING');
      return;
    }

    const targetCode = code || joinRoomCode;
    if (isJoiningRoom || targetCode) {
      socketClient.joinRoom(targetCode, nickname, character);
    } else {
      socketClient.createRoom(nickname, character, selectedMode as GameMode);
    }
  }, [selectedMode, isJoiningRoom, joinRoomCode, roomState]);

  const handleBackFromCharSelect = useCallback(() => {
    if (roomState) {
      setPhase('ROOM');
    } else {
      setPhase('MENU');
    }
  }, [roomState]);

  const handleChangeCharacterFromLobby = useCallback(() => {
    setPhase('CHARACTER_SELECT');
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
        <div className="main-menu-cinematic">
          <div className="main-menu-left-brand" style={{ margin: 'auto' }}>
            <h1 className="medieval-game-title">BRAWL IMPACT</h1>
            <p className="game-subtitle" style={{ marginTop: 16 }}>Summoning the realm...</p>
          </div>
        </div>
      )}

      {/* Phase 2: Main Menu */}
      {phase === 'MENU' && (
        <MainMenu onSelectMode={handleSelectMode} />
      )}

      {/* Phase 3: Dedicated Character Selection Screen */}
      {phase === 'CHARACTER_SELECT' && (
        <CharacterSelectScreen
          mode={selectedMode}
          initialCharacter={chosenCharacter}
          initialNickname={chosenNickname}
          isJoiningRoom={isJoiningRoom}
          joinRoomCode={joinRoomCode}
          onConfirm={handleConfirmCharacter}
          onBack={handleBackFromCharSelect}
        />
      )}

      {/* Phase 4: Local Offline Training Mode */}
      {phase === 'TRAINING' && (
        <TrainingArena
          playerCharacter={trainingChar}
          playerNickname={trainingNick}
          onExit={handleExitTraining}
        />
      )}

      {/* Phase 5: Room Lobby (1v1 Duel or FFA) */}
      {phase === 'ROOM' && roomState && (
        <RoomLobby
          roomState={roomState}
          localPlayerId={localPlayerId}
          onLeave={handleLeaveRoom}
          onChangeCharacter={handleChangeCharacterFromLobby}
        />
      )}

      {/* Phase 6: Multiplayer Match (1v1 or FFA) */}
      {phase === 'PLAYING' && gameState && (
        <GameArena
          localPlayerId={localPlayerId}
          initialState={gameState}
        />
      )}

      {/* Phase 7: Result Screen */}
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
