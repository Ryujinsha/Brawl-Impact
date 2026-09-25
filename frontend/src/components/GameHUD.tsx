// ============================================================
// Brawl Impact - Game HUD Component
// ============================================================

import { GameState, CharacterType, AttackType } from '@shared/types';
import { CHARACTER_ABILITIES, ATTACK_DEFS, GAME_CONFIG } from '@shared/gameConfig';

interface GameHUDProps {
  gameState: GameState;
  localPlayerId: string;
}

const CHAR_ICONS: Record<CharacterType, string> = {
  [CharacterType.KNIGHT]: '⚔️',
  [CharacterType.MAGE]: '🔮',
  [CharacterType.ASSASSIN]: '🗡️',
  [CharacterType.FIGHTER]: '👊',
};

function getDamageColor(percent: number): string {
  if (percent < 30) return '#6b9a6b';
  if (percent < 60) return '#c9a44e';
  if (percent < 100) return '#c87a3a';
  if (percent < 150) return '#a84040';
  return '#cc2222';
}

export function GameHUD({ gameState, localPlayerId }: GameHUDProps) {
  const localPlayer = gameState.players.find((p) => p.id === localPlayerId);
  const abilities = localPlayer ? CHARACTER_ABILITIES[localPlayer.character] : null;

  return (
    <div className="game-hud">
      {/* Top: Compact medieval player status bars */}
      <div className="hud-top">
        {gameState.players.map((player) => {
          const isEliminated = !player.isAlive && player.stocks <= 0;
          const damageColor = getDamageColor(player.damagePercent);
          const barWidth = Math.min(100, (player.damagePercent / 150) * 100);

          return (
            <div
              key={player.id}
              className={`hud-player-card ${isEliminated ? 'eliminated' : ''} ${player.id === localPlayerId ? 'is-self' : ''}`}
            >
              <div className="hud-char-crest">{CHAR_ICONS[player.character]}</div>
              <div className="hud-player-body">
                <div className="hud-player-header">
                  <span className="hud-player-name">{player.nickname}</span>
                  {player.id === localPlayerId && <span className="hud-tag-you">Thou</span>}
                  <span className="hud-damage-pct" style={{ color: damageColor }}>
                    {Math.floor(player.damagePercent)}%
                  </span>
                </div>
                {/* Visual health/damage gauge bar */}
                <div className="hud-bar-container">
                  <div
                    className="hud-bar-fill"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: damageColor,
                      boxShadow: `0 0 6px ${damageColor}`,
                    }}
                  />
                </div>
                {/* Stock life shields */}
                <div className="hud-stocks-row">
                  {Array.from({ length: GAME_CONFIG.STOCKS_PER_PLAYER }).map((_, i) => (
                    <span
                      key={i}
                      className={`stock-shield ${i >= player.stocks ? 'lost' : 'active'}`}
                    >
                      {i >= player.stocks ? '⛊' : '🛡'}
                    </span>
                  ))}
                  {isEliminated && <span className="hud-fallen-label">FALLEN</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom: Ability cooldowns */}
      {localPlayer && localPlayer.isAlive && abilities && (
        <div className="hud-bottom">
          <AbilitySlot
            keyLabel="J"
            name={abilities.basic}
            cooldown={0}
            maxCooldown={0}
          />
          <AbilitySlot
            keyLabel="K"
            name={abilities.ability}
            cooldown={localPlayer.abilityCooldownTimer}
            maxCooldown={ATTACK_DEFS[localPlayer.character][AttackType.ABILITY].cooldown}
          />
          <AbilitySlot
            keyLabel="L"
            name={abilities.ultimate}
            cooldown={localPlayer.ultimateCooldownTimer}
            maxCooldown={ATTACK_DEFS[localPlayer.character][AttackType.ULTIMATE].cooldown}
          />
        </div>
      )}

      {/* Controls hint */}
      <div className="controls-info">
        <div className="control-group">
          <span className="key-badge">A</span>
          <span className="key-badge">D</span>
          Move
        </div>
        <div className="control-group">
          <span className="key-badge">W</span>
          Jump
        </div>
        <div className="control-group">
          <span className="key-badge">J</span>
          Attack
        </div>
        <div className="control-group">
          <span className="key-badge">K</span>
          Ability
        </div>
        <div className="control-group">
          <span className="key-badge">L</span>
          Ultimate
        </div>
      </div>
    </div>
  );
}

interface AbilitySlotProps {
  keyLabel: string;
  name: string;
  cooldown: number;
  maxCooldown: number;
}

function AbilitySlot({ keyLabel, name, cooldown, maxCooldown }: AbilitySlotProps) {
  const isReady = cooldown <= 0;
  const cooldownSec = Math.ceil(cooldown / 60);
  const cdPercent = maxCooldown > 0 ? Math.min(100, (cooldown / maxCooldown) * 100) : 0;

  return (
    <div className={`ability-slot ${isReady ? 'ready' : 'on-cooldown'}`}>
      <div className="ability-key">{keyLabel}</div>
      <div className="ability-name" title={name}>{name}</div>
      {!isReady && (
        <>
          <div
            className="ability-cooldown-progress"
            style={{ height: `${cdPercent}%` }}
          />
          <div className="ability-cooldown-overlay">{cooldownSec}s</div>
        </>
      )}
    </div>
  );
}
