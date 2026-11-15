import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UploadCloud, Zap, X, Compass, Route, ListFilter } from 'lucide-react';
import { api } from '../api';
import RouteOptimizer from '../components/RouteOptimizer';

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [status, setStatus] = useState('All');
  const [activeTab, setActiveTab] = useState('optimizer'); // 'optimizer', 'trips', 'delay_predictor'
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvStatus, setCsvStatus] = useState('');

  // ML Predictor state
  const [predictForm, setPredictForm] = useState({
    distance_km: 185.0,
    estimated_duration: 150,
    number_of_stops: 3,
    traffic_level: 'High',
    weather_condition: 'Winter Fog/Smog',
    hour_of_day: 19,
    day_of_week: 4,
    driver_id: 'DRV-001',
    vehicle_id: 'VH-027'
  });
  const [predictionResult, setPredictionResult] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);

  useEffect(() => {
    api.getTrips(status !== 'All' ? { status } : {}).then(setTrips);
  }, [status]);

  const handlePredictSubmit = async (e) => {
    e.preventDefault();
    setIsPredicting(true);
    const res = await api.predictDelay(predictForm);
    setPredictionResult(res);
    setIsPredicting(false);
  };

  const handleTripDispatched = (dispatchedTrip) => {
    api.getTrips().then(setTrips);
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCsvStatus(`Uploading and parsing ${file.name}...`);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/trips/upload-csv', {
        method: 'POST',
        headers: api.getToken() ? { 'Authorization': `Bearer ${api.getToken()}` } : {},
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setCsvStatus(`✓ ${data.message}`);
        api.getTrips().then(setTrips);
      } else {
        setCsvStatus(`Error: ${data.detail || 'Upload failed'}`);
      }
    } catch (err) {
      setCsvStatus(`Upload error: ${err.message}`);
    }
  };

  return (
    <div>
      <div className="page-header-bar">
        <div className="page-title-box">
          <h1>Trips & Route Intelligence</h1>
          <p>AI-powered minimum traffic route optimization, real-time dispatching, and ML delay probability prediction.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={() => setIsCsvModalOpen(true)}>
            <UploadCloud size={16} /> Bulk CSV Upload
          </button>
          <button 
            className="btn-primary" 
            onClick={() => setActiveTab('optimizer')}
          >
            <Compass size={16} /> AI Route Optimizer
          </button>
        </div>
      </div>

      {/* Feature Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '22px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('optimizer')}
          style={{
            padding: '8px 18px',
            borderRadius: 'var(--radius-pill)',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: activeTab === 'optimizer' ? 'var(--primary)' : 'var(--bg-card)',
            color: activeTab === 'optimizer' ? '#ffffff' : 'var(--text-secondary)',
            boxShadow: activeTab === 'optimizer' ? '0 4px 12px rgba(0, 208, 132, 0.35)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <Compass size={16} /> 🛣️ AI Route & Traffic Optimizer (Model #3)
        </button>

        <button
          onClick={() => setActiveTab('trips')}
          style={{
            padding: '8px 18px',
            borderRadius: 'var(--radius-pill)',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: activeTab === 'trips' ? 'var(--primary)' : 'var(--bg-card)',
            color: activeTab === 'trips' ? '#ffffff' : 'var(--text-secondary)',
            boxShadow: activeTab === 'trips' ? '0 4px 12px rgba(0, 208, 132, 0.35)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <ListFilter size={16} /> 📋 All Trips & Deliveries ({trips.length})
        </button>

        <button
          onClick={() => setActiveTab('delay_predictor')}
          style={{
            padding: '8px 18px',
            borderRadius: 'var(--radius-pill)',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: activeTab === 'delay_predictor' ? 'var(--primary)' : 'var(--bg-card)',
            color: activeTab === 'delay_predictor' ? '#ffffff' : 'var(--text-secondary)',
            boxShadow: activeTab === 'delay_predictor' ? '0 4px 12px rgba(0, 208, 132, 0.35)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <Zap size={16} /> ⚡ ML Delay Predictor (Model #1)
        </button>
      </div>

      {/* TAB 1: AI Route & Minimum Traffic Optimizer */}
      {activeTab === 'optimizer' && (
        <RouteOptimizer onTripDispatched={handleTripDispatched} />
      )}

      {/* TAB 2: Delay Predictor Card */}
      {activeTab === 'delay_predictor' && (
        <div id="delayPredictorCard" className="saas-card" style={{ marginBottom: '24px', border: '2px solid var(--primary)' }}>
          <div className="card-title-row">
            <div className="card-title-text" style={{ color: 'var(--primary-text)', fontSize: '16px' }}>
              <Zap size={18} /> ML Model #1: Real-Time Delivery Delay Predictor
            </div>
            <span className="pill-badge badge-active">Random Forest & Logistic Regression Engine</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Simulate any dispatch route or traffic condition to evaluate delay probability before driver departs.
          </p>

          <form onSubmit={handlePredictSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Distance (km)</label>
              <input 
                type="number" 
                className="select-pill" 
                style={{ width: '100%' }}
                value={predictForm.distance_km}
                onChange={(e) => setPredictForm({ ...predictForm, distance_km: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Est. Duration (min)</label>
              <input 
                type="number" 
                className="select-pill" 
                style={{ width: '100%' }}
                value={predictForm.estimated_duration}
                onChange={(e) => setPredictForm({ ...predictForm, estimated_duration: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Stops</label>
              <input 
                type="number" 
                className="select-pill" 
                style={{ width: '100%' }}
                value={predictForm.number_of_stops}
                onChange={(e) => setPredictForm({ ...predictForm, number_of_stops: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Traffic Level</label>
              <select 
                className="select-pill" 
                style={{ width: '100%' }}
                value={predictForm.traffic_level}
                onChange={(e) => setPredictForm({ ...predictForm, traffic_level: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Severe">Severe</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Weather</label>
              <select 
                className="select-pill" 
                style={{ width: '100%' }}
                value={predictForm.weather_condition}
                onChange={(e) => setPredictForm({ ...predictForm, weather_condition: e.target.value })}
              >
                <option value="Clear">Clear</option>
                <option value="Monsoon Rain">Monsoon Rain</option>
                <option value="Winter Fog/Smog">Winter Fog/Smog</option>
                <option value="Extreme Summer Heat">Extreme Summer Heat</option>
                <option value="Dust Storm">Dust Storm</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Hour of Day (0-23)</label>
              <input 
                type="number" 
                min="0" max="23"
                className="select-pill" 
                style={{ width: '100%' }}
                value={predictForm.hour_of_day}
                onChange={(e) => setPredictForm({ ...predictForm, hour_of_day: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Day of Week</label>
              <select 
                className="select-pill" 
                style={{ width: '100%' }}
                value={predictForm.day_of_week}
                onChange={(e) => setPredictForm({ ...predictForm, day_of_week: parseInt(e.target.value) })}
              >
                <option value={0}>Monday</option>
                <option value={1}>Tuesday</option>
                <option value={2}>Wednesday</option>
                <option value={3}>Thursday</option>
                <option value={4}>Friday</option>
                <option value={5}>Saturday</option>
                <option value={6}>Sunday</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Driver ID</label>
              <input 
                type="text" 
                className="select-pill" 
                style={{ width: '100%' }}
                value={predictForm.driver_id}
                onChange={(e) => setPredictForm({ ...predictForm, driver_id: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Vehicle ID</label>
              <input 
                type="text" 
                className="select-pill" 
                style={{ width: '100%' }}
                value={predictForm.vehicle_id}
                onChange={(e) => setPredictForm({ ...predictForm, vehicle_id: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={isPredicting}>
                {isPredicting ? 'Evaluating ML...' : 'Run ML Inference'}
              </button>
            </div>
          </form>

          {predictionResult && (
            <div style={{
              background: predictionResult.risk_level === 'HIGH' ? '#fee2e2' : '#f0fdf4',
              border: `1px solid ${predictionResult.risk_level === 'HIGH' ? '#fca5a5' : '#bbf7d0'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '18px',
              marginTop: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ color: '#111827', fontSize: '15px' }}>ML Delivery Delay Output</strong>
                <span className={`pill-badge ${predictionResult.risk_level === 'HIGH' ? 'badge-high' : 'badge-low'}`}>
                  {predictionResult.risk_level} RISK
                </span>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: predictionResult.risk_level === 'HIGH' ? '#ef4444' : '#059669', marginBottom: '4px' }}>
                {Math.round(predictionResult.delay_probability * 100)}% Probability
              </div>
              <p style={{ fontSize: '13px', color: '#4b5563', marginBottom: '8px' }}>
                Predicted Outcome: <strong>{predictionResult.prediction}</strong>
              </p>
              <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.round(predictionResult.delay_probability * 100)}%`, height: '100%', background: predictionResult.risk_level === 'HIGH' ? '#ef4444' : '#10b981' }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Trips Table */}
      {activeTab === 'trips' && (
        <>
          <div className="toolbar-bar">
            <div className="filter-group">
              <select className="select-pill" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="All">All Delivery Statuses</option>
                <option value="On Time">On Time</option>
                <option value="Delayed">Delayed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="saas-card" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="saas-table">
              <thead>
                <tr>
                  <th>Trip ID</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Route</th>
                  <th>Distance</th>
                  <th>Est / Act Duration</th>
                  <th>Stops</th>
                  <th>Traffic</th>
                  <th>Weather</th>
                  <th>Delivery Status</th>
                </tr>
              </thead>
              <tbody>
                {trips.map(t => {
                  let statusClass = 'badge-active';
                  if (t.delivery_status === 'Delayed') statusClass = 'badge-delayed';
                  else if (t.delivery_status === 'Cancelled') statusClass = 'badge-medium';

                  return (
                    <tr key={t.trip_id}>
                      <td><strong>{t.trip_id}</strong></td>
                      <td>
                        <Link to={`/vehicles/${t.vehicle_id}`} style={{ color: 'var(--primary-text)', fontWeight: 700 }}>
                          {t.vehicle_id}
                        </Link>
                      </td>
                      <td>{t.driver_id}</td>
                      <td>{t.origin} → {t.destination}</td>
                      <td>{t.distance_km} km</td>
                      <td>{t.estimated_duration}m / {t.actual_duration ? `${t.actual_duration}m` : '--'}</td>
                      <td>{t.number_of_stops}</td>
                      <td><span className="pill-badge badge-blue">{t.traffic_level}</span></td>
                      <td><span className="pill-badge" style={{ background: '#f1f5f9', color: '#475569' }}>{t.weather_condition}</span></td>
                      <td><span className={`pill-badge ${statusClass}`}>{t.delivery_status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Bulk CSV Modal */}
      {isCsvModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>Bulk CSV Historical Trips Upload</h3>
              <button onClick={() => setIsCsvModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Upload a historical delivery CSV file with columns: <code>trip_id, vehicle_id, driver_id, origin, destination, distance_km, estimated_duration</code>.
            </p>

            <label style={{ display: 'block', border: '2px dashed var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '32px', textAlign: 'center', marginBottom: '18px', cursor: 'pointer' }}>
              <UploadCloud size={36} color="var(--primary)" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>Click to Select CSV File</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>or drag and drop trips.csv here</div>
              <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSVUpload} />
            </label>

            {csvStatus && (
              <div style={{ fontSize: '13px', marginBottom: '12px', color: 'var(--primary-text)', fontWeight: 600 }}>
                {csvStatus}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setIsCsvModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
