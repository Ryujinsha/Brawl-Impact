// ============================================================
// Brawl Impact - Medieval Tournament Room Waiting Chamber
// Completely separated from Character Selection
// Features: Prominent Room Seal, Tournament Cards, Host Controls
// ============================================================

import { useState } from 'react';
import { RoomState, CharacterType } from '@shared/types';
import { socketClient } from '../network/SocketClient';
import { GAME_CONFIG, CHARACTER_COLORS } from '@shared/gameConfig';
import { CHARACTER_PROFILES } from './CharacterSelectScreen';

interface RoomLobbyProps {
  roomState: RoomState;
  localPlayerId: string;
  onLeave: () => void;
  onChangeCharacter?: () => void;
}

const CHAR_ICONS: Record<CharacterType, string> = {
  [CharacterType.KNIGHT]: '⚔️',
  [CharacterType.MAGE]: '🔮',
  [CharacterType.ASSASSIN]: '🗡️',
  [CharacterType.FIGHTER]: '👊',
};

export function RoomLobby({
  roomState,
  localPlayerId,
  onLeave,
  onChangeCharacter,
}: RoomLobbyProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  const is1v1 = roomState.mode === '1v1' || roomState.maxPlayers === 2;
  const isHost = roomState.hostId === localPlayerId;
  const localPlayer = roomState.players.find((p) => p.id === localPlayerId);

  // Ready state rules
  const nonHostPlayers = roomState.players.filter((p) => !p.isHost);
  const allNonHostsReady =
    nonHostPlayers.length > 0 && nonHostPlayers.every((p) => p.isReady);
  const canStart1v1 = isHost && roomState.players.length === 2 && allNonHostsReady;
  const canStartFfa = isHost && roomState.players.length >= GAME_CONFIG.MIN_PLAYERS;
  const canStart = is1v1 ? canStart1v1 : canStartFfa;

  const emptySlots = Math.max(0, roomState.maxPlayers - roomState.players.length);

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
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Determine current match readiness status text
  const getStatusMessage = () => {
    if (is1v1) {
      if (roomState.players.length < 2) return 'AWAITING OPPONENT';
      if (allNonHostsReady) return 'BOTH WARRIORS READY';
      return 'OPPONENT CONNECTED';
    } else {
      if (roomState.players.length < GAME_CONFIG.MIN_PLAYERS) {
        return `AWAITING WARRIORS (${roomState.players.length}/${roomState.maxPlayers})`;
      }
      if (allNonHostsReady) return 'ALL WARRIORS READY';
      return 'WARRIORS PREPARING';
    }
  };

  const statusText = getStatusMessage();

  return (
    <div className="room-lobby-medieval screen-fade-in">
      <div className="room-ambient-overlay" />

      {/* Main Waiting Chamber Card */}
      <div className="room-chamber-container">
        {/* ======================================================== */}
        {/* HEADER: Tournament Mode Title & Prominent Room Code Seal */}
        {/* ======================================================== */}
        <header className="room-chamber-header">
          <div className="room-crown-emblem">👑</div>
          <h1 className="medieval-game-title" style={{ fontSize: 44, margin: '4px 0' }}>
            BRAWL IMPACT
          </h1>
          <h2 className="room-mode-subtitle">
            {is1v1 ? '⚔ 1V1 TOURNAMENT ARENA ⚔' : '🛡 WAR CHAMBER (FREE FOR ALL) 🛡'}
          </h2>

          {/* Prominent Engraved Room Seal Cartouche */}
          <div className="room-seal-cartouche">
            <div className="seal-label">TOURNAMENT ROOM SEAL</div>
            <div className="seal-code-row">
              <span className="seal-code-text">{roomState.code}</span>
              <button
                type="button"
                className={`medieval-btn seal-copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopyCode}
                title="Copy Room Seal to Clipboard"
              >
                {copied ? '✓ COPIED!' : '📋 COPY'}
              </button>
            </div>
            <p className="seal-instruction">
              Share this seal with thy rival to summon them into the duel
            </p>
          </div>

          {/* Status Banner */}
          <div
            className={`room-status-banner ${
              canStart ? 'status-ready' : 'status-waiting'
            }`}
          >
            <span className="status-gem">◈</span>
            <span className="status-text">{statusText}</span>
            <span className="status-gem">◈</span>
          </div>
        </header>

        {/* ======================================================== */}
        {/* TOURNAMENT PARTICIPANTS ARENA                           */}
        {/* ======================================================== */}
        <main className="room-participants-stage">
          {/* 1v1 Dedicated VS Layout */}
          {is1v1 ? (
            <div className="duel-tournament-roster">
              {/* Warrior 1 (Host) */}
              {roomState.players[0] ? (
                (() => {
                  const p = roomState.players[0];
                  const prof = CHARACTER_PROFILES[p.character];
                  const isSelf = p.id === localPlayerId;
                  const cColor = CHARACTER_COLORS[p.character];

                  return (
                    <div
                      className={`warrior-tournament-card ${isSelf ? 'is-self' : ''}`}
                      style={{ borderColor: cColor.accent }}
                    >
                      <div className="card-metal-corner top-left" />
                      <div className="card-metal-corner top-right" />
                      <div className="card-metal-corner bottom-left" />
                      <div className="card-metal-corner bottom-right" />

                      <div className="warrior-card-top-tag">
                        <span className="tag-pill tag-host">HOST</span>
                        {isSelf && <span className="tag-pill tag-you">(YOU)</span>}
                      </div>

                      {/* Character Avatar/Sprite */}
                      <div
                        className="warrior-portrait-circle"
                        style={{ borderColor: cColor.accent }}
                      >
                        {prof.image ? (
                          <img
                            src={prof.image}
                            alt={prof.name}
                            className="warrior-portrait-img"
                            width={70}
                            height={70}
                          />
                        ) : (
                          <span className="warrior-portrait-emoji">
                            {CHAR_ICONS[p.character]}
                          </span>
                        )}
                      </div>

                      <div className="warrior-name-text">{p.nickname}</div>
                      <div className="warrior-char-role">
                        {prof.name} • {prof.role}
                      </div>

                      <div className="warrior-ready-ribbon ready">
                        ⚔ READY FOR BATTLE ⚔
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="warrior-tournament-card is-empty">
                  <span className="empty-slot-icon">⚔️</span>
                  <div className="warrior-name-text">Awaiting Host...</div>
                </div>
              )}

              {/* Ornate VS Metallic Emblem */}
              <div className="duel-vs-emblem-center">
                <div className="vs-rays" />
                <div className="vs-circle">
                  <span>VS</span>
                </div>
                <div className="vs-ribbon">HONOR DUEL</div>
              </div>

              {/* Warrior 2 (Challenger) */}
              {roomState.players[1] ? (
                (() => {
                  const p = roomState.players[1];
                  const prof = CHARACTER_PROFILES[p.character];
                  const isSelf = p.id === localPlayerId;
                  const isReady = p.isReady;
                  const cColor = CHARACTER_COLORS[p.character];

                  return (
                    <div
                      className={`warrior-tournament-card ${isSelf ? 'is-self' : ''} ${
                        isReady ? 'is-ready' : ''
                      }`}
                      style={{ borderColor: cColor.accent }}
                    >
                      <div className="card-metal-corner top-left" />
                      <div className="card-metal-corner top-right" />
                      <div className="card-metal-corner bottom-left" />
                      <div className="card-metal-corner bottom-right" />

                      <div className="warrior-card-top-tag">
                        <span className="tag-pill tag-challenger">CHALLENGER</span>
                        {isSelf && <span className="tag-pill tag-you">(YOU)</span>}
                      </div>

                      <div
                        className="warrior-portrait-circle"
                        style={{ borderColor: cColor.accent }}
                      >
                        {prof.image ? (
                          <img
                            src={prof.image}
                            alt={prof.name}
                            className="warrior-portrait-img"
                            width={70}
                            height={70}
                          />
                        ) : (
                          <span className="warrior-portrait-emoji">
                            {CHAR_ICONS[p.character]}
                          </span>
                        )}
                      </div>

                      <div className="warrior-name-text">{p.nickname}</div>
                      <div className="warrior-char-role">
                        {prof.name} • {prof.role}
                      </div>

                      <div
                        className={`warrior-ready-ribbon ${
                          isReady ? 'ready' : 'waiting'
                        }`}
                      >
                        {isReady ? '⚔ READY FOR BATTLE ⚔' : '⏳ PREPARING...'}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="warrior-tournament-card is-empty">
                  <div className="card-metal-corner top-left" />
                  <div className="card-metal-corner top-right" />
                  <div className="card-metal-corner bottom-left" />
                  <div className="card-metal-corner bottom-right" />

                  <span className="empty-slot-icon pulse-flicker">🛡️</span>
                  <div className="warrior-name-text">Awaiting Challenger...</div>
                  <p className="empty-slot-subtext">
                    Waiting for another warrior to enter with seal {roomState.code}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Multi-Warrior FFA Layout (2-4 slots) */
            <div className="ffa-tournament-grid">
              {roomState.players.map((p) => {
                const prof = CHARACTER_PROFILES[p.character];
                const isSelf = p.id === localPlayerId;
                const cColor = CHARACTER_COLORS[p.character];

                return (
                  <div
                    key={p.id}
                    className={`warrior-tournament-card ${isSelf ? 'is-self' : ''}`}
                    style={{ borderColor: cColor.accent }}
                  >
                    <div className="card-metal-corner top-left" />
                    <div className="card-metal-corner top-right" />
                    <div className="card-metal-corner bottom-left" />
                    <div className="card-metal-corner bottom-right" />

                    <div className="warrior-card-top-tag">
                      {p.isHost && <span className="tag-pill tag-host">HOST</span>}
                      {isSelf && <span className="tag-pill tag-you">YOU</span>}
                    </div>

                    <div
                      className="warrior-portrait-circle"
                      style={{ borderColor: cColor.accent }}
                    >
                      {prof.image ? (
                        <img
                          src={prof.image}
                          alt={prof.name}
                          className="warrior-portrait-img"
                          width={70}
                          height={70}
                        />
                      ) : (
                        <span className="warrior-portrait-emoji">
                          {CHAR_ICONS[p.character]}
                        </span>
                      )}
                    </div>

                    <div className="warrior-name-text">{p.nickname}</div>
                    <div className="warrior-char-role">{prof.name}</div>

                    <div
                      className={`warrior-ready-ribbon ${
                        p.isHost || p.isReady ? 'ready' : 'waiting'
                      }`}
                    >
                      {p.isHost ? 'HOST' : p.isReady ? 'READY' : 'PREPARING...'}
                    </div>
                  </div>
                );
              })}

              {/* Empty placeholder cards */}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <div key={`empty-${i}`} className="warrior-tournament-card is-empty">
                  <div className="card-metal-corner top-left" />
                  <div className="card-metal-corner top-right" />
                  <div className="card-metal-corner bottom-left" />
                  <div className="card-metal-corner bottom-right" />

                  <span className="empty-slot-icon">🛡️</span>
                  <div className="warrior-name-text" style={{ fontSize: 16 }}>
                    Awaiting Warrior...
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* ======================================================== */}
        {/* ROOM ACTION CONTROLS                                     */}
        {/* ======================================================== */}
        <footer className="room-chamber-footer">
          <div className="room-footer-left">
            <button
              type="button"
              className="medieval-btn medieval-btn-danger"
              onClick={handleLeave}
            >
              <span className="btn-icon">◀</span>
              <span className="btn-text">RETREAT</span>
            </button>

            {onChangeCharacter && (
              <button
                type="button"
                className="medieval-btn medieval-btn-secondary"
                onClick={onChangeCharacter}
                title="Return to champion roster to choose another fighter"
              >
                <span className="btn-icon">⚔</span>
                <span className="btn-text">CHANGE CHAMPION</span>
              </button>
            )}
          </div>

          <div className="room-footer-right">
            {/* Non-Host Ready Toggle Button */}
            {!isHost && (
              <button
                type="button"
                className={`medieval-btn ${
                  localPlayer?.isReady ? 'medieval-btn-secondary' : 'medieval-btn-gold'
                }`}
                onClick={handleReady}
                disabled={localPlayer?.isReady}
              >
                <span className="btn-icon">
                  {localPlayer?.isReady ? '✓' : '⚔'}
                </span>
                <span className="btn-text">
                  {localPlayer?.isReady
                    ? 'WAITING FOR HOST...'
                    : 'READY FOR BATTLE'}
                </span>
              </button>
            )}

            {/* Host Start Brawl Button */}
            {isHost && (
              <button
                type="button"
                className="medieval-btn medieval-btn-gold room-start-btn"
                onClick={handleStart}
                disabled={!canStart || isStarting}
              >
                <span className="btn-icon">⚔</span>
                <span className="btn-text">
                  {isStarting
                    ? 'SUMMONING ARENA...'
                    : canStart
                    ? 'START BRAWL'
                    : is1v1
                    ? roomState.players.length < 2
                      ? 'AWAITING OPPONENT...'
                      : 'WAITING FOR READY...'
                    : `NEED ${GAME_CONFIG.MIN_PLAYERS}+ WARRIORS`}
                </span>
                <span className="btn-icon">⚔</span>
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
