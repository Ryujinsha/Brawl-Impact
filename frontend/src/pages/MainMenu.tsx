// ============================================================
// Brawl Impact - Main Menu Page
// ============================================================

import { useState } from 'react';
import { CharacterType } from '@shared/types';
import { CharacterSelect } from '../components/CharacterSelect';
import { LeaderboardModal } from '../components/LeaderboardModal';
import { socketClient } from '../network/SocketClient';

interface MainMenuProps {
  onRoomCreated: () => void;
  onRoomJoined: () => void;
}

export function MainMenu({ onRoomCreated, onRoomJoined }: MainMenuProps) {
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [character, setCharacter] = useState<CharacterType>(CharacterType.KNIGHT);
  const [showJoin, setShowJoin] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const isValidNickname = nickname.trim().length >= 2;

  const handleCreate = () => {
    if (!isValidNickname) return;
    socketClient.createRoom(nickname.trim(), character);
    onRoomCreated();
  };

  const handleJoin = () => {
    if (!isValidNickname || roomCode.trim().length < 4) return;
    socketClient.joinRoom(roomCode.trim().toUpperCase(), nickname.trim(), character);
    onRoomJoined();
  };

  return (
    <div className="main-menu">
      <h1 className="game-title">BRAWL IMPACT</h1>
      <p className="game-subtitle">A Medieval Battle Arena</p>

      <div className="menu-card card fade-in-up">
        <h2>⚜ Choose Thy Name ⚜</h2>

        <input
          className="input"
          type="text"
          placeholder="Enter thy name, warrior..."
          value={nickname}
          onChange={(e) => setNickname(e.target.value.slice(0, 16))}
          maxLength={16}
          autoFocus
        />

        <CharacterSelect selected={character} onSelect={setCharacter} />

        <div className="menu-actions">
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={!isValidNickname}
          >
            Forge a Room
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowJoin(!showJoin)}
            disabled={!isValidNickname}
          >
            Join a Room
          </button>
          <button
            className="btn btn-gold"
            onClick={() => setShowLeaderboard(true)}
            style={{ width: '100%', marginTop: 8 }}
          >
            ⚜ Hall of Fame ⚜
          </button>
        </div>

        {showJoin && (
          <div className="join-room-row fade-in-up">
            <input
              className="input"
              type="text"
              placeholder="ROOM CODE"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
              maxLength={6}
            />
            <button
              className="btn btn-gold btn-sm"
              onClick={handleJoin}
              disabled={roomCode.trim().length < 4}
            >
              JOIN
            </button>
          </div>
        )}
      </div>

      {showLeaderboard && (
        <LeaderboardModal onClose={() => setShowLeaderboard(false)} />
      )}
    </div>
  );
}
