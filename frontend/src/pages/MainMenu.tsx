// ============================================================
// Brawl Impact - Main Menu
// Split Main Menu:
// - Left: Brawl Impact Logo & Medieval Aesthetics
// - Right: Game Mode Selection (Training, 1v1 Duel, FFA)
// Only after selecting a mode can warrior pick character & forge/join room!
// ============================================================

import { useState, useEffect } from 'react';
import { CharacterType, GameMode } from '@shared/types';
import { CharacterSelect } from '../components/CharacterSelect';
import { LeaderboardModal } from '../components/LeaderboardModal';
import { SettingsModal } from '../components/SettingsModal';
import { socketClient } from '../network/SocketClient';

interface MainMenuProps {
  onRoomCreated: (mode: GameMode) => void;
  onRoomJoined: () => void;
  onStartTraining: (character: CharacterType, nickname: string) => void;
  defaultMode?: GameMode;
}

export function MainMenu({
  onRoomCreated,
  onRoomJoined,
  onStartTraining,
}: MainMenuProps) {
  const [nickname, setNickname] = useState(() => {
    return localStorage.getItem('brawl_player_nickname') || '';
  });
  const [character, setCharacter] = useState<CharacterType>(() => {
    const saved = localStorage.getItem('brawl_player_character') as CharacterType;
    return saved && Object.values(CharacterType).includes(saved) ? saved : CharacterType.KNIGHT;
  });

  // State machine: null = show split main menu (logo left, mode select right)
  // When a mode is chosen ('training' | '1v1' | 'ffa'), show character select & room setup
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

  // Background customization state
  const [menuBg, setMenuBg] = useState(() => {
    return localStorage.getItem('brawl_menu_background') || '';
  });
  const [showBgModal, setShowBgModal] = useState(false);
  const [bgInputText, setBgInputText] = useState(menuBg);

  const [roomCode, setRoomCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [targetJoinMode, setTargetJoinMode] = useState<GameMode>('ffa');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Sync background updates from settings or storage
  useEffect(() => {
    const handleStorageChange = () => {
      const current = localStorage.getItem('brawl_menu_background') || '';
      setMenuBg(current);
      setBgInputText(current);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save nickname and character preferences
  useEffect(() => {
    if (nickname.trim()) {
      localStorage.setItem('brawl_player_nickname', nickname.trim());
    }
  }, [nickname]);

  const handleCharacterSelect = (char: CharacterType) => {
    setCharacter(char);
    localStorage.setItem('brawl_player_character', char);
  };

  const isValidNickname = nickname.trim().length >= 2;

  // 1. Enter Local Training Mode
  const handleLaunchTraining = () => {
    const chosenNick = isValidNickname ? nickname.trim() : 'Warrior';
    onStartTraining(character, chosenNick);
  };

  // 2. Create 1v1 Duel Room
  const handleCreate1v1 = () => {
    if (!isValidNickname) return;
    socketClient.createRoom(nickname.trim(), character, '1v1');
    onRoomCreated('1v1');
  };

  // 3. Create FFA Room
  const handleCreateFfa = () => {
    if (!isValidNickname) return;
    socketClient.createRoom(nickname.trim(), character, 'ffa');
    onRoomCreated('ffa');
  };

  // 4. Join Room by Code
  const handleJoinRoom = () => {
    if (!isValidNickname) {
      setJoinError('Masukkan nama pendekar terlebih dahulu');
      return;
    }
    const cleanCode = roomCode.trim().toUpperCase();
    if (cleanCode.length < 4) {
      setJoinError('Kode ruangan minimal 4 karakter');
      return;
    }
    setJoinError(null);
    socketClient.joinRoom(cleanCode, nickname.trim(), character);
    onRoomJoined();
  };

  const openJoinDialog = (mode: GameMode) => {
    setTargetJoinMode(mode);
    setShowJoinModal(true);
    setJoinError(null);
  };

  // Save custom background
  const handleApplyBackground = () => {
    const val = bgInputText.trim();
    if (val) {
      localStorage.setItem('brawl_menu_background', val);
      setMenuBg(val);
    } else {
      localStorage.removeItem('brawl_menu_background');
      setMenuBg('');
    }
    setShowBgModal(false);
  };

  const handleResetBackground = () => {
    localStorage.removeItem('brawl_menu_background');
    setMenuBg('');
    setBgInputText('');
    setShowBgModal(false);
  };

  // Resolve custom background URL from public/assets/background
  const resolveBgUrl = (input: string): string => {
    const clean = input.trim();
    if (!clean) return '';
    if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/') || clean.startsWith('data:')) {
      return clean;
    }
    return `/assets/background/${clean}`;
  };

  const activeBgUrl = resolveBgUrl(menuBg);

  return (
    <div
      className="main-menu"
      style={{
        backgroundImage: activeBgUrl
          ? `linear-gradient(rgba(13, 16, 21, 0.72), rgba(13, 16, 21, 0.84)), url("${activeBgUrl}")`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* ============================================================ */}
      {/* VIEW 1: Initial Main Menu (Logo on Left, Mode Select on Right) */}
      {/* ============================================================ */}
      {selectedMode === null ? (
        <div className="main-menu-split fade-in">
          {/* LEFT SIDE: Brawl Impact Logo & Identity */}
          <div className="main-menu-left">
            <div className="main-menu-logo-crest">
              <span className="main-menu-crest-icon">⚜️</span>
              <img
                src="/assets/logo/logo.png"
                alt="Brawl Impact Logo"
                className="main-menu-logo-img"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>

            <h1 className="game-title">BRAWL IMPACT</h1>
            <p className="game-subtitle">A Medieval Battle Arena</p>

            <div className="main-menu-badge">
              ⚔️ REAL-TIME PLATFORM BRAWLER ⚔️
            </div>

            <p className="main-menu-lore">
              Pilih arena pertarunganmu dan buktikan keahlian bertarung di hadapan para legenda.
              Tentukan mode permainan di sebelah kanan untuk memulai.
            </p>
          </div>

          {/* RIGHT SIDE: Game Mode Selection */}
          <div className="main-menu-right">
            <div className="mode-select-card card fade-in-up">
              <h2>⚜ PILIH MODE PERMAINAN ⚜</h2>

              <div className="mode-selection-list">
                {/* Mode 1: Training Grounds */}
                <div
                  className="mode-item"
                  onClick={() => setSelectedMode('training')}
                  title="Masuk mode latihan mandiri melawan sparring dummy"
                >
                  <div className="mode-item-left">
                    <div className="mode-item-icon">🗡️</div>
                    <div className="mode-item-details">
                      <div className="mode-item-title">Training Grounds</div>
                      <div className="mode-item-desc">Latihan Mandiri • Sparring Dummy • Tanpa Koneksi</div>
                    </div>
                  </div>
                  <button className="btn btn-secondary btn-sm mode-item-btn">
                    Pilih
                  </button>
                </div>

                {/* Mode 2: 1v1 Duel */}
                <div
                  className="mode-item"
                  onClick={() => setSelectedMode('1v1')}
                  title="Pertarungan 1 lawan 1 kompetitif dengan 3 stocks"
                >
                  <div className="mode-item-left">
                    <div className="mode-item-icon">⚔️</div>
                    <div className="mode-item-details">
                      <div className="mode-item-title">1v1 Duel</div>
                      <div className="mode-item-desc">2 Pendekar • 3 Stocks • Kompetitif</div>
                    </div>
                  </div>
                  <button className="btn btn-gold btn-sm mode-item-btn">
                    Pilih
                  </button>
                </div>

                {/* Mode 3: FFA Free For All */}
                <div
                  className="mode-item"
                  onClick={() => setSelectedMode('ffa')}
                  title="Pertarungan bebas multiplayer 2 hingga 4 pemain"
                >
                  <div className="mode-item-left">
                    <div className="mode-item-icon">🛡️</div>
                    <div className="mode-item-details">
                      <div className="mode-item-title">Free For All</div>
                      <div className="mode-item-desc">2–4 Pendekar • 3 Stocks • War Chamber</div>
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm mode-item-btn">
                    Pilih
                  </button>
                </div>
              </div>

              {/* Bottom Quick Utilities */}
              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button
                  type="button"
                  className="btn btn-gold btn-sm"
                  onClick={() => setShowLeaderboard(true)}
                  style={{ flex: 1 }}
                >
                  🏆 Hall of Fame
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowSettings(true)}
                  style={{ flex: 1 }}
                >
                  ⚙ Settings
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setBgInputText(menuBg);
                    setShowBgModal(true);
                  }}
                  title="Ubah background menu dari public/assets/background"
                  style={{ flex: 1 }}
                >
                  🖼️ Background
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* VIEW 2: Character Selection & Room Setup (After Mode Chosen) */
        /* ============================================================ */
        <div className="setup-view-container fade-in-up">
          {/* Header Bar with Back Button & Current Mode Indicator */}
          <div className="setup-header-bar">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSelectedMode(null)}
              title="Kembali ke pemilihan mode permainan"
            >
              ◀ Kembali ke Pilihan Mode
            </button>

            <span className="setup-mode-badge">
              {selectedMode === 'training' && '🗡️ MODE: TRAINING GROUNDS'}
              {selectedMode === '1v1' && '⚔️ MODE: 1v1 DUEL'}
              {selectedMode === 'ffa' && '🛡️ MODE: FREE FOR ALL'}
            </span>
          </div>

          {/* Setup Card: Name Input, Character Select, and Room Actions */}
          <div className="setup-card card">
            <h2 style={{ textAlign: 'center', fontSize: 20, color: 'var(--accent-gold)', marginBottom: 16 }}>
              ⚜ Tentukan Identitas & Karaktermu ⚜
            </h2>

            {/* Warrior Nickname Input */}
            <div style={{ marginBottom: 16 }}>
              <input
                className="input"
                type="text"
                placeholder="Masukkan nama pendekar..."
                value={nickname}
                onChange={(e) => setNickname(e.target.value.slice(0, 16))}
                maxLength={16}
                style={{ width: '100%', fontSize: 18, textAlign: 'center' }}
                autoFocus
              />
            </div>

            {/* Champion Selector */}
            <CharacterSelect
              selected={character}
              onSelect={handleCharacterSelect}
              compact={false}
              title="⚜ Pilih Pendekar Juara ⚜"
            />

            {/* Action Buttons Based on Chosen Mode */}
            <div style={{ marginTop: 24 }}>
              {selectedMode === 'training' && (
                <button
                  type="button"
                  className="btn btn-gold btn-lg"
                  onClick={handleLaunchTraining}
                  style={{ width: '100%', fontSize: 18, letterSpacing: 2 }}
                >
                  ⚔ Masuk Arena Latihan ⚔
                </button>
              )}

              {selectedMode === '1v1' && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    className="btn btn-gold btn-lg"
                    onClick={handleCreate1v1}
                    disabled={!isValidNickname}
                    style={{ flex: 1, fontSize: 16 }}
                  >
                    ⚔ Buat Room 1v1
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-lg"
                    onClick={() => openJoinDialog('1v1')}
                    disabled={!isValidNickname}
                    style={{ flex: 1, fontSize: 16 }}
                  >
                    🛡 Gabung Room 1v1
                  </button>
                </div>
              )}

              {selectedMode === 'ffa' && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    onClick={handleCreateFfa}
                    disabled={!isValidNickname}
                    style={{ flex: 1, fontSize: 16 }}
                  >
                    ⚔ Buat Room FFA
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-lg"
                    onClick={() => openJoinDialog('ffa')}
                    disabled={!isValidNickname}
                    style={{ flex: 1, fontSize: 16 }}
                  >
                    🛡 Gabung Room FFA
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALS: Background Customizer, Join Room, Leaderboard, Settings */}
      {/* ============================================================ */}

      {/* Background Customizer Modal */}
      {showBgModal && (
        <div className="modal-backdrop fade-in" onClick={() => setShowBgModal(false)}>
          <div className="modal-content card fade-in-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2>🖼️ Background Main Menu</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowBgModal(false)}>
                ✕
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>
                Tentukan nama file gambar latar belakang yang ada di folder:
              </p>
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '6px 10px', borderRadius: 4, margin: '8px 0', fontSize: 12, wordBreak: 'break-all', color: 'var(--accent-gold)' }}>
                frontend/public/assets/background/
              </div>

              <input
                className="input"
                type="text"
                placeholder="contoh: bg1.jpg atau wallpaper.png"
                value={bgInputText}
                onChange={(e) => setBgInputText(e.target.value)}
                style={{ width: '100%', fontSize: 14, marginTop: 8 }}
                autoFocus
              />

              {menuBg && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  Background saat ini: <strong style={{ color: 'var(--parchment)' }}>{menuBg}</strong>
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResetBackground}
                style={{ flex: 1 }}
              >
                Reset Default
              </button>
              <button
                type="button"
                className="btn btn-gold btn-sm"
                onClick={handleApplyBackground}
                style={{ flex: 1 }}
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="modal-backdrop fade-in" onClick={() => setShowJoinModal(false)}>
          <div className="modal-content card fade-in-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>Gabung {targetJoinMode === '1v1' ? '1v1 Duel' : 'War Chamber'}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowJoinModal(false)}>
                ✕
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 8 }}>
              Masukkan 6 karakter kode ruangan dari sang pembuat room:
            </p>

            <div style={{ marginTop: 14 }}>
              <input
                className="input"
                type="text"
                placeholder="KODE ROOM"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                maxLength={6}
                style={{ width: '100%', fontSize: 24, textAlign: 'center', letterSpacing: 4 }}
                autoFocus
              />
            </div>

            {joinError && (
              <p style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
                {joinError}
              </p>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowJoinModal(false)}
                style={{ flex: 1 }}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-gold"
                onClick={handleJoinRoom}
                disabled={roomCode.trim().length < 4}
                style={{ flex: 1 }}
              >
                Masuk Room
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
