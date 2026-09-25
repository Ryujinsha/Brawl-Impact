// ============================================================
// Brawl Impact - Result Screen Page
// ============================================================

import { GameResult, CharacterType } from '@shared/types';
import { socketClient } from '../network/SocketClient';

interface ResultScreenProps {
  result: GameResult;
  localPlayerId: string;
  onReturnToLobby: () => void;
}

const CHAR_ICONS: Record<CharacterType, string> = {
  [CharacterType.KNIGHT]: '⚔️',
  [CharacterType.MAGE]: '🔮',
  [CharacterType.ASSASSIN]: '🗡️',
  [CharacterType.FIGHTER]: '👊',
};

const PLACEMENT_LABELS = ['🏆', '🥈', '🥉', '4th'];

export function ResultScreen({ result, localPlayerId, onReturnToLobby }: ResultScreenProps) {
  const handleRematch = () => {
    socketClient.returnToLobby();
    onReturnToLobby();
  };

  const isWinner = result.winnerId === localPlayerId;

  return (
    <div className="result-screen">
      <h1 className="result-title fade-in-up">
        {isWinner ? 'GLORIOUS VICTORY!' : 'THOU ART FALLEN'}
      </h1>
      <p className="result-winner fade-in-up">
        Champion: <span>{result.winnerNickname}</span>
      </p>

      <div className="rankings-list fade-in-up">
        {result.rankings.map((ranking, index) => (
          <div
            key={ranking.playerId}
            className="ranking-item"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="ranking-place">
              {PLACEMENT_LABELS[ranking.placement - 1] || ranking.placement}
            </div>
            <div style={{ fontSize: 24 }}>
              {CHAR_ICONS[ranking.character]}
            </div>
            <div className="ranking-info">
              <div className="ranking-name">
                {ranking.nickname}
                {ranking.playerId === localPlayerId && (
                  <span style={{ color: 'var(--accent-primary)', marginLeft: 8, fontSize: 12 }}>(You)</span>
                )}
              </div>
              <div className="ranking-stats">
                Damage dealt: {ranking.damageDealt}
                {ranking.eliminatedBy && ` • Eliminated by another player`}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="result-actions fade-in-up">
        <button className="btn btn-primary btn-lg" onClick={handleRematch}>
          Return to the Keep
        </button>
      </div>
    </div>
  );
}
