// ============================================================
// Brawl Impact - Settings & Controls Modal
// ============================================================

import { useState } from 'react';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [sfxVolume, setSfxVolume] = useState(() => {
    return parseInt(localStorage.getItem('brawl_sfx_volume') || '80', 10);
  });
  const [showFps, setShowFps] = useState(() => {
    return localStorage.getItem('brawl_show_fps') === 'true';
  });

  const handleSfxChange = (val: number) => {
    setSfxVolume(val);
    localStorage.setItem('brawl_sfx_volume', val.toString());
  };

  const handleFpsToggle = (val: boolean) => {
    setShowFps(val);
    localStorage.setItem('brawl_show_fps', val.toString());
  };

  return (
    <div className="modal-backdrop fade-in" onClick={onClose}>
      <div className="modal-content card fade-in-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h2>⚙ Chamber of Settings ⚙</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ marginTop: 16 }}>
          {/* Controls Table */}
          <div className="settings-section">
            <h4 style={{ color: 'var(--accent-gold)', marginBottom: 8, fontSize: 14 }}>
              ⚜ Combat Controls ⚜
            </h4>
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '10px 14px', fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Move Left / Right</span>
                <span><span className="key-badge">A</span> <span className="key-badge">D</span> or <span className="key-badge">←</span> <span className="key-badge">→</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Jump</span>
                <span><span className="key-badge">W</span> or <span className="key-badge">Space</span> or <span className="key-badge">↑</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Basic Attack</span>
                <span><span className="key-badge">J</span> or <span className="key-badge">Z</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Special Technique</span>
                <span><span className="key-badge">K</span> or <span className="key-badge">X</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Devastating Ultimate</span>
                <span><span className="key-badge">L</span> or <span className="key-badge">C</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '1px solid rgba(162,119,87,0.2)', marginTop: 4, paddingTop: 6 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Reset Training / Telemetry</span>
                <span><span className="key-badge">R</span> / <span className="key-badge">F3</span></span>
              </div>
            </div>
          </div>

          {/* Sound Settings */}
          <div className="settings-section" style={{ marginTop: 18 }}>
            <h4 style={{ color: 'var(--accent-gold)', marginBottom: 8, fontSize: 14 }}>
              ⚜ Sound & Ambience ⚜
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14 }}>Audio Volume</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sfxVolume}
                  onChange={(e) => handleSfxChange(parseInt(e.target.value, 10))}
                  style={{ accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
                />
                <span style={{ width: 32, fontSize: 13, textAlign: 'right' }}>{sfxVolume}%</span>
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div className="settings-section" style={{ marginTop: 18 }}>
            <h4 style={{ color: 'var(--accent-gold)', marginBottom: 8, fontSize: 14 }}>
              ⚜ Display Options ⚜
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14 }}>Show FPS Counter in HUD</span>
              <input
                type="checkbox"
                checked={showFps}
                onChange={(e) => handleFpsToggle(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Main Menu Background Setting */}
          <div className="settings-section" style={{ marginTop: 18 }}>
            <h4 style={{ color: 'var(--accent-gold)', marginBottom: 8, fontSize: 14 }}>
              ⚜ Background Menu Utama ⚜
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                File di <code>frontend/public/assets/background/</code>:
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input"
                  type="text"
                  placeholder="contoh: bg1.jpg atau wallpaper.png"
                  value={localStorage.getItem('brawl_menu_background') || ''}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    if (val) {
                      localStorage.setItem('brawl_menu_background', val);
                    } else {
                      localStorage.removeItem('brawl_menu_background');
                    }
                    // Trigger storage event so MainMenu reacts immediately
                    window.dispatchEvent(new Event('storage'));
                  }}
                  style={{ flex: 1, fontSize: 13 }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    localStorage.removeItem('brawl_menu_background');
                    window.dispatchEvent(new Event('storage'));
                  }}
                  title="Reset ke background default"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: 24, textAlign: 'center' }}>
          <button className="btn btn-gold" onClick={onClose} style={{ minWidth: 140 }}>
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
