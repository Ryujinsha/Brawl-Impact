// ============================================================
// Brawl Impact - Result Screen Page
// Supports both authoritative 1v1 Duel victory/defeat and FFA ranking summary
// ============================================================

import { GameResult, CharacterType } from '@shared/types';
import { socketClient } from '../network/SocketClient';

interface ResultScreenProps {
  result: GameResult;
  localPlayerId: string;
  onReturnToLobby: () => void;
  onReturnToMainMenu?: () => void;
}

const CHAR_ICONS: Record<CharacterType, string> = {
  [CharacterType.KNIGHT]: '⚔️',
  [CharacterType.MAGE]: '🔮',
  [CharacterType.ASSASSIN]: '🗡️',
  [CharacterType.FIGHTER]: '👊',
};

const PLACEMENT_LABELS = ['🏆', '🥈', '🥉', '4th'];

export function ResultScreen({
  result,
  localPlayerId,
  onReturnToLobby,
  onReturnToMainMenu,
}: ResultScreenProps) {
  const isWinner = result.winnerId === localPlayerId;
  const is1v1 = result.mode === '1v1' || result.rankings.length === 2;

  const handleRematch = () => {
    socketClient.returnToLobby();
    onReturnToLobby();
  };

  const handleMainMenu = () => {
    socketClient.leaveRoom();
    if (onReturnToMainMenu) {
      onReturnToMainMenu();
    } else {
      onReturnToLobby();
    }
  };

  // Winner ranking entry
  const winnerRanking = result.rankings.find((r) => r.playerId === result.winnerId);
  const winnerChar = result.winnerCharacter || winnerRanking?.character || CharacterType.KNIGHT;
  const winnerStocks = result.winnerStocksRemaining ?? winnerRanking?.stocksRemaining ?? 1;

  return (
    <div className="result-screen">
      {/* 1v1 Result Header */}
      {is1v1 ? (
        <>
          <h1 className={`result-title fade-in-up ${isWinner ? 'text-gold' : ''}`}>
            {isWinner ? '⚜ GLORIOUS VICTORY ⚜' : '⚔ HONORABLE DEFEAT ⚔'}
          </h1>
          <p className="result-winner fade-in-up" style={{ fontSize: 22, marginTop: 8 }}>
            Champion: <span>{result.winnerNickname}</span>{' '}
            <span style={{ fontSize: 26, verticalAlign: 'middle' }}>{CHAR_ICONS[winnerChar]}</span>
          </p>

          {/* Stocks Remaining Display */}
          <div className="duel-result-stocks fade-in-up">
            <span>Stocks Remaining:</span>
            <div style={{ display: 'inline-flex', gap: 6, marginLeft: 8 }}>
              {Array.from({ length: Math.max(1, winnerStocks) }).map((_, i) => (
                <span key={i} className="duel-stocks-shield">
                  🛡
                </span>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Classic FFA Result Header */
        <>
          <h1 className="result-title fade-in-up">
            {isWinner ? 'GLORIOUS VICTORY!' : 'THOU ART FALLEN'}
          </h1>
          <p className="result-winner fade-in-up">
            Champion: <span>{result.winnerNickname}</span>
          </p>
        </>
      )}

      {/* Rankings List */}
      <div className="rankings-list fade-in-up">
        {result.rankings.map((ranking, index) => (
          <div
            key={ranking.playerId}
            className={`ranking-item ${ranking.playerId === result.winnerId ? 'is-winner-item' : ''}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="ranking-place">
              {PLACEMENT_LABELS[ranking.placement - 1] || ranking.placement}
            </div>
            <div style={{ fontSize: 28 }}>{CHAR_ICONS[ranking.character]}</div>
            <div className="ranking-info">
              <div className="ranking-name">
                {ranking.nickname}
                {ranking.playerId === localPlayerId && (
                  <span style={{ color: 'var(--accent-gold)', marginLeft: 8, fontSize: 13 }}>(You)</span>
                )}
                {ranking.playerId === result.winnerId && (
                  <span style={{ color: '#44d76b', marginLeft: 8, fontSize: 12 }}>★ Champion</span>
                )}
              </div>
              <div className="ranking-stats">
                Damage Dealt: <strong>{ranking.damageDealt}</strong>
                {ranking.stocksRemaining !== undefined && ` • Stocks: ${ranking.stocksRemaining}`}
                {ranking.eliminatedBy && ` • Fallen in battle`}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions: Rematch and Return to Main Menu */}
      <div className="result-actions fade-in-up" style={{ display: 'flex', gap: 16 }}>
        <button className="btn btn-gold btn-lg" onClick={handleRematch}>
          Rematch
        </button>
        <button className="btn btn-secondary btn-lg" onClick={handleMainMenu}>
          Main Menu
        </button>
      </div>
    </div>
  );
}
