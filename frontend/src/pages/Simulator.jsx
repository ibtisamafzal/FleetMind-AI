import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Cpu, 
  Sliders, 
  Play, 
  ArrowRight, 
  Info, 
} from 'lucide-react';
import { api } from '../api';

export default function Simulator() {
  const location = useLocation();

  const [scenarios, setScenarios] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [alternatives, setAlternatives] = useState([]);

  // Simulation Inputs
  const [scenarioType, setScenarioType] = useState('remove_high_risk');
  const [targetVehicle, setTargetVehicle] = useState(location.state?.prefilledVehicle || 'VH-027');
  const [alternativeVehicle, setAlternativeVehicle] = useState('auto');
  const [volumeChangePct, setVolumeChangePct] = useState(0);
  const [weather, setWeather] = useState('Clear');
  const [traffic, setTraffic] = useState('Medium');

  // Simulation Output
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getSimulatorScenarios().then(setScenarios);
    api.getVehicles().then(res => setVehicles(res || []));
  }, []);

  // Fetch alternative recommendations when target vehicle changes
  useEffect(() => {
    if (targetVehicle) {
      api.getSimulatorAlternatives(targetVehicle).then(res => {
        setAlternatives(res?.recommended_alternatives || []);
      });
    }
  }, [targetVehicle]);

  // Run simulation
  const handleRunSimulation = async (customParams = null) => {
    setLoading(true);
    const payload = customParams || {
      scenario_type: scenarioType,
      target_vehicle_id: targetVehicle,
      alternative_vehicle_id: alternativeVehicle,
      volume_change_pct: volumeChangePct,
      weather_condition: weather,
      traffic_level: traffic
    };

    try {
      const res = await api.runFleetSimulation(payload);
      setSimulationResult(res);
    } catch (e) {
      console.error('Simulation error', e);
    } finally {
      setLoading(false);
    }
  };

  // Run initial simulation on load
  // oxlint-disable react-hooks/exhaustive-deps
  useEffect(() => {
    // The initial simulation intentionally reruns only when the scenario changes.
    // oxlint-disable-next-line react/set-state-in-effect
    handleRunSimulation();
  }, [scenarioType]);
  // oxlint-enable react-hooks/exhaustive-deps

  const applyPreset = (sc) => {
    setScenarioType(sc.id);
    const p = sc.default_params;
    if (p.target_vehicle_id !== undefined) setTargetVehicle(p.target_vehicle_id);
    if (p.alternative_vehicle_id !== undefined) setAlternativeVehicle(p.alternative_vehicle_id);
    if (p.volume_change_pct !== undefined) setVolumeChangePct(p.volume_change_pct);
    if (p.weather_condition !== undefined) setWeather(p.weather_condition);
    if (p.traffic_level !== undefined) setTraffic(p.traffic_level);

    handleRunSimulation({
      scenario_type: sc.id,
      target_vehicle_id: p.target_vehicle_id,
      alternative_vehicle_id: p.alternative_vehicle_id,
      volume_change_pct: p.volume_change_pct || 0,
      weather_condition: p.weather_condition || 'Clear',
      traffic_level: p.traffic_level || 'Medium'
    });
  };

  const before = simulationResult?.before || {
    on_time_rate_pct: 92.4,
    delay_rate_pct: 7.6,
    avg_delay_minutes: 34.5,
    fleet_utilization_pct: 85.5,
    average_risk_score: 48.2,
    monthly_fuel_cost_usd: 58420.0,
    active_fleet_count: 94
  };

  const after = simulationResult?.after || before;
  const delta = simulationResult?.delta || { delay_rate_pct: 0, risk_score: 0, utilization_pct: 0, monthly_fuel_cost_usd: 0 };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-bar">
        <div className="page-title-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="pill-badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Cpu size={12} /> Predictive Digital Twin
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Interactive Operational Sandbox</span>
          </div>
          <h1>What-If Fleet Simulator</h1>
          <p>Model dispatch reallocations, demand surges, and asset groundings before real-world execution.</p>
        </div>

        <button 
          className="btn-primary"
          onClick={() => handleRunSimulation()}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '13px' }}
        >
          <Play size={15} fill="currentColor" />
          {loading ? 'Simulating...' : 'Run Simulation'}
        </button>
      </div>

      {/* Mandatory Academic & Enterprise Simulation Disclaimer */}
      <div style={{
        background: 'rgba(59, 130, 246, 0.05)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        borderRadius: '12px',
        padding: '12px 18px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Info size={18} color="#3b82f6" />
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong>SIMULATION ENVIRONMENT:</strong> Projected outputs are analytical estimates generated via machine learning models and historical telematics baselines. Results simulate potential outcomes to support management decisions and are strictly labeled as simulated projections.
        </div>
      </div>

      {/* Preset Scenario Selector Pills */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Select Pre-configured Operational Scenario:
        </div>
        <div className="scenario-pills-row" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {scenarios.map(sc => (
            <button
              key={sc.id}
              type="button"
              className={`scenario-pill-btn ${scenarioType === sc.id ? 'active' : ''}`}
              onClick={() => applyPreset(sc)}
            >
              <span>{sc.name}</span>
            </button>
          ))}
          <button
            type="button"
            className={`scenario-pill-btn ${scenarioType === 'custom' ? 'active' : ''}`}
            onClick={() => setScenarioType('custom')}
          >
            <span>Custom Scenario</span>
          </button>
        </div>
      </div>

      {/* Simulator Controls & Parameters Bar */}
      <div className="saas-card" style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={16} color="var(--primary)" /> Simulation Input Parameters
        </div>

        <div className="responsive-sim-inputs" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'flex-start' }}>
          {/* Target Vehicle */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
              TARGET ASSET INTERVENTION
            </label>
            <select
              className="sort-dropdown-select"
              style={{ width: '100%', borderRadius: '10px' }}
              value={targetVehicle || ''}
              onChange={(e) => setTargetVehicle(e.target.value)}
            >
              <option value="">None (Fleet-wide Volume)</option>
              {vehicles.map(v => (
                <option key={v.vehicle_id} value={v.vehicle_id}>
                  {v.vehicle_id} ({v.make} {v.model}) - {v.risk_level} Risk
                </option>
              ))}
            </select>
          </div>

          {/* Alternative Vehicle Picker */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
              REASSIGNMENT ALTERNATIVE
            </label>
            <select
              className="sort-dropdown-select"
              style={{ width: '100%', borderRadius: '10px' }}
              value={alternativeVehicle}
              onChange={(e) => setAlternativeVehicle(e.target.value)}
            >
              <option value="auto">Auto-Select Best Available</option>
              {alternatives.map(a => (
                <option key={a.vehicle_id} value={a.vehicle_id}>
                  {a.vehicle_id} ({a.make_model}) - {a.suitability_score}% Match
                </option>
              ))}
            </select>
          </div>

          {/* Volume Surge Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>DAILY FREIGHT VOLUME SHIFT</label>
              <strong style={{ fontSize: '11px', color: volumeChangePct >= 0 ? 'var(--primary)' : '#ef4444' }}>
                {volumeChangePct > 0 ? `+${volumeChangePct}%` : `${volumeChangePct}%`}
              </strong>
            </div>
            <input 
              type="range" 
              min="-30" 
              max="50" 
              step="5" 
              value={volumeChangePct}
              onChange={(e) => setVolumeChangePct(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
          </div>

          {/* Weather & Traffic Condition */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
              ENVIRONMENTAL CONDITIONS
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                className="sort-dropdown-select"
                style={{ flex: 1, borderRadius: '10px' }}
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
              >
                <option value="Clear">Clear Weather</option>
                <option value="Fog">Winter Fog / Smog</option>
                <option value="Rain">Monsoon Rain</option>
                <option value="Storm">Severe Dust Storm</option>
              </select>

              <select
                className="sort-dropdown-select"
                style={{ flex: 1, borderRadius: '10px' }}
                value={traffic}
                onChange={(e) => setTraffic(e.target.value)}
              >
                <option value="Low">Low Traffic</option>
                <option value="Medium">Medium</option>
                <option value="High">High Peak</option>
                <option value="Severe">Severe Jam</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Before vs After Cards */}
      <div className="responsive-kpi-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {/* Metric 1: Delivery Delay Rate */}
        <div className="saas-card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Predicted Delivery Delay Rate</span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '10px 0 6px' }}>
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Current: </span>
              <strong>{before.delay_rate_pct}%</strong>
            </div>
            <ArrowRight size={14} color="var(--text-muted)" />
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Simulated: </span>
              <strong style={{ fontSize: '18px', color: delta.delay_rate_pct <= 0 ? 'var(--primary)' : '#ef4444' }}>
                {after.delay_rate_pct}%
              </strong>
            </div>
          </div>
          <span className={`pill-badge ${delta.delay_rate_pct <= 0 ? 'badge-active' : 'badge-idle'}`} style={{ fontSize: '10px' }}>
            {delta.delay_rate_pct <= 0 ? `Delays reduced by ${Math.abs(delta.delay_rate_pct)}%` : `Delays increased by +${delta.delay_rate_pct}%`}
          </span>
        </div>

        {/* Metric 2: Average Risk Score */}
        <div className="saas-card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Fleet Operational Risk Index</span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '10px 0 6px' }}>
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Current: </span>
              <strong>{before.average_risk_score}</strong>
            </div>
            <ArrowRight size={14} color="var(--text-muted)" />
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Simulated: </span>
              <strong style={{ fontSize: '18px', color: delta.risk_score <= 0 ? 'var(--primary)' : '#ef4444' }}>
                {after.average_risk_score}
              </strong>
            </div>
          </div>
          <span className={`pill-badge ${delta.risk_score <= 0 ? 'badge-active' : 'badge-idle'}`} style={{ fontSize: '10px' }}>
            {delta.risk_score <= 0 ? `Risk dropped by ${Math.abs(delta.risk_score)} pts` : `Risk increased by +${delta.risk_score} pts`}
          </span>
        </div>

        {/* Metric 3: Fleet Utilization */}
        <div className="saas-card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Projected Fleet Utilization</span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '10px 0 6px' }}>
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Current: </span>
              <strong>{before.fleet_utilization_pct}%</strong>
            </div>
            <ArrowRight size={14} color="var(--text-muted)" />
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Simulated: </span>
              <strong style={{ fontSize: '18px', color: 'var(--text-main)' }}>
                {after.fleet_utilization_pct}%
              </strong>
            </div>
          </div>
          <span className="pill-badge badge-blue" style={{ fontSize: '10px' }}>
            {after.active_fleet_count} commercial units active
          </span>
        </div>

        {/* Metric 4: Monthly Fuel Cost */}
        <div className="saas-card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Simulated Monthly Fuel Cost</span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '10px 0 6px' }}>
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Current: </span>
              <strong>₨ {Number(before.monthly_fuel_cost_pkr || before.monthly_fuel_cost_usd || 16357600).toLocaleString()}</strong>
            </div>
            <ArrowRight size={14} color="var(--text-muted)" />
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Simulated: </span>
              <strong style={{ fontSize: '18px', color: (delta.monthly_fuel_cost_pkr || delta.monthly_fuel_cost_usd || 0) <= 0 ? 'var(--primary)' : '#ef4444' }}>
                ₨ {Number(after.monthly_fuel_cost_pkr || after.monthly_fuel_cost_usd || 16357600).toLocaleString()}
              </strong>
            </div>
          </div>
          <span className={`pill-badge ${(delta.monthly_fuel_cost_pkr || delta.monthly_fuel_cost_usd || 0) <= 0 ? 'badge-active' : 'badge-idle'}`} style={{ fontSize: '10px' }}>
            {(delta.monthly_fuel_cost_pkr || delta.monthly_fuel_cost_usd || 0) <= 0 ? `Saved ₨ ${Math.abs(Math.round(delta.monthly_fuel_cost_pkr || delta.monthly_fuel_cost_usd || 0)).toLocaleString()}` : `+₨ ${Math.round(delta.monthly_fuel_cost_pkr || delta.monthly_fuel_cost_usd || 0).toLocaleString()} delta`}
          </span>
        </div>
      </div>

      {/* Analytical Explanation of Results */}
      <div className="saas-card" style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
          📊 Simulation Impact Analysis
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 12px 0' }}>
          {simulationResult?.explanation || 'Simulating operational scenario impacts across fleet metrics.'}
        </p>

        {simulationResult?.detailed_reasons?.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {simulationResult.detailed_reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Best Alternatives Table */}
      {targetVehicle && alternatives.length > 0 && (
        <div className="saas-card" style={{ padding: 0, overflowX: 'auto', marginBottom: '24px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>Recommended Replacement Candidates for {targetVehicle}</strong>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ranked by vehicle suitability score, low operational risk, and service buffer.</div>
            </div>
          </div>

          <table className="saas-table">
            <thead>
              <tr>
                <th>Candidate Asset</th>
                <th>Type & Fuel</th>
                <th>Risk Profile</th>
                <th>Service Buffer</th>
                <th>Suitability Score</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {alternatives.map(a => (
                <tr key={a.vehicle_id} style={{ background: a.is_best_alternative ? 'rgba(0, 208, 132, 0.04)' : 'transparent' }}>
                  <td>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong>{a.vehicle_id}</strong>
                        {a.is_best_alternative && (
                          <span className="pill-badge badge-active" style={{ fontSize: '10px' }}>Best Match</span>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{a.make_model}</span>
                    </div>
                  </td>
                  <td>{a.vehicle_type} • {a.fuel_type}</td>
                  <td>
                    <span className={`pill-badge ${a.risk_level === 'LOW' ? 'badge-low' : 'badge-medium'}`}>
                      {a.risk_score} / 100 ({a.risk_level})
                    </span>
                  </td>
                  <td>{Number(a.kms_since_service || 0).toLocaleString()} km logged</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ color: 'var(--primary)', fontSize: '14px' }}>{a.suitability_score}%</strong>
                      <div style={{ width: '80px', height: '6px', background: 'var(--border-subtle)', borderRadius: '3px' }}>
                        <div style={{ width: `${a.suitability_score}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px' }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn-secondary" 
                      onClick={() => setAlternativeVehicle(a.vehicle_id)}
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                    >
                      Select as Alternative
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
