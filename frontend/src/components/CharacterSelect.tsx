// ============================================================
// Brawl Impact - Reusable Character Select Component
// Reused by Training Mode, 1v1 Duel, and FFA modes
// ============================================================

import { useState } from 'react';
import { CharacterType } from '@shared/types';
import { CHARACTER_STATS, CHARACTER_ABILITIES, CHARACTER_COLORS } from '@shared/gameConfig';

interface CharacterSelectProps {
  selected: CharacterType;
  onSelect: (character: CharacterType) => void;
  compact?: boolean;
  title?: string;
}

interface CharacterDefinition {
  type: CharacterType;
  icon: string;
  image?: string;
  name: string;
  role: string;
  className: string;
  lore: string;
}

const CHARACTERS: CharacterDefinition[] = [
  {
    type: CharacterType.KNIGHT,
    icon: '⚔️',
    name: 'Knight',
    role: 'Balanced Warrior',
    className: 'knight',
    lore: 'Master of sword and buckler with steadfast defense and lethal charges.',
  },
  {
    type: CharacterType.MAGE,
    icon: '🔮',
    name: 'Mage',
    role: 'Ranged Sorcerer',
    className: 'mage',
    lore: 'Wielder of cosmic elements, calling down fireballs and cataclysmic meteors.',
  },
  {
    type: CharacterType.ASSASSIN,
    icon: '🗡️',
    image: '/assets/assasin/assasin_walk/assasin_walk1.png',
    name: 'Assassin',
    role: 'Agile Stalker',
    className: 'assassin',
    lore: 'Swift shadow wielding throwing shurikens and deceptive evasive footwork.',
  },
  {
    type: CharacterType.FIGHTER,
    icon: '👊',
    name: 'Fighter',
    role: 'Heavy Brawler',
    className: 'fighter',
    lore: 'Brutal pugilist with unmatched raw power, rising uppercuts, and ground slams.',
  },
];

