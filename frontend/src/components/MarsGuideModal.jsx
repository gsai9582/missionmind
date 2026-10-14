import { X, BookOpen, Sun, Wind, Thermometer, Compass, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

export default function MarsGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="icon-badge icon-badge-purple">
              <BookOpen size={22} color="#c084fc" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>Mars Weather & Simulation Guide</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Understand how NASA Perseverance MEDA data, Mars seasons, and anomalies work
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Section 1: The Basics */}
          <div className="guide-card">
            <h3 className="guide-card-title">
              <Compass size={18} color="#818cf8" /> 1. The Core Mars Terminology
            </h3>
            <div className="guide-grid">
              <div className="guide-item">
                <span className="guide-term">Sol</span>
                <p className="guide-desc">
                  A Martian solar day. It lasts <strong>24 hours, 39 minutes, and 35 seconds</strong>—just a bit longer than an Earth day. Our dataset tracks Sols 1 through 100 of the Perseverance mission.
                </p>
              </div>

              <div className="guide-item">
                <span className="guide-term">LTST (Local True Solar Time)</span>
                <p className="guide-desc">
                  The local solar wall-clock on Mars (from 00:00 midnight to 12:00 noon to 24:00). Mars is coldest just before dawn (~05:30 LTST) and warmest in early afternoon (~14:00 LTST).
                </p>
              </div>

              <div className="guide-item">
                <span className="guide-term">Ls (Solar Longitude)</span>
                <p className="guide-desc">
                  Measures Mars' position in orbit around the Sun (0° to 360°), determining the <strong>Martian Seasons</strong>:
                  <br />• <strong>0°–90°:</strong> Northern Spring (Perseverance landed at Ls ≈ 5.2°)
                  <br />• <strong>90°–180°:</strong> Northern Summer (Aphelion: farthest from Sun)
                  <br />• <strong>180°–270°:</strong> Northern Autumn
                  <br />• <strong>270°–360°:</strong> Northern Winter (Perihelion: closest & dust storm season)
                </p>
              </div>

              <div className="guide-item">
                <span className="guide-term">Pressure (Pa)</span>
                <p className="guide-desc">
                  Mars has an ultra-thin atmosphere composed of 95% CO₂. While Earth's sea-level pressure is <strong>101,325 Pa</strong>, Mars pressure in Jezero Crater is only <strong>~700 to 850 Pa</strong> (less than 1% of Earth!).
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Simulated Anomalies */}
          <div className="guide-card">
            <h3 className="guide-card-title">
              <AlertTriangle size={18} color="#f59e0b" /> 2. What Are the Simulated Anomalies?
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: '1.5' }}>
              Over 97% of observations follow normal baseline Martian weather. However, Perseverance's MEDA sensor suite regularly captures dramatic dynamic events:
            </p>

            <div className="anomaly-types-grid">
              <div className="anomaly-type-box">
                <div className="anomaly-type-header">
                  <span className="anomaly-icon">🌪️</span>
                  <strong>Dust Devil / Convective Vortex</strong>
                </div>
                <p>
                  Intense midday ground heat triggers spinning columns of low-pressure air. As a vortex sweeps over the rover, pressure plummets by <strong>20–60 Pa</strong> within minutes, while warm dust-laden air raises the temperature (+15°C to +30°C).
                </p>
                <span className="sol-tag">See: Sol 12, Sol 60</span>
              </div>

              <div className="anomaly-type-box">
                <div className="anomaly-type-header">
                  <span className="anomaly-icon">❄️</span>
                  <strong>Cold Front / Baroclinic Wave</strong>
                </div>
                <p>
                  Synoptic polar weather fronts sweeping across the northern plains into Jezero Crater. Marked by sudden sharp cooling (<strong>-15°C to -25°C below normal</strong>) and rising atmospheric pressure in pre-dawn hours.
                </p>
                <span className="sol-tag">See: Sol 25, Sol 68</span>
              </div>

              <div className="anomaly-type-box">
                <div className="anomaly-type-header">
                  <span className="anomaly-icon">〰️</span>
                  <strong>Gravity Wave / Pressure Surge</strong>
                </div>
                <p>
                  High-speed winds blowing over the Jezero crater rim create atmospheric ripples (gravity waves). These manifest as strong pressure surges (<strong>+40 to +60 Pa</strong>) with little or no temperature change.
                </p>
                <span className="sol-tag">See: Sol 52, Sol 55</span>
              </div>

              <div className="anomaly-type-box">
                <div className="anomaly-type-header">
                  <span className="anomaly-icon">🌫️</span>
                  <strong>Regional Dust Storm</strong>
                </div>
                <p>
                  Enormous dust clouds blot out sunlight. Daytime peak temperatures drop because sunlight is obscured, while night temperatures stay abnormally warm because dust acts as an insulating thermal blanket.
                </p>
                <span className="sol-tag">See: Sol 82</span>
              </div>

              <div className="anomaly-type-box">
                <div className="anomaly-type-header">
                  <span className="anomaly-icon">🌙</span>
                  <strong>Nighttime Thermal Warming</strong>
                </div>
                <p>
                  High-altitude ice/dust clouds or warm air advection break the normal freezing radiative nocturnal inversion, keeping ground temperatures unexpectedly high (+30°C to +60°C above expected -80°C).
                </p>
                <span className="sol-tag">See: Sol 45</span>
              </div>
            </div>
          </div>

          {/* Section 3: The AI & Science Pipeline */}
          <div className="guide-card">
            <h3 className="guide-card-title">
              <Zap size={18} color="#10b981" /> 3. How the MissionMind Analysis System Works
            </h3>
            <div className="pipeline-steps">
              <div className="pipeline-step">
                <div className="step-num">1</div>
                <div>
                  <strong>Seasonal Z-Score Detection (Code-Based Math)</strong>
                  <p>
                    Compares temperature and pressure against pre-computed baselines binned by hour (LTST) and season (Ls). A Z-score <strong>z &gt; 2.5σ</strong> means the reading is mathematically rare and flags an Anomaly.
                  </p>
                </div>
              </div>

              <div className="pipeline-step">
                <div className="step-num">2</div>
                <div>
                  <strong>Historical Event Matching (Cosine Similarity)</strong>
                  <p>
                    Searches an indexed catalog of known Mars missions to see if Perseverance or previous rovers (Curiosity, Viking) encountered identical signatures.
                  </p>
                </div>
              </div>

              <div className="pipeline-step">
                <div className="step-num">3</div>
                <div>
                  <strong>Evidence Retrieval (Hybrid BM25 + Vector RAG)</strong>
                  <p>
                    Queries 15+ curated NASA scientific papers and MEDA technical documents, retrieving exact paragraphs explaining the physical mechanism.
                  </p>
                </div>
              </div>

              <div className="pipeline-step">
                <div className="step-num">4</div>
                <div>
                  <strong>Scientific Explanation Generator</strong>
                  <p>
                    Produces a clear explanation citing exact document chunks (e.g. <code>[CONVECTIVE_VORTICES]</code>). If evidence is insufficient, it strictly refuses to hallucinate.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose} style={{ minWidth: '140px' }}>
            Got it, Let's Explore!
          </button>
        </div>
      </div>
    </div>
  );
}
