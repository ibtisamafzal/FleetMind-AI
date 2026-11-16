import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart2, 
  Sliders, 
  Truck, 
  MapPin, 
  Phone, 
  Mail, 
  Package, 
  Calendar, 
  AlertTriangle, 
  ArrowRight,
  Award,
  Sparkles,
  FileText,
  ShieldAlert,
  Cpu,
  CheckSquare
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

import LeafletDarkMap from '../components/LeafletDarkMap';
import LiveTelematicsSimulator from '../components/LiveTelematicsSimulator';
import ExecutiveReportModal from '../components/ExecutiveReportModal';
import { api } from '../api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.getDashboardAnalytics().then(setData);
  }, []);

  const handleOpenReport = async () => {
    setReportLoading(true);
    try {
      const rep = await api.getExecutiveReport();
      setReportData(rep);
      setReportModalOpen(true);
    } catch (e) {
      console.error(e);
    } finally {
      setReportLoading(false);
    }
  };

  if (!data) {
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Fleet Intelligence...</div>;
  }

  // Delivery Volume Sparkline Data
  const volumeChartData = {
    labels: data.delivery_volume_chart?.labels || ["W1","W2","W3","W4","W5","W6","W7","W8","W9","W10","W11","W12"],
    datasets: [{
      data: data.delivery_volume_chart?.data || [1120, 1250, 1180, 1340, 1420, 1390, 1480, 1510, 1490, 1530, 1515, 1544],
      borderColor: '#00d084',
      borderWidth: 2.5,
      pointRadius: 0,
      tension: 0.35,
      fill: true,
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 80);
        gradient.addColorStop(0, 'rgba(0, 208, 132, 0.25)');
        gradient.addColorStop(1, 'rgba(0, 208, 132, 0.0)');
        return gradient;
      }
    }]
  };

  // Sales Overview Bar Chart Data (matching screenshot with highlighted bars)
  const salesLabels = data.sales_overview_chart?.labels || ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
  const salesValues = data.sales_overview_chart?.data || [140, 165, 150, 210, 245, 278, 223, 195, 175];
  const barColors = salesValues.map((_, i) => (i >= 4 && i <= 6) ? '#00d084' : '#e2e8f0');

  const salesChartData = {
    labels: salesLabels,
    datasets: [{
      data: salesValues,
      backgroundColor: barColors,
      borderRadius: 4,
      barPercentage: 0.55
    }]
  };

  return (
    <div className="dashboard-grid">
      {/* Top Operations Header Bar with Executive Export Button */}
      <div className="dashboard-top-command-bar">
        <div className="dashboard-command-title">
          <h2>Fleet Command & Real-Time IoT Telematics Stream</h2>
          <p>Continuous sensor streaming across Pakistan freight corridors with automated ML anomaly intercept.</p>
        </div>

        <div className="dashboard-command-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/risk-radar')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 12px' }}
          >
            <ShieldAlert size={14} color="#ef4444" />
            <span>Risk Radar</span>
            <span className="pill-badge badge-high" style={{ fontSize: '10px', padding: '1px 5px' }}>8 High</span>
          </button>

          <button 
            className="btn-secondary"
            onClick={() => navigate('/simulator')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 12px' }}
          >
            <Cpu size={14} color="#3b82f6" />
            <span>Simulator</span>
          </button>

          <button 
            className="btn-secondary"
            onClick={() => navigate('/action-center')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 12px' }}
          >
            <CheckSquare size={14} color="var(--primary)" />
            <span>Action Center</span>
          </button>

          <button 
            className="btn-primary" 
            onClick={handleOpenReport}
            disabled={reportLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', fontSize: '12px' }}
          >
            <Award size={15} />
            {reportLoading ? 'Generating...' : 'Executive Audit'}
          </button>
        </div>
      </div>

      {/* Live Telematics Simulator & Real-Time Incident Stream */}
      <LiveTelematicsSimulator />

      {/* 1. Dark Leaflet Telematics Map */}
      <LeafletDarkMap />

      {/* 2. Lower 3-Column Grid (Exact layout from reference) */}
      <div className="dashboard-lower-grid">
        
        {/* Column 1: Delivery Volume & Live Transit Stats */}
        <div className="col-delivery">
          {/* Delivery Volume Card */}
          <div className="saas-card">
            <div className="card-title-row">
              <div className="card-title-text">
                <BarChart2 size={16} />
                Delivery volume
              </div>
              <Sliders size={16} color="#94a3b8" />
            </div>

            {/* Sparkline */}
            <div style={{ height: '60px', margin: '8px 0' }}>
              <Line 
                data={volumeChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false }, tooltip: { enabled: true } },
                  scales: { x: { display: false }, y: { display: false } }
                }} 
              />
            </div>

            <div className="volume-stats-row">
              <div>
                <div className="stat-big-num">
                  {Number(data.total_deliveries || 1544).toLocaleString()}
                </div>
                <div className="stat-label-sub">Delivered this month</div>
              </div>
              <div>
                <div className="stat-big-num">{data.on_time_rate || 96}%</div>
                <div className="stat-label-sub">Successful deliveries</div>
              </div>
            </div>
          </div>

          {/* Dual Row: Orders in transit & Delayed deliveries */}
          <div className="metric-dual-row">
            <div className="saas-card mini-metric-card">
              <div className="mini-metric-title">Orders in transit</div>
              <div className="mini-metric-val">
                <span>{data.orders_in_transit || 482}</span>
                <svg width="34" height="20" viewBox="0 0 34 20" fill="#00d084">
                  <rect x="0" y="8" width="4" height="12" rx="1"/>
                  <rect x="6" y="4" width="4" height="16" rx="1"/>
                  <rect x="12" y="10" width="4" height="10" rx="1"/>
                  <rect x="18" y="2" width="4" height="18" rx="1"/>
                  <rect x="24" y="6" width="4" height="14" rx="1"/>
                  <rect x="30" y="0" width="4" height="20" rx="1"/>
                </svg>
              </div>
            </div>

            <div className="saas-card mini-metric-card">
              <div className="mini-metric-title">Delayed deliveries</div>
              <div className="mini-metric-val">
                <span>{data.delayed_deliveries || 14}</span>
                <span className="pill-badge badge-active" style={{ fontSize: '11px' }}>4% of all deliveries</span>
              </div>
            </div>
          </div>

          {/* Dual Row: Fuel cost & Avg delivery time */}
          <div className="metric-dual-row">
            <div className="saas-card mini-metric-card">
              <div className="mini-metric-title">Fuel cost this month</div>
              <div className="mini-metric-val">
                <span>{data.fuel_cost_month_display || `₨ ${Number(data.fuel_cost_month || 9190531).toLocaleString()}`}</span>
                <svg width="28" height="16" viewBox="0 0 28 16" fill="none" stroke="#00d084" strokeWidth="2.5">
                  <polyline points="0,14 8,10 16,12 26,2"></polyline>
                </svg>
              </div>
            </div>

            <div className="saas-card mini-metric-card">
              <div className="mini-metric-title">Avg. delivery time</div>
              <div className="mini-metric-val">
                <span style={{ fontSize: '18px' }}>{data.avg_delivery_time_display || '2d 24h 16m'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Vehicles Spotlight (White Truck Render & Robert Reynolds Driver Snippet) */}
        <div className="col-vehicle-spotlight">
          <div className="saas-card vehicles-spotlight-card">
            <div>
              <div className="card-title-row">
                <div className="card-title-text">
                  <Truck size={18} />
                  Vehicles
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>110 Total</span>
              </div>

              {/* 3 Sub-Stats */}
              <div className="vehicle-substats-row">
                <div className="vehicle-substat-box">
                  <div className="substat-num">128</div>
                  <div className="substat-txt">Deliveries</div>
                </div>
                <div className="vehicle-substat-box">
                  <div className="substat-num">92%</div>
                  <div className="substat-txt">On-time Rate</div>
                </div>
                <div className="vehicle-substat-box">
                  <div className="substat-num">1,840</div>
                  <div className="substat-txt">Distance (km)</div>
                </div>
              </div>

              {/* 3D Delivery Truck Render */}
              <div 
                className="truck-render-container" 
                onClick={() => navigate('/vehicles/VH-027')}
                style={{ cursor: 'pointer' }}
                title="Inspect Vehicle VH-027"
              >
                <img 
                  src="/assets/images/delivery_truck.jpg" 
                  alt="Spotlight Truck" 
                  className="truck-render-img"
                />
                <div className="truck-plate-badge">
                  <span>LEA-4823</span>
                  <span className="dot" />
                  <span style={{ color: 'var(--primary)' }}>Active</span>
                </div>
              </div>
            </div>

            {/* Driver Snippet */}
            <div className="driver-snippet-row">
              <div className="driver-info-left">
                <img 
                  src="/assets/images/driver_robert.jpg" 
                  alt="Tariq Mehmood" 
                  className="avatar" 
                />
                <div>
                  <div className="driver-name-text">Tariq Mehmood</div>
                  <div className="driver-role-text">Senior Fleet Captain • Unit VH-027</div>
                </div>
              </div>

              <div className="driver-action-icons">
                <button className="driver-circle-action" title="View In Transit" onClick={() => navigate('/trips')}>
                  <MapPin size={15} />
                </button>
                <button className="driver-circle-action" title="Call Driver" onClick={() => alert('Calling Tariq Mehmood: +92 300 555 0192')}>
                  <Phone size={15} />
                </button>
                <button className="driver-circle-action" title="Message Driver" onClick={() => navigate('/ai-assistant')}>
                  <Mail size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Latest Order & Sales Overview */}
        <div className="col-sales">
          {/* Latest Order Card */}
          <div className="saas-card latest-order-card">
            <div className="card-title-row">
              <div className="card-title-text">
                <Package size={16} />
                Latest Order
              </div>
              <span 
                onClick={() => navigate('/trips')}
                style={{ fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}
              >
                See all
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <div style={{ flex: 1 }}>
                <div className="order-detail-header">
                  <span className="order-id-txt">#PK-846134</span>
                  <span className="pill-badge badge-active">In Transit</span>
                </div>
                <div className="order-address-txt">Sundar Industrial Estate, Lahore</div>
                {/* Progress bar */}
                <div className="order-progress-track">
                  <div className="order-progress-fill" />
                </div>
              </div>

              {/* Mini Dark Map Preview */}
              <div style={{
                width: '78px', height: '60px',
                background: '#111827',
                borderRadius: '12px',
                marginLeft: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ width: '10px', height: '10px', background: '#00d084', borderRadius: '50%', boxShadow: '0 0 10px #00d084' }} />
              </div>
            </div>
          </div>

          {/* Sales Overview Card */}
          <div className="saas-card sales-overview-card">
            <div className="card-title-row">
              <div className="card-title-text">
                Revenue & Transit Volume
              </div>
              <div className="date-pill-tag">
                <span>16 Jun - 1 Sep</span>
                <Calendar size={12} />
              </div>
            </div>

            <div className="sales-big-total">
              <span>₨ 22,346,540</span>
              <span className="pill-badge badge-active" style={{ fontSize: '13px' }}>+32.2%</span>
            </div>

            <div style={{ height: '100px' }}>
              <Bar 
                data={salesChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { color: '#94a3b8', font: { size: 10, family: 'Plus Jakarta Sans' } }
                    },
                    y: { display: false }
                  }
                }} 
              />
            </div>
          </div>
        </div>

      </div>

      {/* Row 3: Vehicles Requiring Attention */}
      <section className="saas-card" style={{ marginTop: '6px' }}>
        <div className="card-title-row">
          <div className="card-title-text">
            <AlertTriangle size={18} color="#ef4444" />
            Vehicles Requiring Operational Attention (ML High-Risk Alert)
          </div>
          <button className="btn-secondary" onClick={() => navigate('/vehicles')}>
            View Entire Fleet <ArrowRight size={14} />
          </button>
        </div>

        <div className="attention-vehicles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '14px', marginTop: '14px' }}>
          {data.vehicles_requiring_attention?.map(v => (
            <div 
              key={v.vehicle_id}
              className="attention-vehicle-card"
              onClick={() => navigate(`/vehicles/${v.vehicle_id}`)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px', height: '44px',
                  borderRadius: '12px',
                  background: '#fee2e2',
                  color: '#ef4444',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '14px'
                }}>
                  {v.risk_score}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
                    {v.vehicle_id} • {v.registration_number}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {v.make_model} • Maint Risk {v.maintenance_risk}%
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="pill-badge badge-high">{v.risk_level}</span>
                <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>Inspect</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Printable Executive Audit Report Modal */}
      {reportModalOpen && (
        <ExecutiveReportModal 
          report={reportData} 
          onClose={() => setReportModalOpen(false)} 
        />
      )}
    </div>
  );
}
