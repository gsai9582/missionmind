import { useState, useEffect } from 'react';
import api from '../api';
import ObservationCard from '../components/ObservationCard';
import MarsGuideModal from '../components/MarsGuideModal';
import { 
  Activity, Filter, Search, RotateCcw, AlertTriangle, 
  HelpCircle, Compass, Sparkles, BarChart2, ShieldAlert,
  ChevronLeft, ChevronRight, Layers, Eye
} from 'lucide-react';

const SIMULATED_EVENTS = [
  { sol: 12, title: 'Sol 12: Dust Devil', icon: '🌪️', type: 'dust_event', desc: 'Pressure drop -30 Pa, temp spike +15°C' },
  { sol: 15, title: 'Sol 15: Heat Spike', icon: '⚡', type: 'brief_hot_spike', desc: 'Transient midday thermal spike' },
  { sol: 25, title: 'Sol 25: Cold Front', icon: '❄️', type: 'cold_front', desc: 'Pre-dawn cold front -20°C' },
  { sol: 33, title: 'Sol 33: Pre-dawn Warm', icon: '🌅', type: 'pre_dawn_warming', desc: 'Early boundary layer heat mixing' },
  { sol: 37, title: 'Sol 37: Thermal Plume', icon: '🌡️', type: 'hot_anomaly', desc: 'Afternoon surface heat plume' },
  { sol: 45, title: 'Sol 45: Night Inversion', icon: '🌙', type: 'nighttime_warming', desc: 'Radiative cloud thermal blanket' },
  { sol: 52, title: 'Sol 52: Gravity Wave', icon: '〰️', type: 'pressure_wave', desc: 'Mesoscale pressure surge +50 Pa' },
  { sol: 55, title: 'Sol 55: Pressure Surge', icon: '📈', type: 'pressure_surge', desc: 'High-amplitude pressure wave' },
  { sol: 60, title: 'Sol 60: Dust Lifting', icon: '💨', type: 'dust_lifting', desc: 'Boundary layer aerosol suspension' },
  { sol: 68, title: 'Sol 68: Polar Spill', icon: '🧊', type: 'cold_air_intrusion', desc: 'Pre-dawn cold air intrusion' },
  { sol: 73, title: 'Sol 73: Late Spike', icon: '🔥', type: 'late_afternoon_spike', desc: 'Afternoon ground heat retention' },
  { sol: 78, title: 'Sol 78: Sunset Temp', icon: '🌆', type: 'sunset_temp_anomaly', desc: 'Rapid radiative cooling post-sunset' },
  { sol: 82, title: 'Sol 82: Dust Storm', icon: '🌫️', type: 'regional_dust_storm', desc: 'Regional storm, all-sol opacity' },
  { sol: 91, title: 'Sol 91: Pressure Drop', icon: '📉', type: 'morning_pressure_drop', desc: 'Morning localized suction' },
  { sol: 95, title: 'Sol 95: Evening Cold', icon: '❄️', type: 'evening_cooling_anomaly', desc: 'Rapid radiative cooling' }
];

