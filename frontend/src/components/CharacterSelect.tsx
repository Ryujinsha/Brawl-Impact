// ============================================================
// Brawl Impact - Character Select Component
// ============================================================

import { CharacterType } from '@shared/types';

interface CharacterSelectProps {
  selected: CharacterType;
  onSelect: (character: CharacterType) => void;
}

const CHARACTERS = [
  {
    type: CharacterType.KNIGHT,
    icon: '⚔️',
    name: 'Knight',
    role: 'Balanced',
    className: 'knight',
  },
  {
    type: CharacterType.MAGE,
    icon: '🔮',
    name: 'Mage',
    role: 'Ranged',
    className: 'mage',
  },
  {
    type: CharacterType.ASSASSIN,
    icon: '🗡️',
    image: '/assets/assasin/assasin_walk/assasin_walk1.png',
    name: 'Assassin',
    role: 'Fast',
    className: 'assassin',
  },
  {
    type: CharacterType.FIGHTER,
    icon: '👊',
    name: 'Fighter',
    role: 'Power',
    className: 'fighter',
  },
];

export function CharacterSelect({ selected, onSelect }: CharacterSelectProps) {
  return (
    <div className="character-select">
      <h3>⚜ Choose Thy Champion ⚜</h3>
      <div className="character-grid">
        {CHARACTERS.map((char) => (
          <div
            key={char.type}
            className={`character-card ${char.className} ${selected === char.type ? 'selected' : ''}`}
            onClick={() => onSelect(char.type)}
          >
            <div className="char-icon">
              {'image' in char && char.image ? (
                <img
                  src={char.image}
                  alt={char.name}
                  style={{
                    width: '38px',
                    height: '38px',
                    objectFit: 'contain',
                    verticalAlign: 'middle',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                  }}
                />
              ) : (
                char.icon
              )}
            </div>
            <div className="char-name">{char.name}</div>
            <div className="char-role">{char.role}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
