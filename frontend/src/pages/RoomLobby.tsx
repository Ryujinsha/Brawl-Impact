// ============================================================
// Brawl Impact - Room Lobby Page
// Supports both dedicated 1v1 Duel layout and classic 2-4 FFA War Chamber
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
  const is1v1 = roomState.mode === '1v1' || roomState.maxPlayers === 2;
  const isHost = roomState.hostId === localPlayerId;
  const localPlayer = roomState.players.find((p) => p.id === localPlayerId);

  // In 1v1, require exactly 2 players and non-host ready
  const nonHostPlayers = roomState.players.filter((p) => !p.isHost);
  const allNonHostsReady = nonHostPlayers.length > 0 && nonHostPlayers.every((p) => p.isReady);
  const canStart1v1 = isHost && roomState.players.length === 2 && allNonHostsReady;
  const canStartFfa = isHost && roomState.players.length >= GAME_CONFIG.MIN_PLAYERS;
  const canStart = is1v1 ? canStart1v1 : canStartFfa;

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
    <div className={`room-lobby ${is1v1 ? 'duel-lobby' : ''}`}>
      {/* Header */}
      <div className="room-header fade-in-up">
        <h1 style={{ fontSize: 28 }}>
          {is1v1 ? '⚔ BRAWL IMPACT 1V1 DUEL ⚔' : '⚔ War Chamber ⚔'}
        </h1>
        <div className="room-code-display">
          <div className="room-code">{roomState.code}</div>
          <button className="btn btn-secondary btn-sm" onClick={handleCopyCode}>
            Copy
          </button>
        </div>
        <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 14 }}>
          {is1v1 ? 'Share this seal with thy rival challenger' : 'Share this seal with thy allies'}
        </p>
      </div>

      <div className="room-content fade-in-up">
        {/* 1v1 Specialized VS Arena Layout */}
        {is1v1 ? (
          <div className="duel-vs-arena">
            {/* Player 1 (Host) */}
            {roomState.players[0] ? (
              <div
                className={`duel-warrior-card ${roomState.players[0].id === localPlayerId ? 'is-self' : ''}`}
                style={{ borderColor: CHAR_COLORS[roomState.players[0].character] }}
              >
                <div style={{ fontSize: 44, marginBottom: 8 }}>
                  {CHAR_ICONS[roomState.players[0].character]}
                </div>
                <h3 style={{ fontSize: 20 }}>{roomState.players[0].nickname}</h3>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                  {roomState.players[0].character}
                </div>
                <div className="duel-ready-tag ready">
                  {roomState.players[0].isHost ? 'HOST' : 'READY'}
                </div>
                {roomState.players[0].id === localPlayerId && (
                  <div style={{ fontSize: 12, color: 'var(--accent-gold)', marginTop: 6 }}>(You)</div>
                )}
              </div>
            ) : (
              <div className="duel-warrior-card is-empty">
                <h3>Awaiting Host...</h3>
              </div>
            )}

            {/* VS Badge */}
            <div className="duel-vs-badge">VS</div>

            {/* Player 2 (Challenger) */}
            {roomState.players[1] ? (
              <div
                className={`duel-warrior-card ${roomState.players[1].isReady ? 'is-ready' : ''} ${roomState.players[1].id === localPlayerId ? 'is-self' : ''}`}
                style={{ borderColor: CHAR_COLORS[roomState.players[1].character] }}
              >
                <div style={{ fontSize: 44, marginBottom: 8 }}>
                  {CHAR_ICONS[roomState.players[1].character]}
                </div>
                <h3 style={{ fontSize: 20 }}>{roomState.players[1].nickname}</h3>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                  {roomState.players[1].character}
                </div>
                <div className={`duel-ready-tag ${roomState.players[1].isReady ? 'ready' : 'waiting'}`}>
                  {roomState.players[1].isReady ? 'READY' : 'CHOOSING...'}
                </div>
                {roomState.players[1].id === localPlayerId && (
                  <div style={{ fontSize: 12, color: 'var(--accent-gold)', marginTop: 6 }}>(You)</div>
                )}
              </div>
            ) : (
              <div className="duel-warrior-card is-empty">
                <div style={{ fontSize: 40, opacity: 0.5, marginBottom: 8 }}>⚔️</div>
                <h3>Awaiting Challenger...</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Room Seal: {roomState.code}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Classic FFA Player List (2-4 players) */
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
        )}

        {/* Character Selection */}
        {localPlayer && (
          <div className="card" style={{ marginBottom: 24 }}>
            <CharacterSelect
              selected={localPlayer.character}
              onSelect={handleCharacterSelect}
              compact={false}
              title="⚜ Select Thy Warrior ⚜"
            />
          </div>
        )}

        {/* Room Actions */}
        <div className="room-actions">
          <button className="btn btn-danger" onClick={handleLeave}>
            Retreat
          </button>

          {!isHost && (
            <button
              className={`btn ${localPlayer?.isReady ? 'btn-secondary' : 'btn-primary'}`}
              onClick={handleReady}
              disabled={localPlayer?.isReady}
            >
              {localPlayer?.isReady ? '✓ Ready for Battle' : 'Ready for Battle'}
            </button>
          )}

          {isHost && (
            <button
              className="btn btn-gold btn-lg"
              onClick={handleStart}
              disabled={!canStart || isStarting}
            >
              {isStarting
                ? 'Summoning Arena...'
                : canStart
                ? is1v1
                  ? 'Begin 1v1 Duel!'
                  : 'Begin the Battle!'
                : is1v1
                ? roomState.players.length < 2
                  ? 'Awaiting Challenger...'
                  : 'Awaiting Challenger Ready...'
                : `Need ${GAME_CONFIG.MIN_PLAYERS}+ Warriors`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
