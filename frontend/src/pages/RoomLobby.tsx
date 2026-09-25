// ============================================================
// Brawl Impact - Room Lobby Page
// ============================================================

import { useState } from 'react';
import { RoomState, CharacterType } from '@shared/types';
import { CharacterSelect } from '../components/CharacterSelect';
import { socketClient } from '../network/SocketClient';
import { GAME_CONFIG } from '@shared/gameConfig';

interface RoomLobbyProps {
  roomState: RoomState;
  localPlayerId: string;
  onLeave: () => void;
}

const CHAR_ICONS: Record<CharacterType, string> = {
  [CharacterType.KNIGHT]: '⚔️',
  [CharacterType.MAGE]: '🔮',
  [CharacterType.ASSASSIN]: '🗡️',
  [CharacterType.FIGHTER]: '👊',
};

const CHAR_COLORS: Record<CharacterType, string> = {
  [CharacterType.KNIGHT]: '#4A90D9',
  [CharacterType.MAGE]: '#9B59B6',
  [CharacterType.ASSASSIN]: '#5D6D7E',
  [CharacterType.FIGHTER]: '#E74C3C',
};

export function RoomLobby({ roomState, localPlayerId, onLeave }: RoomLobbyProps) {
  const [isStarting, setIsStarting] = useState(false);
  const isHost = roomState.hostId === localPlayerId;
  const localPlayer = roomState.players.find((p) => p.id === localPlayerId);
  const canStart = isHost && roomState.players.length >= GAME_CONFIG.MIN_PLAYERS;
  const emptySlots = roomState.maxPlayers - roomState.players.length;

  const handleCharacterSelect = (character: CharacterType) => {
    socketClient.selectCharacter(character);
  };

  const handleReady = () => {
    socketClient.setReady();
  };

  const handleStart = () => {
    if (isStarting) return;
    setIsStarting(true);
    socketClient.startMatch();
  };

  const handleLeave = () => {
    socketClient.leaveRoom();
    onLeave();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomState.code);
  };

  return (
    <div className="room-lobby">
      <div className="room-header fade-in-up">
        <h1 style={{ fontSize: 28 }}>⚔ War Chamber ⚔</h1>
        <div className="room-code-display">
          <div className="room-code">{roomState.code}</div>
          <button className="btn btn-secondary btn-sm" onClick={handleCopyCode}>
            Copy
          </button>
        </div>
        <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 14 }}>
          Share this seal with thy allies
        </p>
      </div>

      <div className="room-content fade-in-up">
        {/* Player List */}
        <div className="player-list">
          <h3>Players ({roomState.players.length}/{roomState.maxPlayers})</h3>
          {roomState.players.map((player) => (
            <div
              key={player.id}
              className={`player-item ${player.id === localPlayerId ? 'is-self' : ''}`}
            >
              <div
                className="player-char-badge"
                style={{ background: CHAR_COLORS[player.character] }}
              >
                {CHAR_ICONS[player.character]}
              </div>
              <div className="player-info">
                <div className="player-name">{player.nickname}</div>
                <div className="player-badges">
                  {player.isHost && <span className="badge badge-host">Host</span>}
                  {player.id === localPlayerId && <span className="badge badge-you">You</span>}
                  {player.isReady && <span className="badge badge-ready">Ready</span>}
                </div>
              </div>
            </div>
          ))}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div key={`empty-${i}`} className="empty-slot">
              Awaiting a warrior...
            </div>
          ))}
        </div>

        {/* Character Selection */}
        {localPlayer && (
          <div className="card" style={{ marginBottom: 24 }}>
            <CharacterSelect
              selected={localPlayer.character}
              onSelect={handleCharacterSelect}
            />
          </div>
        )}

        {/* Actions */}
        <div className="room-actions">
          <button className="btn btn-danger" onClick={handleLeave}>
            Retreat
          </button>
          {!isHost && !localPlayer?.isReady && (
            <button className="btn btn-primary" onClick={handleReady}>
              Ready for Battle
            </button>
          )}
          {isHost && (
            <button
              className="btn btn-gold btn-lg"
              onClick={handleStart}
              disabled={!canStart || isStarting}
            >
              {isStarting ? 'Summoning Arena...' : canStart ? 'Begin the Battle!' : `Need ${GAME_CONFIG.MIN_PLAYERS}+ Warriors`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
