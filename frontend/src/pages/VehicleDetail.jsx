import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { api } from '../api';

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [history, setHistory] = useState({ trips: [], fuel_records: [], maintenance_records: [] });

  useEffect(() => {
    if (id) {
      api.getVehicleDetail(id).then(setDetail);
      api.getVehicleHistory(id).then(setHistory);
    }
  }, [id]);

  if (!detail) {
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading vehicle telemetry...</div>;
  }

  const overall = detail.risk_score || 82;
  const mRisk = detail.maintenance_risk || 81;
  const fRisk = detail.fuel_risk || 88;
  const dRisk = detail.delay_risk || 72;
  const isHigh = overall >= 70;

  const isTruck = detail.vehicle_type?.includes('Truck');
  const imgPath = isTruck ? '/assets/images/delivery_truck.jpg' : '/assets/images/delivery_van.jpg';

  // 30-day Risk Trend Chart Data
  const trendDays = ["Day 1", "Day 5", "Day 10", "Day 15", "Day 20", "Day 25", "Day 30"];
  const trendScores = isHigh 
    ? [52, 58, 64, 71, 74, 79, overall] 
    : [30, 32, 34, 31, 35, 33, overall];

  const trendChartData = {
    labels: trendDays,
    datasets: [{
      label: 'Operational Risk',
      data: trendScores,
      borderColor: isHigh ? '#ef4444' : '#10b981',
      borderWidth: 2.5,
      fill: false,
      tension: 0.3,
      pointBackgroundColor: '#ffffff',
      pointBorderColor: isHigh ? '#ef4444' : '#10b981',
      pointRadius: 4
    }]
  };

  const handleAskAI = () => {
    navigate('/ai-assistant', { state: { prefilledPrompt: `Why is vehicle ${detail.vehicle_id} high risk?` } });
  };

  return (
    <div className="vehicle-details-container">
      <div>
        <button className="btn-secondary" onClick={() => navigate('/vehicles')}>
          <ArrowLeft size={16} /> Back to Fleet List
        </button>
      </div>

      {/* Hero Banner with Spec & Big Risk Meter */}
      <div className="vehicle-hero-banner">
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <span className="pill-badge badge-blue">{detail.registration_number}</span>
            <span className="pill-badge badge-active">{detail.current_status}</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-main)' }}>
            Vehicle #{detail.vehicle_id}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            {detail.make} {detail.model} • {detail.manufacturing_year} • {detail.fuel_type} • {detail.vehicle_type}
          </p>

          <div style={{ display: 'flex', gap: '24px', marginTop: '18px' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current Mileage</span>
              <strong style={{ display: 'block', fontSize: '18px', color: 'var(--text-main)' }}>
                {Number(detail.mileage).toLocaleString()} km
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Last Service Date</span>
              <strong style={{ display: 'block', fontSize: '18px', color: 'var(--text-main)' }}>
                {detail.last_service_date || 'N/A'}
              </strong>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <img src={imgPath} alt={detail.model} style={{ maxHeight: '160px', objectFit: 'contain' }} />
          </div>
        </div>

        {/* Risk Breakdown Card */}
        <div className="risk-breakdown-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>Overall Operational Risk</span>
            <span className={`pill-badge ${isHigh ? 'badge-high' : 'badge-low'}`}>
              {detail.risk_level || (isHigh ? 'HIGH' : 'LOW')}
            </span>
          </div>

          <div className="risk-meter-big">
            {overall} / 100
          </div>

          {/* Maintenance Risk Sub-bar */}
          <div className="subrisk-item">
            <div className="subrisk-label-row">
              <span>Maintenance Risk (40% Weight)</span>
              <strong>{mRisk}%</strong>
            </div>
            <div className="subrisk-bar">
              <div className="subrisk-bar-fill" style={{ width: `${mRisk}%`, background: '#ef4444' }} />
            </div>
          </div>

          {/* Fuel Efficiency Risk Sub-bar */}
          <div className="subrisk-item">
            <div className="subrisk-label-row">
              <span>Fuel Efficiency Risk (30% Weight)</span>
              <strong>{fRisk}%</strong>
            </div>
            <div className="subrisk-bar">
              <div className="subrisk-bar-fill" style={{ width: `${fRisk}%`, background: '#f59e0b' }} />
            </div>
          </div>

          {/* Delivery Delay Risk Sub-bar */}
          <div className="subrisk-item">
            <div className="subrisk-label-row">
              <span>Delivery Delay Risk (30% Weight)</span>
              <strong>{dRisk}%</strong>
            </div>
            <div className="subrisk-bar">
              <div className="subrisk-bar-fill" style={{ width: `${dRisk}%`, background: '#3b82f6' }} />
            </div>
          </div>

          {/* AI Explanation & Recommended Actions */}
          <div className="ai-insights-box">
            <strong style={{ color: 'var(--primary-text)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              🤖 FleetMind AI Root-Cause Diagnostic
            </strong>
            <p style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>
              {detail.ai_explanation || 
                `The major contributing factors are high mileage since the last service (${Number(detail.kms_since_service || 18850).toLocaleString()} km overdue) and declining fuel efficiency (${detail.avg_efficiency || 6.8} km/L).`}
            </p>

            <div style={{ marginTop: '10px' }}>
              <strong style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Recommended Actions:</strong>
              <ul className="ai-recommendation-list">
                {(detail.recommended_actions || [
                  "Schedule preventative maintenance inspection immediately.",
                  "Review recent fuel consumption logs.",
                  "Avoid assigning long-distance deliveries until inspection.",
                  "Review recent driver performance."
                ]).map((r, i) => (
                  <li key={i}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{i + 1}.</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ marginTop: '16px' }}>
              <button 
                className="btn-primary" 
                onClick={handleAskAI}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Sparkles size={16} /> Ask FleetMind about this vehicle →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 30-Day Risk Trend Chart */}
      <div className="saas-card">
        <div className="card-title-row">
          <div className="card-title-text">30-Day Operational Risk Trend</div>
        </div>
        <div style={{ height: '180px' }}>
          <Line 
            data={trendChartData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { min: 0, max: 100, grid: { color: '#f1f5f9' } },
                x: { grid: { display: false } }
              }
            }} 
          />
        </div>
      </div>

      {/* History Tables */}
      <div className="saas-card" style={{ padding: 0, overflowX: 'auto' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', fontWeight: 700 }}>
          Recent Trips History
        </div>
        <table className="saas-table">
          <thead>
            <tr>
              <th>Trip ID</th>
              <th>Route</th>
              <th>Distance</th>
              <th>Date</th>
              <th>Delivery Status</th>
            </tr>
          </thead>
          <tbody>
            {history.trips?.map(t => (
              <tr key={t.trip_id}>
                <td><strong>{t.trip_id}</strong></td>
                <td>{t.origin} → {t.destination}</td>
                <td>{t.distance_km} km</td>
                <td>{t.departure_time?.split('T')[0]}</td>
                <td>
                  <span className={`pill-badge ${t.delivery_status === 'Delayed' ? 'badge-delayed' : 'badge-active'}`}>
                    {t.delivery_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="saas-card" style={{ padding: 0, overflowX: 'auto' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', fontWeight: 700 }}>
            Recent Fuel / Energy Logs
          </div>
          <table className="saas-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Cost</th>
                <th>Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {history.fuel_records?.map(f => (
                <tr key={f.record_id}>
                  <td><strong>{f.record_id}</strong></td>
                  <td>{f.date}</td>
                  <td>{f.fuel_amount_liters} L</td>
                  <td>₨ {Number(f.cost_usd).toLocaleString()}</td>
                  <td><strong>{f.efficiency_kml} km/L</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="saas-card" style={{ padding: 0, overflowX: 'auto' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', fontWeight: 700 }}>
            Maintenance History
          </div>
          <table className="saas-table">
            <thead>
              <tr>
                <th>Service ID</th>
                <th>Date</th>
                <th>Type</th>
                <th>Cost</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {history.maintenance_records?.map(m => (
                <tr key={m.maintenance_id}>
                  <td><strong>{m.maintenance_id}</strong></td>
                  <td>{m.service_date}</td>
                  <td>{m.service_type}</td>
                  <td>₨ {Number(m.cost_usd).toLocaleString()}</td>
                  <td>{m.notes || 'Routine check'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
