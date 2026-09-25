import { useEffect, useState } from 'react';

interface WarriorLeaderboardItem {
  id: number;
  nickname: string;
  matches_played: number;
  matches_won: number;
  win_rate: number;
  total_damage: number;
  favorite_character: string;
}

interface LeaderboardModalProps {
  onClose: () => void;
}

const CHAR_BADGES: Record<string, string> = {
  KNIGHT: '⚔️ Knight',
  MAGE: '🔮 Mage',
  ASSASSIN: '🗡️ Assassin',
  FIGHTER: '👊 Fighter',
};

export function LeaderboardModal({ onClose }: LeaderboardModalProps) {
  const [warriors, setWarriors] = useState<WarriorLeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setWarriors(data.data);
        }
      })
      .catch((err) => console.warn('Leaderboard fetch note:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal-card fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚜ Hall of Fame ⚜</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
          Chronicles of the greatest arena champions recorded by the realm.
        </p>

        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--accent-gold)' }}>
            Consulting the ancient scrolls...
          </div>
        ) : warriors.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
            No legends recorded yet. Step into the arena and claim thy glory!
          </div>
        ) : (
          <div className="leaderboard-table-wrap">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Warrior</th>
                  <th>Role</th>
                  <th>Victories</th>
                  <th>Win Rate</th>
                  <th>Damage</th>
                </tr>
              </thead>
              <tbody>
                {warriors.map((w, index) => (
                  <tr key={w.id} className={index === 0 ? 'rank-gold' : index === 1 ? 'rank-silver' : index === 2 ? 'rank-bronze' : ''}>
                    <td>
                      {index === 0 ? '👑 1st' : index === 1 ? '🥈 2nd' : index === 2 ? '🥉 3rd' : `${index + 1}th`}
                    </td>
                    <td className="warrior-name-cell">{w.nickname}</td>
                    <td>{CHAR_BADGES[w.favorite_character] || w.favorite_character}</td>
                    <td style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>{w.matches_won}</td>
                    <td>{w.win_rate}%</td>
                    <td>{w.total_damage.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Back to Courtyard
          </button>
        </div>
      </div>
    </div>
  );
}
