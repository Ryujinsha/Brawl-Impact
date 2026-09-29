// ============================================================
// Brawl Impact - Dedicated Character Selection Screen
// 3-Column Medieval Tournament Layout:
// [ CHARACTERS LIST ] [ FIGHTER STAGE & LORE ] [ ATTRIBUTES & ARTS ]
// ============================================================

import { useState, useEffect } from 'react';
import { CharacterType, GameMode } from '@shared/types';
import {
  CHARACTER_STATS,
  CHARACTER_ABILITIES,
  CHARACTER_COLORS,
  ATTACK_DEFS,
} from '@shared/gameConfig';

export interface CharacterSelectScreenProps {
  mode: GameMode | 'training';
  initialCharacter?: CharacterType;
  initialNickname?: string;
  isJoiningRoom?: boolean;
  joinRoomCode?: string;
  onConfirm: (character: CharacterType, nickname: string, joinCode?: string) => void;
  onBack: () => void;
}

export interface CharacterProfile {
  type: CharacterType;
  name: string;
  title: string;
  role: string;
  icon: string;
  image?: string;
  lore: string;
  defenseRating: number; // 1-10 visual rating
}

export const CHARACTER_PROFILES: Record<CharacterType, CharacterProfile> = {
  [CharacterType.KNIGHT]: {
    type: CharacterType.KNIGHT,
    name: 'Knight',
    title: 'THE IRON VANGUARD',
    role: 'Balanced Warrior',
    icon: '⚔️',
    image: '/assets/knight/knight_idle/knight_idle1.png',
    lore: 'Master of sword and buckler with steadfast defense and lethal charges. Built for direct frontline combat.',
    defenseRating: 9,
  },
  [CharacterType.MAGE]: {
    type: CharacterType.MAGE,
    name: 'Mage',
    title: 'THE ASTRAL WEAVER',
    role: 'Ranged Sorcerer',
    icon: '🔮',
    lore: 'Wielder of cosmic elements, calling down fireballs and cataclysmic meteors from afar with mystical precision.',
    defenseRating: 5,
  },
  [CharacterType.ASSASSIN]: {
    type: CharacterType.ASSASSIN,
    name: 'Assassin',
    title: 'THE SHADOW PHANTOM',
    role: 'Agile Stalker',
    icon: '🗡️',
    image: '/assets/assasin/assasin_idle/assasin_idle1.png',
    lore: 'Swift shadow wielding throwing shurikens and deceptive evasive footwork to dismantle foes before they strike.',
    defenseRating: 6,
  },
  [CharacterType.FIGHTER]: {
    type: CharacterType.FIGHTER,
    name: 'Fighter',
    title: 'THE CRIMSON JUGGERNAUT',
    role: 'Heavy Brawler',
    icon: '👊',
    lore: 'Brutal pugilist with unmatched raw power, rising uppercuts, and devastating seismic ground slams.',
    defenseRating: 8,
  },
};

const CHARACTER_LIST: CharacterType[] = [
  CharacterType.KNIGHT,
  CharacterType.MAGE,
  CharacterType.ASSASSIN,
  CharacterType.FIGHTER,
];

