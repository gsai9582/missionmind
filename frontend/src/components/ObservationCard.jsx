import { useState } from 'react';
import api from '../api';
import { 
  Activity, Thermometer, Wind, AlertTriangle, CheckCircle2, 
  ChevronDown, ChevronUp, Sun, Moon, Sunrise, CloudFog,
  FileText, ExternalLink, HelpCircle, Database, Gauge
} from 'lucide-react';

export default function ObservationCard({ obs, viewMode = 'explorer' }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(obs.analysis_result);
  const [expanded, setExpanded] = useState(false);
  const [detailTab, setDetailTab] = useState('explanation'); // 'explanation' | 'telemetry' | 'citations'

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await api.post(`/observations/${obs._id}/analyze`, {});
      setResult(res.data.analysis_result);
      setExpanded(true);
    } catch (error) {
      console.error('Failed to analyze:', error);
      const detail = error.response?.data?.details || error.response?.data?.error || error.message || 'Unknown error';
      alert(`Analysis failed: ${detail}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // Human-friendly helpers
  const getTimeInfo = (ltst) => {
    if (ltst < 6) return { label: 'Pre-dawn (Coldest)', icon: <Moon size={14} color="#93c5fd" /> };
    if (ltst < 12) return { label: 'Morning Heating', icon: <Sunrise size={14} color="#fde047" /> };
    if (ltst < 18) return { label: 'Afternoon Peak', icon: <Sun size={14} color="#f97316" /> };
    return { label: 'Post-Sunset Cooling', icon: <Moon size={14} color="#cbd5e1" /> };
  };

  const getSeasonInfo = (ls) => {
    if (ls < 90) return `Ls ${ls.toFixed(1)}° • Northern Spring`;
    if (ls < 180) return `Ls ${ls.toFixed(1)}° • Northern Summer`;
    if (ls < 270) return `Ls ${ls.toFixed(1)}° • Northern Autumn`;
    return `Ls ${ls.toFixed(1)}° • Northern Winter`;
  };

  const getAnomalyLabel = (type) => {
    const map = {
      dust_event: { label: 'Dust Devil Vortex', icon: '🌪️', desc: 'Convective low-pressure vortex passage' },
      cold_front: { label: 'Cold Front Passage', icon: '❄️', desc: 'Baroclinic polar wave intrusion' },
      hot_anomaly: { label: 'Thermal Anomaly', icon: '🌡️', desc: 'Midday ground heat plume' },
      nighttime_warming: { label: 'Nighttime Inversion', icon: '🌙', desc: 'Radiative cloud thermal blanket' },
      pressure_wave: { label: 'Gravity Pressure Wave', icon: '〰️', desc: 'Atmospheric wave train over crater rim' },
      pressure_surge: { label: 'Pressure Surge', icon: '📈', desc: 'Sudden regional compression wave' },
      regional_dust_storm: { label: 'Regional Dust Storm', icon: '🌫️', desc: 'Atmospheric opacity and diurnal swing damping' },
      morning_pressure_drop: { label: 'Morning Pressure Drop', icon: '📉', desc: 'Localized thermal suction' },
      evening_cooling_anomaly: { label: 'Evening Cold Anomaly', icon: '❄️', desc: 'Rapid post-sunset radiative cooling' },
      brief_hot_spike: { label: 'Transient Heat Spike', icon: '⚡', desc: 'Short-duration ground thermal plume' },
      pre_dawn_warming: { label: 'Pre-Dawn Warm Surge', icon: '🌅', desc: 'Early atmospheric boundary layer mixing' },
      cold_air_intrusion: { label: 'Cold Air Intrusion', icon: '🧊', desc: 'Dry polar air spill over delta' },
      late_afternoon_spike: { label: 'Late Afternoon Spike', icon: '🔥', desc: 'Residual heat retention in crater floor' },
      sunset_temp_anomaly: { label: 'Sunset Temp Anomaly', icon: '🌆', desc: 'Delayed radiative cooling' },
      dust_lifting: { label: 'Dust Lifting Event', icon: '💨', desc: 'Surface wind gust aerosol suspension' },
    };
    return map[type] || { label: type?.replace('_', ' ') || 'Anomaly', icon: '⚠️', desc: 'Simulated atmospheric event' };
  };

  const timeInfo = getTimeInfo(obs.ltst);
  const seasonText = getSeasonInfo(obs.ls);
  const anomalyInfo = obs.is_anomaly ? getAnomalyLabel(obs.anomaly_type) : null;

  // Temperature progress gauge calculation (-90°C to +5°C range)
  const tempPct = Math.min(100, Math.max(0, ((obs.t_air - (-90)) / (5 - (-90))) * 100));
  // Pressure progress gauge calculation (650 Pa to 800 Pa range)
  const pressPct = Math.min(100, Math.max(0, ((obs.pressure - 650) / (800 - 650)) * 100));

  return (
    <div className={`glass-panel observation-card ${obs.is_anomaly ? 'card-anomaly-highlight' : ''}`}>
      {/* Header */}
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h3 className="card-title">Sol {obs.sol}</h3>
          <span className="card-subsol">LTST {obs.ltst.toFixed(2)}h</span>
        </div>

        <div>
          {obs.is_anomaly ? (
            <span className="badge badge-anomaly" title={anomalyInfo?.desc}>
              {anomalyInfo?.icon} {anomalyInfo?.label}
            </span>
          ) : (
            <span className="badge badge-normal" title="Mars atmospheric weather within seasonal bounds">
              ✓ Normal Mars Climatology
            </span>
          )}
        </div>
      </div>

      {/* Subheader info: Time of day & Season */}
      <div className="card-meta">
        <span className="meta-pill" title="Local True Solar Time on Mars">
          {timeInfo.icon} {timeInfo.label} ({obs.ltst.toFixed(2)})
        </span>
        <span className="meta-pill" title="Solar Longitude determines Mars season">
          🪐 {seasonText}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        {/* Temperature */}
        <div className="metric">
          <div className="metric-label">
            <Thermometer size={14} style={{ display: 'inline', marginRight: '4px', color: '#f87171' }} />
            Air Temp
          </div>
          <div className="metric-value" style={{ color: obs.t_air < -60 ? '#60a5fa' : obs.t_air > -30 ? '#f97316' : '#f8fafc' }}>
            {obs.t_air.toFixed(1)}°C
          </div>
          {/* Visual Range Gauge */}
          <div className="mini-gauge-container" title={`Measured: ${obs.t_air}°C (Typical range: -90°C to +5°C)`}>
            <div className="mini-gauge-fill gauge-temp" style={{ width: `${tempPct}%` }}></div>
          </div>
          <div className="gauge-labels">
            <span>-90°C</span>
            <span>+5°C</span>
          </div>
        </div>

        {/* Pressure */}
        <div className="metric">
          <div className="metric-label">
            <Wind size={14} style={{ display: 'inline', marginRight: '4px', color: '#38bdf8' }} />
            Surface Pressure
          </div>
          <div className="metric-value" style={{ color: '#38bdf8' }}>
            {obs.pressure.toFixed(1)} Pa
          </div>
          {/* Visual Range Gauge */}
          <div className="mini-gauge-container" title={`Measured: ${obs.pressure.toFixed(1)} Pa (Mars normal: ~700-760 Pa)`}>
            <div className="mini-gauge-fill gauge-press" style={{ width: `${pressPct}%` }}></div>
          </div>
          <div className="gauge-labels">
            <span>650 Pa</span>
            <span>800 Pa</span>
          </div>
        </div>
      </div>

      {/* Scientist Telemetry Quick View (when in Scientist mode) */}
      {viewMode === 'scientist' && (
        <div className="scientist-telemetry-badge">
          <span style={{ color: '#94a3b8' }}>Mars Solar Longitude:</span> {obs.ls}° | 
          <span style={{ color: '#94a3b8', marginLeft: '6px' }}>Raw LTST:</span> {obs.ltst.toFixed(2)}h |
          <span style={{ color: '#94a3b8', marginLeft: '6px' }}>Status:</span> {obs.is_anomaly ? `Anomaly (${obs.anomaly_type})` : 'Baseline'}
        </div>
      )}

      {/* Run Analysis Action */}
      {!result && (
        <button 
          className={`btn ${obs.is_anomaly ? 'btn-analyze-anomaly' : ''}`} 
          onClick={handleAnalyze} 
          disabled={analyzing} 
          style={{ width: '100%' }}
        >
          {analyzing ? <Activity className="spinner" size={18} /> : <Activity size={18} />}
          {analyzing ? 'Running Deep Analysis...' : 'Run Physics & RAG Analysis'}
        </button>
      )}

      {/* Analysis Result Drawer */}
      {result && (
        <div className="analysis-result animate-fade-in">
          <div 
            className="analysis-header-clickable"
            onClick={() => setExpanded(!expanded)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {result.anomaly.detected ? (
                <span className="status-indicator status-anomaly">
                  <AlertTriangle size={18} />
                  <span>Anomaly Flagged ({result.anomaly.score.toFixed(2)}σ)</span>
                </span>
              ) : (
                <span className="status-indicator status-normal">
                  <CheckCircle2 size={18} />
                  <span>Normal Climatology ({result.anomaly.score.toFixed(2)}σ)</span>
                </span>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="text-secondary" style={{ fontSize: '0.75rem' }}>
                {expanded ? 'Collapse' : 'Details & Citations'}
              </span>
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
          
          {expanded && (
            <div className="analysis-expanded-body">
              {/* Tabs for Scientist / Explorer details */}
              <div className="analysis-subtabs">
                <button 
                  className={`subtab-btn ${detailTab === 'explanation' ? 'active' : ''}`}
                  onClick={() => setDetailTab('explanation')}
                >
                  <FileText size={14} /> Explanation
                </button>
                <button 
                  className={`subtab-btn ${detailTab === 'telemetry' ? 'active' : ''}`}
                  onClick={() => setDetailTab('telemetry')}
                >
                  <Gauge size={14} /> Telemetry Math
                </button>
                <button 
                  className={`subtab-btn ${detailTab === 'citations' ? 'active' : ''}`}
                  onClick={() => setDetailTab('citations')}
                >
                  <Database size={14} /> NASA Evidence ({result.evidence?.length || 0})
                </button>
              </div>

              {/* Tab 1: Explanation */}
              {detailTab === 'explanation' && (
                <div className="tab-pane animate-fade-in">
                  <div className="explanation-box">
                    <p style={{ lineHeight: '1.6', fontSize: '0.875rem', color: '#e2e8f0' }}>
                      {result.explanation}
                    </p>
                  </div>

                  {result.similar_events?.length > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <strong style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Matching Historical Mission Events:
                      </strong>
                      <div className="similar-events-list">
                        {result.similar_events.slice(0, 2).map((ev) => (
                          <div key={ev.event_id} className="similar-event-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span className="event-id">{ev.event_id}</span>
                              <span className="match-pill">{(ev.similarity * 100).toFixed(0)}% Match</span>
                            </div>
                            <p className="event-summary">{ev.summary}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Telemetry Math / Baselines for Scientists */}
              {detailTab === 'telemetry' && (
                <div className="tab-pane animate-fade-in">
                  <div className="telemetry-table-container">
                    <table className="telemetry-table">
                      <thead>
                        <tr>
                          <th>Telemetry Variable</th>
                          <th>Measured</th>
                          <th>Seasonal Mean (μ)</th>
                          <th>Std Dev (σ)</th>
                          <th>Z-Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.anomaly.baselines && Object.entries(result.anomaly.baselines).map(([varKey, base]) => (
                          <tr key={varKey} className={base.z_score > 2.5 ? 'row-alert' : ''}>
                            <td>
                              <strong>{varKey === 't_air' ? 'Air Temperature' : 'Atmospheric Pressure'}</strong>
                            </td>
                            <td>{base.measured} {base.unit}</td>
                            <td>{base.mean} {base.unit}</td>
                            <td>±{base.std} {base.unit}</td>
                            <td>
                              <span className={`z-pill ${base.z_score > 2.5 ? 'z-pill-alert' : 'z-pill-normal'}`}>
                                {base.z_score.toFixed(2)}σ
                              </span>
                            </td>
                          </tr>
                        ))}
                        {(!result.anomaly.baselines || Object.keys(result.anomaly.baselines).length === 0) && (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8' }}>
                              Composite Z-Score: {result.anomaly.score.toFixed(2)}σ
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="math-explainer">
                    <p>
                      <strong>How it is computed:</strong> Z-Score = <code>|Measured - Baseline Mean| / Baseline Std</code>. 
                      Any variable where <code>z &gt; 2.5σ</code> deviates beyond natural 99% seasonal confidence intervals.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 3: Retrieved Evidence & Citations */}
              {detailTab === 'citations' && (
                <div className="tab-pane animate-fade-in">
                  {result.evidence?.length > 0 ? (
                    <div className="citations-list">
                      {result.evidence.map((chunk) => (
                        <div key={chunk.chunk_id} className="citation-card">
                          <div className="citation-header">
                            <span className="chunk-badge">[{chunk.chunk_id}]</span>
                            <span className="doc-title">{chunk.doc_title}</span>
                            {chunk.source_url && (
                              <a 
                                href={chunk.source_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="source-link"
                                title="Open scientific reference"
                              >
                                <ExternalLink size={13} />
                              </a>
                            )}
                          </div>
                          <p className="citation-snippet">"{chunk.snippet}"</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                      No scientific document chunks retrieved for this baseline observation.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
