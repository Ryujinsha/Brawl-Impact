// ============================================================
// Brawl Impact - Cinematic Medieval Main Menu
// Left: Grand Tournament Heraldic Crest & Metallic Title
// Right: Medieval Plaque Navigation Stack
// ============================================================

import { useState, useEffect } from 'react';
import { GameMode } from '@shared/types';
import { LeaderboardModal } from '../components/LeaderboardModal';
import { SettingsModal } from '../components/SettingsModal';

interface MainMenuProps {
  onSelectMode: (mode: GameMode | 'training', isJoining?: boolean, roomCode?: string) => void;
}

export function MainMenu({ onSelectMode }: MainMenuProps) {
  // Background customization state
  const [menuBg, setMenuBg] = useState(() => {
    return localStorage.getItem('brawl_menu_background') || '/assets/background/Background_menu.png';
  });

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinMode, setJoinMode] = useState<GameMode>('1v1');
  const [joinError, setJoinError] = useState<string | null>(null);

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Sync background updates from settings or storage
  useEffect(() => {
    const handleStorageChange = () => {
      const current = localStorage.getItem('brawl_menu_background') || '/assets/background/Background_menu.png';
      setMenuBg(current);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleOpenJoin = (mode: GameMode = '1v1') => {
    setJoinMode(mode);
    setJoinCode('');
    setJoinError(null);
    setShowJoinModal(true);
  };

  const handleConfirmJoin = () => {
    const cleanCode = joinCode.trim().toUpperCase();
    if (cleanCode.length < 4) {
      setJoinError('Tournament seal must be at least 4 characters');
      return;
    }
    setJoinError(null);
    setShowJoinModal(false);
    onSelectMode(joinMode, true, cleanCode);
  };

  return (
    <div
      className="main-menu-cinematic screen-fade-in"
      style={{
        backgroundImage: `linear-gradient(rgba(14, 18, 22, 0.72), rgba(10, 13, 16, 0.88)), url("${menuBg}")`,
      }}
    >
      {/* Ambient Torch Light Vignette and Atmosphere Overlays */}
      <div className="menu-torch-vignette" />
      <div className="menu-ember-canvas-placeholder" />

      {/* Main Menu Stage Container */}
      <div className="main-menu-stage">
        {/* ======================================================== */}
        {/* LEFT SIDE: Dominant Medieval Crest & Title               */}
        {/* (Positioned approx 8-12% from left, vertically centered) */}
        {/* ======================================================== */}
        <section className="main-menu-left-brand">
          {/* Heraldic Tournament Crest Emblem */}
          <div className="medieval-crest-shield">
            <div className="crest-halo" />
            <svg
              className="crest-shield-svg"
              viewBox="0 0 100 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="shieldMetalGrad" x1="50" y1="0" x2="50" y2="120" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3d2a1b" />
                  <stop offset="0.4" stopColor="#241a12" />
                  <stop offset="0.8" stopColor="#171b1e" />
                  <stop offset="1" stopColor="#0d1012" />
                </linearGradient>
                <linearGradient id="shieldGoldBorder" x1="0" y1="0" x2="100" y2="120" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ffd875" />
                  <stop offset="0.5" stopColor="#c9a44e" />
                  <stop offset="1" stopColor="#7a5524" />
                </linearGradient>
              </defs>
              {/* Outer Shield Outline */}
              <path
                d="M50 4 L94 22 L94 68 C94 96 50 116 50 116 C50 116 6 96 6 68 L6 22 Z"
                fill="url(#shieldMetalGrad)"
                stroke="url(#shieldGoldBorder)"
                strokeWidth="3.5"
              />
              {/* Inner Engraved Trim */}
              <path
                d="M50 13 L86 28 L86 66 C86 90 50 107 50 107 C50 107 14 90 14 66 L14 28 Z"
                fill="none"
                stroke="#c9a44e"
                strokeWidth="1.2"
                strokeDasharray="4 2"
                opacity="0.85"
              />
            </svg>
            <div className="crest-symbol-wrap">
              <span className="crest-crown">👑</span>
              <span className="crest-cross-swords">⚔️</span>
            </div>
          </div>

          {/* Game Title */}
          <h1 className="medieval-game-title">BRAWL IMPACT</h1>

          {/* Subtitle & Ornate Medieval Divider */}
          <div className="medieval-game-subtitle">
            <span>TOURNAMENT OF CHAMPIONS</span>
            <div className="subtitle-divider">⚜ ━━━━━━━━━━━━━━━ ⚜</div>
          </div>

          {/* Heraldic Banner Badge */}
          <div className="medieval-heraldic-ribbon">
            <span className="ribbon-gem">◈</span>
            <span>REAL-TIME PLATFORM BRAWLER</span>
            <span className="ribbon-gem">◈</span>
          </div>

          {/* Lore Inscription Plaque */}
          <div className="medieval-lore-tablet">
            <p>
              "Heed the call of the iron arena. Gather thy courage, pledge thy blade,
              and let the stones remember thy immortal fury."
            </p>
          </div>
        </section>

        {/* ======================================================== */}
        {/* RIGHT SIDE: Vertical Medieval Plaque Navigation Stack    */}
        {/* ======================================================== */}
        <nav className="main-menu-right-nav" aria-label="Main Navigation">
          <div className="nav-plaque-stack">
            <div className="plaque-stack-header">
              <span className="stack-header-line" />
              <span className="stack-header-title">TOURNAMENT CODEX</span>
              <span className="stack-header-line" />
            </div>

            {/* 1. 1v1 DUEL */}
            <button
              type="button"
              className="medieval-plaque-btn plaque-gold"
              onClick={() => onSelectMode('1v1', false)}
            >
              <div className="plaque-corner top-left" />
              <div className="plaque-corner top-right" />
              <div className="plaque-corner bottom-left" />
              <div className="plaque-corner bottom-right" />

              <div className="plaque-icon-wrap">
                <span className="plaque-icon">⚔️</span>
              </div>
              <div className="plaque-content">
                <span className="plaque-title">1V1 DUEL</span>
                <span className="plaque-subtext">Honor Duel • Two Warriors • 3 Stocks</span>
              </div>
              <span className="plaque-chevron">▶</span>
            </button>

            {/* 2. FREE FOR ALL */}
            <button
              type="button"
              className="medieval-plaque-btn plaque-primary"
              onClick={() => onSelectMode('ffa', false)}
            >
              <div className="plaque-corner top-left" />
              <div className="plaque-corner top-right" />
              <div className="plaque-corner bottom-left" />
              <div className="plaque-corner bottom-right" />

              <div className="plaque-icon-wrap">
                <span className="plaque-icon">🛡️</span>
              </div>
              <div className="plaque-content">
                <span className="plaque-title">FREE FOR ALL</span>
                <span className="plaque-subtext">Multiplayer War Chamber • Up to 4 Warriors</span>
              </div>
              <span className="plaque-chevron">▶</span>
            </button>

            {/* 3. TRAINING GROUNDS */}
            <button
              type="button"
              className="medieval-plaque-btn plaque-secondary"
              onClick={() => onSelectMode('training', false)}
            >
              <div className="plaque-corner top-left" />
              <div className="plaque-corner top-right" />
              <div className="plaque-corner bottom-left" />
              <div className="plaque-corner bottom-right" />

              <div className="plaque-icon-wrap">
                <span className="plaque-icon">🗡️</span>
              </div>
              <div className="plaque-content">
                <span className="plaque-title">TRAINING GROUNDS</span>
                <span className="plaque-subtext">Sparring Practice • Local Arena • Offline</span>
              </div>
              <span className="plaque-chevron">▶</span>
            </button>

            {/* 4. JOIN VIA SEAL */}
            <button
              type="button"
              className="medieval-plaque-btn plaque-neutral"
              onClick={() => handleOpenJoin('1v1')}
            >
              <div className="plaque-corner top-left" />
              <div className="plaque-corner top-right" />
              <div className="plaque-corner bottom-left" />
              <div className="plaque-corner bottom-right" />

              <div className="plaque-icon-wrap">
                <span className="plaque-icon">📜</span>
              </div>
              <div className="plaque-content">
                <span className="plaque-title">JOIN VIA SEAL</span>
                <span className="plaque-subtext">Enter an Existing Tournament Room Code</span>
              </div>
              <span className="plaque-chevron">▶</span>
            </button>

            {/* Divider */}
            <div className="plaque-nav-divider">
              <span>◈ ━━━━━━━━━━━━━━━━ ◈</span>
            </div>

            {/* Secondary Utilities Row */}
            <div className="nav-secondary-row">
              {/* Hall of Fame */}
              <button
                type="button"
                className="medieval-utility-btn"
                onClick={() => setShowLeaderboard(true)}
                title="View High Scores and Champions"
              >
                <span className="util-icon">🏆</span>
                <span className="util-text">HALL OF FAME</span>
              </button>

              {/* Settings */}
              <button
                type="button"
                className="medieval-utility-btn"
                onClick={() => setShowSettings(true)}
                title="Configure Audio and Controls"
              >
                <span className="util-icon">⚙️</span>
                <span className="util-text">SETTINGS</span>
              </button>

              {/* Exit */}
              <button
                type="button"
                className="medieval-utility-btn util-exit"
                onClick={() => setShowExitModal(true)}
                title="Leave Realm"
              >
                <span className="util-icon">🚪</span>
                <span className="util-text">EXIT</span>
              </button>
            </div>

            {/* Realm Gateway Indicator */}
            <div className="realm-status-pill">
              <span className="status-gem" />
              <span className="status-text">REALM GATEWAY: ONLINE</span>
            </div>
          </div>
        </nav>
      </div>

      {/* ======================================================== */}
      {/* MODALS: Join Code, Leaderboard, Settings, Exit           */}
      {/* ======================================================== */}

      {/* Join Room Code Modal */}
      {showJoinModal && (
        <div className="medieval-modal-backdrop" onClick={() => setShowJoinModal(false)}>
          <div
            className="medieval-modal-box medieval-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-ribbon">
              <h3>ENTER TOURNAMENT SEAL</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowJoinModal(false)}
              >
                ✕
              </button>
            </div>

            <p className="modal-lead">
              Select room category and enter the code given by thy host:
            </p>

            <div className="join-mode-toggle-group">
              <button
                type="button"
                className={`join-toggle-btn ${joinMode === '1v1' ? 'active' : ''}`}
                onClick={() => setJoinMode('1v1')}
              >
                ⚔️ 1v1 Duel
              </button>
              <button
                type="button"
                className={`join-toggle-btn ${joinMode === 'ffa' ? 'active' : ''}`}
                onClick={() => setJoinMode('ffa')}
              >
                🛡️ War Chamber
              </button>
            </div>

            <div className="modal-input-group" style={{ marginTop: 16 }}>
              <input
                type="text"
                className="medieval-input code-entry-input"
                placeholder="SEAL CODE"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                maxLength={6}
                autoFocus
              />
            </div>

            {joinError && <p className="modal-error-text">{joinError}</p>}

            <div className="modal-actions-row">
              <button
                type="button"
                className="medieval-btn medieval-btn-secondary"
                onClick={() => setShowJoinModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="medieval-btn medieval-btn-gold"
                onClick={handleConfirmJoin}
                disabled={joinCode.trim().length < 4}
              >
                Enter Chamber
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="medieval-modal-backdrop" onClick={() => setShowExitModal(false)}>
          <div
            className="medieval-modal-box medieval-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 400 }}
          >
            <div className="modal-header-ribbon">
              <h3>DEPART THE REALM</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowExitModal(false)}
              >
                ✕
              </button>
            </div>

            <p className="modal-lead" style={{ textAlign: 'center', marginTop: 12 }}>
              Dost thou truly wish to retreat from the tournament arena?
            </p>

            <div className="modal-actions-row" style={{ marginTop: 24 }}>
              <button
                type="button"
                className="medieval-btn medieval-btn-secondary"
                onClick={() => setShowExitModal(false)}
                style={{ flex: 1 }}
              >
                Remain
              </button>
              <button
                type="button"
                className="medieval-btn medieval-btn-danger"
                onClick={() => window.location.reload()}
                style={{ flex: 1 }}
              >
                Depart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hall of Fame Leaderboard Modal */}
      {showLeaderboard && (
        <LeaderboardModal onClose={() => setShowLeaderboard(false)} />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