export function CharacterSelectScreen({
  mode,
  initialCharacter = CharacterType.KNIGHT,
  initialNickname = 'Warrior',
  isJoiningRoom = false,
  joinRoomCode = '',
  onConfirm,
  onBack,
}: CharacterSelectScreenProps) {
  const [selectedChar, setSelectedChar] = useState<CharacterType>(() => {
    return initialCharacter && Object.values(CharacterType).includes(initialCharacter)
      ? initialCharacter
      : CharacterType.KNIGHT;
  });

  const [nickname, setNickname] = useState(() => {
    return initialNickname || localStorage.getItem('brawl_player_nickname') || 'Warrior';
  });

  const [roomCodeInput, setRoomCodeInput] = useState(joinRoomCode);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Sync nickname changes to localStorage
  useEffect(() => {
    if (nickname.trim()) {
      localStorage.setItem('brawl_player_nickname', nickname.trim());
    }
  }, [nickname]);

  // Sync character selection to localStorage
  const handleSelectChar = (char: CharacterType) => {
    setSelectedChar(char);
    localStorage.setItem('brawl_player_character', char);
  };

  const profile = CHARACTER_PROFILES[selectedChar];
  const stats = CHARACTER_STATS[selectedChar];
  const abilities = CHARACTER_ABILITIES[selectedChar];
  const attacks = ATTACK_DEFS[selectedChar];
  const color = CHARACTER_COLORS[selectedChar];

  const isValidNickname = nickname.trim().length >= 2;

  const handlePrimaryConfirm = () => {
    if (!isValidNickname) return;
    const finalNick = nickname.trim();
    if (isJoiningRoom && joinRoomCode) {
      onConfirm(selectedChar, finalNick, joinRoomCode);
    } else {
      onConfirm(selectedChar, finalNick);
    }
  };

  const handleJoinWithCodeConfirm = () => {
    if (!isValidNickname) return;
    const cleanCode = roomCodeInput.trim().toUpperCase();
    if (cleanCode.length < 4) {
      setCodeError('Room seal must be at least 4 characters');
      return;
    }
    setCodeError(null);
    setShowCodeModal(false);
    onConfirm(selectedChar, nickname.trim(), cleanCode);
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'training':
        return '⚔ TRAINING GROUNDS ⚔';
      case '1v1':
        return '⚔ 1V1 HONOR DUEL ⚔';
      case 'ffa':
        return '⚔ FREE FOR ALL WAR CHAMBER ⚔';
      default:
        return '⚔ TOURNAMENT SELECTION ⚔';
    }
  };

  return (
    <div className="char-select-screen screen-fade-in">
      {/* Background vignette & ambient torch glow */}
      <div className="char-select-bg-overlay" />

      {/* Top Header Bar */}
      <header className="char-select-header">
        <button
          type="button"
          className="medieval-btn medieval-btn-secondary char-select-back-btn"
          onClick={onBack}
          title="Return to Grand Hall"
        >
          <span className="btn-icon">◀</span>
          <span className="btn-text">RETURN TO HALL</span>
        </button>

        <div className="char-select-heading-wrap">
          <h1 className="medieval-title-gold char-select-title">CHOOSE THY CHAMPION</h1>
          <div className="char-select-mode-badge">
            <span className="mode-badge-gem">⚜</span>
            <span className="mode-badge-text">{getModeTitle()}</span>
            <span className="mode-badge-gem">⚜</span>
          </div>
        </div>

        {/* Warrior Identity / Name Input */}
        <div className="warrior-identity-bar">
          <label className="identity-label" htmlFor="warrior-name-input">
            WARRIOR NAME
          </label>
          <div className="identity-input-wrap">
            <input
              id="warrior-name-input"
              type="text"
              className="medieval-input identity-input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 16))}
              placeholder="Thy Title..."
              maxLength={16}
            />
            <span className="identity-feather-icon">🖋️</span>
          </div>
        </div>
      </header>

      {/* Main 3-Column Arena Layout */}
      <main className="char-select-stage">
        {/* ======================================================== */}
        {/* COLUMN 1: Character List (Left)                         */}
        {/* ======================================================== */}
        <section className="char-col-list medieval-panel">
          <div className="col-header-banner">
            <span className="col-banner-icon">⚜</span>
            <h2>CHAMPIONS</h2>
            <span className="col-banner-icon">⚜</span>
          </div>
          <p className="col-subtext">Select thy combatant</p>

          <div className="champion-cards-stack">
            {CHARACTER_LIST.map((charType) => {
              const charProf = CHARACTER_PROFILES[charType];
              const isSelected = selectedChar === charType;

              return (
                <button
                  key={charType}
                  type="button"
                  className={`champion-card-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectChar(charType)}
                  aria-pressed={isSelected}
                >
                  <div className="champ-card-corner top-left" />
                  <div className="champ-card-corner top-right" />
                  <div className="champ-card-corner bottom-left" />
                  <div className="champ-card-corner bottom-right" />

                  <div className="champ-card-emblem">
                    {charProf.image ? (
                      <img
                        src={charProf.image}
                        alt={charProf.name}
                        className="champ-thumb-img"
                        width={38}
                        height={38}
                      />
                    ) : (
                      <span className="champ-thumb-emoji">{charProf.icon}</span>
                    )}
                  </div>

                  <div className="champ-card-info">
                    <span className="champ-card-name">{charProf.name}</span>
                    <span className="champ-card-role">{charProf.role}</span>
                  </div>

                  {isSelected && (
                    <div className="champ-selected-seal" title="Active Champion">
                      <span>✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* COLUMN 2: Fighter Display & Pedestal (Center)            */}
        {/* ======================================================== */}
        <section className="char-col-display">
          {/* Champion Pedestal Dais */}
          <div className="hero-pedestal-scene">
            {/* Ambient runic glow under dais */}
            <div
              className="hero-aura-glow"
              style={{
                background: `radial-gradient(ellipse at center, ${color.accent}33 0%, ${color.primary}18 50%, transparent 75%)`,
              }}
            />

            {/* Visual Sprite / Art Representation */}
            <div className="hero-sprite-frame">
              {profile.image ? (
                <img
                  src={profile.image}
                  alt={profile.name}
                  className="hero-sprite-showcase"
                  width={200}
                  height={200}
                  key={profile.type}
                />
              ) : (
                <div
                  className="hero-emblem-showcase"
                  style={{
                    borderColor: color.accent,
                    boxShadow: `0 0 35px ${color.accent}44`,
                  }}
                >
                  <span className="hero-large-symbol">{profile.icon}</span>
                  <span className="hero-runic-sigil">✦ ⚔ ✦</span>
                </div>
              )}
              {/* Soft ground shadow ellipse */}
              <div className="hero-ground-shadow" />
            </div>

            {/* Pedestal Base Ring */}
            <div className="hero-stone-pedestal">
              <span className="pedestal-rune">◈</span>
              <span className="pedestal-divider">━━━━━━━━━━━━━</span>
              <span className="pedestal-rune">◈</span>
            </div>
          </div>

          {/* Hero Dossier Card */}
          <div className="hero-title-dossier medieval-panel">
            <h3 className="hero-name-heading" style={{ color: color.accent }}>
              {profile.name}
            </h3>
            <div className="hero-epithet">{profile.title}</div>
            <p className="hero-lore-text">{profile.lore}</p>
          </div>
        </section>

        {/* ======================================================== */}
        {/* COLUMN 3: Character Statistics & Abilities (Right)       */}
        {/* ======================================================== */}
        <section className="char-col-stats medieval-panel">
          <div className="col-header-banner">
            <span className="col-banner-icon">⚜</span>
            <h2>STATISTICS</h2>
            <span className="col-banner-icon">⚜</span>
          </div>
          <p className="col-subtext">Combat Prowess & Arts</p>

          {/* Stat Bars Section */}
          <div className="stat-bars-container">
            {/* Health */}
            <div className="stat-meter-row">
              <div className="stat-meter-label">
                <span className="stat-title">HEALTH</span>
                <span className="stat-value">{stats.maxHp} HP</span>
              </div>
              <div className="medieval-stat-track">
                <div
                  className="medieval-stat-fill stat-health"
                  style={{ width: `${(stats.maxHp / 200) * 100}%` }}
                />
              </div>
            </div>

            {/* Attack Damage */}
            <div className="stat-meter-row">
              <div className="stat-meter-label">
                <span className="stat-title">ATTACK</span>
                <span className="stat-value">{stats.attackDamage} DMG</span>
              </div>
              <div className="medieval-stat-track">
                <div
                  className="medieval-stat-fill stat-attack"
                  style={{ width: `${(stats.attackDamage / 16) * 100}%` }}
                />
              </div>
            </div>

            {/* Defense / Fortitude */}
            <div className="stat-meter-row">
              <div className="stat-meter-label">
                <span className="stat-title">DEFENSE</span>
                <span className="stat-value">{profile.defenseRating} / 10</span>
              </div>
              <div className="medieval-stat-track">
                <div
                  className="medieval-stat-fill stat-defense"
                  style={{ width: `${(profile.defenseRating / 10) * 100}%` }}
                />
              </div>
            </div>

            {/* Speed */}
            <div className="stat-meter-row">
              <div className="stat-meter-label">
                <span className="stat-title">SPEED</span>
                <span className="stat-value">{stats.moveSpeed} SPD</span>
              </div>
              <div className="medieval-stat-track">
                <div
                  className="medieval-stat-fill stat-speed"
                  style={{ width: `${(stats.moveSpeed / 5.0) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Abilities & Ultimates Section */}
          <div className="techniques-block">
            <h4 className="tech-section-title">MARTIAL TECHNIQUES</h4>

            {/* Basic Attack */}
            <div className="tech-card">
              <div className="tech-key-seal">J / Z</div>
              <div className="tech-details">
                <div className="tech-name">{abilities.basic}</div>
                <div className="tech-meta">
                  Basic Strike • {attacks.BASIC.damage} Dmg • {attacks.BASIC.duration}f
                </div>
              </div>
            </div>

            {/* Special Ability */}
            <div className="tech-card">
              <div className="tech-key-seal" style={{ borderColor: color.accent, color: color.accent }}>
                K / X
              </div>
              <div className="tech-details">
                <div className="tech-name" style={{ color: color.accent }}>
                  {abilities.ability}
                </div>
                <div className="tech-meta">
                  Special Technique • {stats.abilityDamage} Dmg • {(stats.abilityCooldown / 60).toFixed(1)}s CD
                </div>
              </div>
            </div>

            {/* Ultimate Art */}
            <div className="tech-card tech-card-ultimate">
              <div className="tech-key-seal gold-key">L / C</div>
              <div className="tech-details">
                <div className="tech-name gold-tech-name">{abilities.ultimate}</div>
                <div className="tech-meta">
                  Devastating Art • {stats.ultimateDamage} Dmg • {(stats.ultimateCooldown / 60).toFixed(0)}s CD
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Confirmation Bar */}
      <footer className="char-select-footer">
        <button
          type="button"
          className="medieval-btn medieval-btn-secondary"
          onClick={onBack}
        >
          <span className="btn-icon">◀</span>
          <span className="btn-text">CANCEL</span>
        </button>

        {/* Primary Action Button */}
        {mode === 'training' && (
          <button
            type="button"
            className="medieval-btn medieval-btn-gold char-confirm-btn"
            onClick={handlePrimaryConfirm}
            disabled={!isValidNickname}
          >
            <span className="btn-icon">⚔</span>
            <span className="btn-text">ENTER TRAINING GROUNDS</span>
            <span className="btn-icon">⚔</span>
          </button>
        )}

        {mode === '1v1' && !isJoiningRoom && (
          <div className="footer-multi-actions">
            <button
              type="button"
              className="medieval-btn medieval-btn-secondary"
              onClick={() => {
                setRoomCodeInput('');
                setShowCodeModal(true);
              }}
              disabled={!isValidNickname}
            >
              <span className="btn-icon">📜</span>
              <span className="btn-text">ENTER VIA CODE</span>
            </button>
            <button
              type="button"
              className="medieval-btn medieval-btn-gold char-confirm-btn"
              onClick={handlePrimaryConfirm}
              disabled={!isValidNickname}
            >
              <span className="btn-icon">⚔</span>
              <span className="btn-text">FORGE 1V1 DUEL ROOM</span>
              <span className="btn-icon">⚔</span>
            </button>
          </div>
        )}

        {mode === 'ffa' && !isJoiningRoom && (
          <div className="footer-multi-actions">
            <button
              type="button"
              className="medieval-btn medieval-btn-secondary"
              onClick={() => {
                setRoomCodeInput('');
                setShowCodeModal(true);
              }}
              disabled={!isValidNickname}
            >
              <span className="btn-icon">📜</span>
              <span className="btn-text">ENTER VIA CODE</span>
            </button>
            <button
              type="button"
              className="medieval-btn medieval-btn-gold char-confirm-btn"
              onClick={handlePrimaryConfirm}
              disabled={!isValidNickname}
            >
              <span className="btn-icon">🛡</span>
              <span className="btn-text">FORGE WAR CHAMBER</span>
              <span className="btn-icon">🛡</span>
            </button>
          </div>
        )}

        {isJoiningRoom && (
          <button
            type="button"
            className="medieval-btn medieval-btn-gold char-confirm-btn"
            onClick={handlePrimaryConfirm}
            disabled={!isValidNickname}
          >
            <span className="btn-icon">⚔</span>
            <span className="btn-text">ENTER ROOM [{joinRoomCode}]</span>
            <span className="btn-icon">⚔</span>
          </button>
        )}
      </footer>

      {/* Code Modal for entering an existing Room Code */}
      {showCodeModal && (
        <div className="medieval-modal-backdrop" onClick={() => setShowCodeModal(false)}>
          <div
            className="medieval-modal-box medieval-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-ribbon">
              <h3>ENTER TOURNAMENT SEAL</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowCodeModal(false)}
              >
                ✕
              </button>
            </div>

            <p className="modal-lead">
              Enter the room code provided by thy tournament host:
            </p>

            <div className="modal-input-group">
              <input
                type="text"
                className="medieval-input code-entry-input"
                placeholder="SEAL CODE"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase().slice(0, 6))}
                maxLength={6}
                autoFocus
              />
            </div>

            {codeError && <p className="modal-error-text">{codeError}</p>}

            <div className="modal-actions-row">
              <button
                type="button"
                className="medieval-btn medieval-btn-secondary"
                onClick={() => setShowCodeModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="medieval-btn medieval-btn-gold"
                onClick={handleJoinWithCodeConfirm}
                disabled={roomCodeInput.trim().length < 4}
              >
                Enter Chamber
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
