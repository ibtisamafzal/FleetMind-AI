import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  Filter, 
  Sliders, 
  ArrowRight, 
  TrendingUp, 
  Cpu, 
  Wrench, 
  Fuel, 
  Clock, 
  CheckCircle2, 
  X, 
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

import { api } from '../api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

export default function RiskRadar() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [urgentOnly, setUrgentOnly] = useState(false);

  // Deep dive vehicle modal state
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [vehicleDetail, setVehicleDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const navigate = useNavigate();

  const loadData = () => {
    setLoading(true);
    const params = {};
    if (riskFilter !== 'All') params.risk_level = riskFilter;
    if (typeFilter !== 'All') params.vehicle_type = typeFilter;
    if (urgentOnly) params.urgent_only = true;
    if (search) params.search = search;

    api.getFleetRiskRadar(params)
      .then(res => {
        setData(res);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [riskFilter, typeFilter, urgentOnly, search]);

  const handleOpenDetail = async (vId) => {
    setSelectedVehicleId(vId);
    setDetailLoading(true);
    try {
      const res = await api.getVehicleRiskDetail(vId);
      setVehicleDetail(res);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const summary = data?.summary || {
    average_risk_score: 48.2,
    high_risk_count: 8,
    medium_risk_count: 85,
    low_risk_count: 17,
    urgent_attention_count: 8
  };

  const vehicles = data?.vehicles || [];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-bar">
        <div className="page-title-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="pill-badge badge-high" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ShieldAlert size={12} /> Real-Time Risk Radar
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Updated via live telematics</span>
          </div>
          <h1>Fleet Risk Radar</h1>
          <p>Holistic commercial asset risk scoring, component vulnerability telemetry, and prioritized interventions.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/simulator')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Cpu size={15} /> What-If Simulator
          </button>
          <button 
            className="btn-primary"
            onClick={() => navigate('/action-center')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <CheckCircle2 size={15} /> Action Center
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="responsive-kpi-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '22px' }}>
        <div className="saas-card mini-metric-card">
          <span className="mini-metric-title">Average Fleet Risk</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span className="mini-metric-val" style={{ color: 'var(--text-main)' }}>{summary.average_risk_score}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/ 100</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Normal range: 35–55</span>
        </div>

        <div className="saas-card mini-metric-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <span className="mini-metric-title">High Risk (Urgent)</span>
          <span className="mini-metric-val" style={{ color: '#ef4444' }}>{summary.high_risk_count} Units</span>
          <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, marginTop: '4px' }}>Score &ge; 70 (Grounding advised)</span>
        </div>

        <div className="saas-card mini-metric-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <span className="mini-metric-title">Medium Risk</span>
          <span className="mini-metric-val" style={{ color: '#f59e0b' }}>{summary.medium_risk_count} Units</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Score 40–69 (Advisory check)</span>
        </div>

        <div className="saas-card mini-metric-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <span className="mini-metric-title">Low Risk (Optimal)</span>
          <span className="mini-metric-val" style={{ color: 'var(--primary)' }}>{summary.low_risk_count} Units</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Score &lt; 40 (Priority cargo)</span>
        </div>

        <div className="saas-card mini-metric-card" style={{ background: 'rgba(239, 68, 68, 0.04)' }}>
          <span className="mini-metric-title" style={{ color: '#ef4444' }}>Overdue Maintenance</span>
          <span className="mini-metric-val" style={{ color: '#ef4444' }}>{summary.urgent_attention_count} Units</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>&gt; 12,000 km threshold</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="toolbar-bar">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-input-box">
            <Search size={16} color="#64748b" />
            <input 
              type="text" 
              placeholder="Search vehicle ID, make, plate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <select className="select-pill" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
              <option value="All">All Risk Tiers</option>
              <option value="HIGH">High Risk (70–100)</option>
              <option value="MEDIUM">Medium Risk (40–69)</option>
              <option value="LOW">Low Risk (&lt; 40)</option>
            </select>

            <select className="select-pill" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="All">All Vehicle Types</option>
              <option value="Box Truck">Box Trucks</option>
              <option value="Cargo Van">Cargo Vans</option>
              <option value="Light Delivery">Light Delivery</option>
            </select>

            <button 
              type="button"
              className={`sort-pill-btn ${urgentOnly ? 'active' : ''}`}
              onClick={() => setUrgentOnly(!urgentOnly)}
              style={{
                border: urgentOnly ? 'none' : '1px solid var(--border-light)',
                background: urgentOnly ? '#ef4444' : 'var(--bg-card-subtle)',
                color: urgentOnly ? '#ffffff' : 'var(--text-main)',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🚨 Urgent Attention Only
            </button>
          </div>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Showing <strong>{vehicles.length}</strong> evaluated assets
        </div>
      </div>

      {/* Main Risk Radar Table */}
      <div className="saas-card" style={{ padding: 0, overflowX: 'auto', marginBottom: '24px' }}>
        <table className="saas-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Rank</th>
              <th>Vehicle Asset</th>
              <th>Operational Risk</th>
              <th style={{ minWidth: '190px' }}>Component Risk Telemetry</th>
              <th>Primary Contributing Root Cause</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Calculating dynamic fleet risk radar...
                </td>
              </tr>
            ) : vehicles.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No vehicles found matching current risk filters.
                </td>
              </tr>
            ) : (
              vehicles.map(v => {
                const isHigh = v.risk_level === 'HIGH';
                const isMed = v.risk_level === 'MEDIUM';
                const badgeColor = isHigh ? 'badge-high' : isMed ? 'badge-medium' : 'badge-low';
                const scoreColor = isHigh ? '#ef4444' : isMed ? '#f59e0b' : 'var(--primary)';

                return (
                  <tr key={v.vehicle_id} style={{ background: isHigh ? 'rgba(239, 68, 68, 0.02)' : 'transparent' }}>
                    <td>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%',
                        background: v.rank <= 3 ? '#ef4444' : 'var(--bg-card-subtle)',
                        color: v.rank <= 3 ? '#ffffff' : 'var(--text-muted)',
                        fontSize: '11px',
                        fontWeight: 800
                      }}>
                        {v.rank}
                      </span>
                    </td>

                    <td>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{v.vehicle_id}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{v.registration_number}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {v.make} {v.model} • <span style={{ color: 'var(--text-secondary)' }}>{v.vehicle_type}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: scoreColor, minWidth: '35px' }}>
                          {v.risk_score}
                        </div>
                        <div style={{ flex: 1, minWidth: '80px' }}>
                          <div style={{ width: '100%', height: '7px', background: 'var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ 
                              width: `${v.risk_score}%`, 
                              height: '100%', 
                              background: scoreColor, 
                              borderRadius: '4px' 
                            }} />
                          </div>
                          <span className={`pill-badge ${badgeColor}`} style={{ marginTop: '4px', fontSize: '10px', padding: '1px 6px' }}>
                            {v.risk_level} RISK
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Wrench size={10} /> Maintenance
                          </span>
                          <strong style={{ color: v.maintenance_risk >= 70 ? '#ef4444' : 'var(--text-main)' }}>{v.maintenance_risk}%</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Fuel size={10} /> Fuel Variance
                          </span>
                          <strong style={{ color: v.fuel_risk >= 70 ? '#ef4444' : 'var(--text-main)' }}>{v.fuel_risk}%</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Clock size={10} /> Delay Rate
                          </span>
                          <strong style={{ color: v.delay_risk >= 65 ? '#ef4444' : 'var(--text-main)' }}>{v.delay_risk}%</strong>
                        </div>
                      </div>
                    </td>

                    <td style={{ maxWidth: '280px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {v.contributing_factors[0]}
                      </div>
                      {v.urgent_attention && (
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '3px', 
                          fontSize: '10px', 
                          fontWeight: 700, 
                          color: '#ef4444',
                          marginTop: '4px' 
                        }}>
                          <AlertTriangle size={10} /> Management Action Required
                        </span>
                      )}
                    </td>

                    <td>
                      <span className={`pill-badge ${v.status === 'Active' ? 'badge-active' : 'badge-idle'}`}>
                        {v.status}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button 
                          className="btn-secondary" 
                          onClick={() => handleOpenDetail(v.vehicle_id)}
                          style={{ padding: '5px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          Deep-Dive <ChevronRight size={12} />
                        </button>
                        <button 
                          className="btn-secondary" 
                          onClick={() => navigate('/simulator', { state: { prefilledVehicle: v.vehicle_id } })}
                          title="Simulate replacing this vehicle in What-If Simulator"
                          style={{ padding: '5px 8px', fontSize: '11px' }}
                        >
                          <Cpu size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Deep-Dive Vehicle Modal */}
      {selectedVehicleId && (
        <div className="modal-overlay" onClick={() => setSelectedVehicleId(null)}>
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="pill-badge badge-high">Unit Risk Analysis</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedVehicleId}</span>
                </div>
                <h2 style={{ margin: '6px 0 0', fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {vehicleDetail?.make_model || selectedVehicleId}
                </h2>
              </div>
              <button className="icon-btn-circle" onClick={() => setSelectedVehicleId(null)}>
                <X size={16} />
              </button>
            </div>

            {detailLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading multi-factor risk diagnostics...
              </div>
            ) : vehicleDetail ? (
              <div>
                {/* Score Header */}
                <div 
                  className="responsive-modal-kpi-4"
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: '12px', 
                  background: 'var(--bg-card-subtle)', 
                  padding: '16px', 
                  borderRadius: '12px',
                  marginBottom: '20px' 
                }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Overall Composite Risk</span>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: vehicleDetail.current_risk.risk_score >= 70 ? '#ef4444' : 'var(--primary)' }}>
                      {vehicleDetail.current_risk.risk_score} / 100
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Maintenance Vulnerability</span>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                      {vehicleDetail.current_risk.maintenance_risk}%
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fuel / Energy Variance</span>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                      {vehicleDetail.current_risk.fuel_risk}%
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Delay Probability</span>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                      {vehicleDetail.current_risk.delay_risk}%
                    </div>
                  </div>
                </div>

                {/* 30-Day Historical Risk Trend Chart */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendingUp size={15} color="var(--primary)" /> 30-Day Historical Risk Trajectory
                  </div>
                  <div style={{ height: '170px' }}>
                    <Line 
                      data={{
                        labels: vehicleDetail.historical_trend.map(h => h.date.split('-').slice(1).join('/')),
                        datasets: [
                          {
                            label: 'Composite Risk Score',
                            data: vehicleDetail.historical_trend.map(h => h.risk_score),
                            borderColor: vehicleDetail.current_risk.risk_score >= 70 ? '#ef4444' : '#00d084',
                            borderWidth: 2,
                            pointRadius: 0,
                            tension: 0.35,
                            fill: true,
                            backgroundColor: 'rgba(239, 68, 68, 0.06)'
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          y: { min: 0, max: 100, ticks: { stepSize: 25 } },
                          x: { grid: { display: false } }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Recommendations */}
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '14px 18px', borderRadius: '12px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)', display: 'block', marginBottom: '6px' }}>
                    🛡️ AI Prescriptive SOP Recommendations
                  </span>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.6 }}>
                    {vehicleDetail.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button 
                    className="btn-secondary"
                    onClick={() => navigate(`/vehicles/${selectedVehicleId}`)}
                  >
                    View Vehicle Record
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={() => {
                      setSelectedVehicleId(null);
                      navigate('/simulator', { state: { prefilledVehicle: selectedVehicleId } });
                    }}
                  >
                    Test in What-If Simulator
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