export function CharacterSelect({
  selected,
  onSelect,
  compact = false,
  title = '⚜ Choose Thy Champion ⚜',
}: CharacterSelectProps) {
  const [hoveredChar, setHoveredChar] = useState<CharacterType | null>(null);

  // Active display is either the hovered warrior or selected warrior
  const activeType = hoveredChar ?? selected;
  const activeCharDef = CHARACTERS.find((c) => c.type === activeType) || CHARACTERS[0];
  const activeStats = CHARACTER_STATS[activeType];
  const activeAbilities = CHARACTER_ABILITIES[activeType];
  const activeColor = CHARACTER_COLORS[activeType];

  return (
    <div className={`character-select ${compact ? 'is-compact' : 'is-detailed'}`}>
      {title && <h3>{title}</h3>}

      {/* Grid of 4 Warriors */}
      <div className="character-grid">
        {CHARACTERS.map((char) => {
          const isSelected = selected === char.type;
          const stats = CHARACTER_STATS[char.type];
          const abilities = CHARACTER_ABILITIES[char.type];

          return (
            <div
              key={char.type}
              className={`character-card ${char.className} ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(char.type)}
              onMouseEnter={() => setHoveredChar(char.type)}
              onMouseLeave={() => setHoveredChar(null)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(char.type);
                }
              }}
            >
              <div className="char-card-glow" />

              <div className="char-icon">
                {char.image ? (
                  <img
                    src={char.image}
                    alt={char.name}
                    className="char-sprite-img"
                  />
                ) : (
                  <span className="char-emoji-icon">{char.icon}</span>
                )}
              </div>

              <div className="char-name">{char.name}</div>
              <div className="char-role">{char.role}</div>

              {/* In compact mode, show simple badges; in full mode, show quick stat highlights */}
              {!compact && (
                <div className="char-card-stats-preview">
                  <div className="stat-pill" title="Attack Damage">
                    <span className="stat-label">DMG</span>
                    <span className="stat-val">{stats.attackDamage}</span>
                  </div>
                  <div className="stat-pill" title="Movement Speed">
                    <span className="stat-label">SPD</span>
                    <span className="stat-val">{stats.moveSpeed}</span>
                  </div>
                  <div className="stat-pill" title="Knockback Power">
                    <span className="stat-label">KB</span>
                    <span className="stat-val">{stats.knockbackPower}x</span>
                  </div>
                </div>
              )}

              {isSelected && <div className="selected-ribbon">SELECTED</div>}
            </div>
          );
        })}
      </div>

      {/* Detailed Champion Dossier for chosen character */}
      {!compact && (
        <div className="character-dossier card fade-in-up" style={{ borderColor: activeColor.accent }}>
          <div className="dossier-header">
            <div className="dossier-title">
              <span className="dossier-icon">{activeCharDef.icon}</span>
              <div>
                <h4 style={{ color: activeColor.accent }}>{activeCharDef.name}</h4>
                <span className="dossier-role">{activeCharDef.role}</span>
              </div>
            </div>
            <p className="dossier-lore">{activeCharDef.lore}</p>
          </div>

          <div className="dossier-body">
            {/* Stat Bars */}
            <div className="dossier-stats-col">
              <h5>Combat Attributes</h5>
              <div className="stat-bar-row">
                <span className="stat-name">Attack Damage</span>
                <div className="stat-bar-track">
                  <div
                    className="stat-bar-fill"
                    style={{
                      width: `${(activeStats.attackDamage / 18) * 100}%`,
                      backgroundColor: activeColor.accent,
                    }}
                  />
                </div>
                <span className="stat-number">{activeStats.attackDamage}</span>
              </div>

              <div className="stat-bar-row">
                <span className="stat-name">Movement Speed</span>
                <div className="stat-bar-track">
                  <div
                    className="stat-bar-fill"
                    style={{
                      width: `${(activeStats.moveSpeed / 6.5) * 100}%`,
                      backgroundColor: activeColor.accent,
                    }}
                  />
                </div>
                <span className="stat-number">{activeStats.moveSpeed}</span>
              </div>

              <div className="stat-bar-row">
                <span className="stat-name">Knockback Power</span>
                <div className="stat-bar-track">
                  <div
                    className="stat-bar-fill"
                    style={{
                      width: `${(activeStats.knockbackPower / 1.5) * 100}%`,
                      backgroundColor: activeColor.accent,
                    }}
                  />
                </div>
                <span className="stat-number">{activeStats.knockbackPower}x</span>
              </div>

              <div className="stat-bar-row">
                <span className="stat-name">Health Vitality</span>
                <div className="stat-bar-track">
                  <div
                    className="stat-bar-fill"
                    style={{
                      width: '100%',
                      backgroundColor: '#44d76b',
                    }}
                  />
                </div>
                <span className="stat-number">{activeStats.maxHp} HP</span>
              </div>
            </div>

            {/* Abilities & Ultimate */}
            <div className="dossier-abilities-col">
              <h5>Techniques & Sorceries</h5>
              <div className="technique-item">
                <span className="key-tag">J / Z</span>
                <div className="technique-details">
                  <strong className="technique-name">{activeAbilities.basic}</strong>
                  <span className="technique-desc">Primary melee or direct strike</span>
                </div>
              </div>

              <div className="technique-item">
                <span className="key-tag">K / X</span>
                <div className="technique-details">
                  <strong className="technique-name" style={{ color: activeColor.accent }}>
                    {activeAbilities.ability}
                  </strong>
                  <span className="technique-desc">
                    Special Technique (Cooldown: {activeStats.abilityCooldown / 60}s)
                  </span>
                </div>
              </div>

              <div className="technique-item ultimate-tech">
                <span className="key-tag ultimate-tag">L / C</span>
                <div className="technique-details">
                  <strong className="technique-name text-gold">{activeAbilities.ultimate}</strong>
                  <span className="technique-desc">
                    Devastating Ultimate Art (Cooldown: {activeStats.ultimateCooldown / 60}s)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