export default function Dashboard() {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters & State
  const [onlyAnomalies, setOnlyAnomalies] = useState(false);
  const [solFilter, setSolFilter] = useState('');
  const [selectedAnomalyType, setSelectedAnomalyType] = useState('all');
  const [viewMode, setViewMode] = useState('explorer'); // 'explorer' | 'scientist'
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [stats, setStats] = useState(null);

  // Fetch telemetry overview statistics
  const fetchStats = async () => {
    try {
      const res = await api.get('/observations/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // Fetch observations with applied filters
  const fetchObservations = async (pageNum, overrides = {}) => {
    setLoading(true);
    try {
      const anomalyParam = overrides.onlyAnomalies !== undefined ? overrides.onlyAnomalies : onlyAnomalies;
      const solParam = overrides.solFilter !== undefined ? overrides.solFilter : solFilter;
      const typeParam = overrides.selectedAnomalyType !== undefined ? overrides.selectedAnomalyType : selectedAnomalyType;

      let url = `/observations?page=${pageNum}&limit=12`;
      if (anomalyParam) url += `&is_anomaly=true`;
      if (solParam) url += `&sol=${solParam}`;
      if (typeParam && typeParam !== 'all') url += `&anomaly_type=${typeParam}`;

      const res = await api.get(url);
      setObservations(res.data.observations);
      setTotalPages(res.data.totalPages);
      setPage(res.data.page);
      setTotalCount(res.data.total);
    } catch (error) {
      console.error('Failed to fetch observations', error);
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchObservations(1);
  }, []);

  // Quick jump to a simulated anomaly event
  const handleQuickJump = (event) => {
    setSolFilter(String(event.sol));
    setOnlyAnomalies(false);
    setSelectedAnomalyType('all');
    fetchObservations(1, { solFilter: String(event.sol), onlyAnomalies: false, selectedAnomalyType: 'all' });
  };

  // Reset all filters
  const handleResetFilters = () => {
    setOnlyAnomalies(false);
    setSolFilter('');
    setSelectedAnomalyType('all');
    fetchObservations(1, { onlyAnomalies: false, solFilter: '', selectedAnomalyType: 'all' });
  };

  const handleToggleAnomaliesOnly = (enabled) => {
    setOnlyAnomalies(enabled);
    fetchObservations(1, { onlyAnomalies: enabled });
  };

  const handleSolSearchSubmit = (e) => {
    e.preventDefault();
    fetchObservations(1);
  };

  return (
    <div className="animate-fade-in dashboard-wrapper">
      {/* Mars Weather & Simulation Guide Modal */}
      <MarsGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* Top Banner: Mission Telemetry & Stats */}
      <div className="glass-panel mission-banner">
        <div className="mission-banner-left">
          <div className="rover-badge">
            <span className="live-dot"></span> NASA Perseverance Rover • Jezero Crater (18.38°N)
          </div>
          <h2 className="banner-title">Mars Environmental Dynamics Analyzer (MEDA)</h2>
          <p className="banner-desc">
            Evidence-grounded climatology and anomaly detection across Sols 1–100.
          </p>
        </div>

        <div className="mission-banner-actions">
          <button 
            className="btn btn-secondary guide-btn" 
            onClick={() => setIsGuideOpen(true)}
            title="Learn how Mars weather, seasons, and anomalies work"
          >
            <Compass size={18} color="#c084fc" />
            <span>Mars Science Guide</span>
          </button>

          {/* View Mode Toggle: Explorer vs Scientist */}
          <div className="view-mode-toggle" title="Switch between beginner Explorer view and rigorous Scientist view">
            <button 
              className={`mode-btn ${viewMode === 'explorer' ? 'active' : ''}`}
              onClick={() => setViewMode('explorer')}
            >
              <Sparkles size={14} /> Explorer View
            </button>
            <button 
              className={`mode-btn ${viewMode === 'scientist' ? 'active' : ''}`}
              onClick={() => setViewMode('scientist')}
            >
              <BarChart2 size={14} /> Scientist View
            </button>
          </div>
        </div>
      </div>

      {/* Telemetry Quick Stats Cards */}
      <div className="stats-overview-grid">
        <div className="glass-panel stat-card">
          <div className="stat-label">Total Observations</div>
          <div className="stat-val">{stats?.totalObservations || 2400}</div>
          <div className="stat-sub">Sols 1 – 100 Monitored</div>
        </div>

        <div className="glass-panel stat-card stat-card-alert">
          <div className="stat-label">Anomalies Injected</div>
          <div className="stat-val" style={{ color: '#f87171' }}>
            {stats?.anomalyCount || 78} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>({stats?.anomalyPercentage || '3.2'}%)</span>
          </div>
          <div className="stat-sub">14 Distinct Mars Events</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-label">Baseline Climatology</div>
          <div className="stat-val" style={{ color: '#34d399' }}>
            {stats?.normalCount || 2322} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>({(100 - (stats?.anomalyPercentage || 3.2)).toFixed(1)}%)</span>
          </div>
          <div className="stat-sub">Normal Seasonal Diurnal Cycles</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-label">Current View</div>
          <div className="stat-val" style={{ textTransform: 'capitalize', color: '#818cf8' }}>
            {viewMode} Mode
          </div>
          <div className="stat-sub">
            {viewMode === 'explorer' ? 'Plain English & visual gauges' : 'Z-Scores & document citations'}
          </div>
        </div>
      </div>

      {/* Quick-Jump Carousel: Simulated Mars Events */}
      <div className="quick-jump-container glass-panel">
        <div className="quick-jump-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={16} color="#f59e0b" />
            <strong style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f8fafc' }}>
              Jump to Simulated Anomaly Events:
            </strong>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Click any event to inspect that Sol</span>
        </div>

        <div className="quick-jump-pills">
          {SIMULATED_EVENTS.map((ev) => (
            <button
              key={ev.sol}
              className={`pill-btn ${solFilter === String(ev.sol) ? 'active' : ''}`}
              onClick={() => handleQuickJump(ev)}
              title={`${ev.desc} (Sol ${ev.sol})`}
            >
              <span className="pill-icon">{ev.icon}</span>
              <span className="pill-title">{ev.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Controls Toolbar */}
      <div className="glass-panel filter-toolbar">
        {/* Toggle Anomalies vs All */}
        <div className="filter-group">
          <button 
            className={`btn-filter ${!onlyAnomalies ? 'active' : ''}`}
            onClick={() => handleToggleAnomaliesOnly(false)}
          >
            All Data ({totalCount})
          </button>
          <button 
            className={`btn-filter ${onlyAnomalies ? 'active-alert' : ''}`}
            onClick={() => handleToggleAnomaliesOnly(true)}
          >
            <AlertTriangle size={14} /> Anomalies Only
          </button>
        </div>

        {/* Search by Sol */}
        <form onSubmit={handleSolSearchSubmit} className="sol-search-form">
          <Search size={16} color="#94a3b8" />
          <input 
            type="number" 
            placeholder="Search Sol (1-100)..." 
            value={solFilter}
            onChange={(e) => setSolFilter(e.target.value)}
            min="1"
            max="100"
            className="search-input"
          />
          <button type="submit" className="btn btn-secondary btn-sm">Find</button>
        </form>

        {/* Anomaly Type Dropdown */}
        <div className="dropdown-filter">
          <select 
            value={selectedAnomalyType} 
            onChange={(e) => {
              setSelectedAnomalyType(e.target.value);
              fetchObservations(1, { selectedAnomalyType: e.target.value });
            }}
            className="select-field"
          >
            <option value="all">All Anomaly Types</option>
            <option value="dust_event">🌪️ Dust Devil Vortex</option>
            <option value="cold_front">❄️ Cold Front</option>
            <option value="pressure_wave">〰️ Gravity Pressure Wave</option>
            <option value="pressure_surge">📈 Pressure Surge</option>
            <option value="regional_dust_storm">🌫️ Regional Dust Storm</option>
            <option value="nighttime_warming">🌙 Nighttime Inversion</option>
            <option value="hot_anomaly">🌡️ Thermal Heat Plume</option>
            <option value="cold_air_intrusion">🧊 Cold Air Intrusion</option>
            <option value="dust_lifting">💨 Dust Lifting</option>
          </select>
        </div>

        {/* Reset button if filters active */}
        {(onlyAnomalies || solFilter || selectedAnomalyType !== 'all') && (
          <button className="btn btn-secondary btn-sm" onClick={handleResetFilters} title="Reset all filters">
            <RotateCcw size={14} /> Reset
          </button>
        )}
      </div>

      {/* Main Observations Grid */}
      {loading ? (
        <div className="loading-state">
          <Activity className="spinner" size={48} color="var(--accent-color)" />
          <p style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '0.95rem' }}>
            Fetching Mars MEDA sensor telemetry...
          </p>
        </div>
      ) : observations.length === 0 ? (
        <div className="glass-panel empty-state">
          <AlertTriangle size={48} color="#f59e0b" style={{ marginBottom: '1rem' }} />
          <h3>No Observations Found</h3>
          <p style={{ color: '#94a3b8', maxWidth: '400px', margin: '0.5rem auto 1.5rem' }}>
            No data matched your current filter criteria (Sol: {solFilter || 'Any'}, Type: {selectedAnomalyType}).
          </p>
          <button className="btn" onClick={handleResetFilters}>
            Clear Filters & Show All Sols
          </button>
        </div>
      ) : (
        <div className="dashboard-grid">
          {observations.map((obs) => (
            <ObservationCard 
              key={obs._id} 
              obs={obs} 
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && totalPages > 1 && (
        <div className="pagination-bar glass-panel">
          <button 
            className="btn btn-secondary" 
            disabled={page === 1}
            onClick={() => fetchObservations(page - 1)}
          >
            <ChevronLeft size={16} /> Prev
          </button>
          
          <span className="pagination-info">
            Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} observations)
          </span>

          <button 
            className="btn btn-secondary" 
            disabled={page === totalPages}
            onClick={() => fetchObservations(page + 1)}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
