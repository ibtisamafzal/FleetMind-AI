import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Radio, 
  AlertTriangle, 
  Activity, 
  Zap, 
  Gauge, 
  Thermometer, 
  Droplet, 
  Compass, 
  Sparkles, 
  X, 
  CheckCircle2, 
  Volume2 
} from 'lucide-react';
import { api } from '../api';

export default function LiveTelematicsSimulator() {
  const navigate = useNavigate();
  const [streamData, setStreamData] = useState(null);
  const [activeIncident, setActiveIncident] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Poll live telematics stream every 4 seconds
  useEffect(() => {
    let isMounted = true;
    const fetchStream = async () => {
      try {
        const res = await api.getLiveTelematicsStream();
        if (isMounted && res) {
          setStreamData(res);
        }
      } catch (err) {
        console.warn('Telematics fetch error', err);
      }
    };

    fetchStream();
    const interval = setInterval(fetchStream, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Cycle current vehicle in ticker
  useEffect(() => {
    if (!streamData?.vehicles?.length) return;
    const cycleInterval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % streamData.vehicles.length);
    }, 3200);
    return () => clearInterval(cycleInterval);
  }, [streamData]);

  const handleSimulate = async (type) => {
    setIsSimulating(true);
    try {
      const incident = await api.simulateIncident(type);
      setActiveIncident(incident);
      // Play soft notification beep using Web Audio API if supported
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 650;
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } catch {
        // audio context optional
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  const currentVehicle = streamData?.vehicles?.[currentIndex] || {
    vehicle_id: "VH-027",
    plate: "LEA-4823",
    driver: "Tariq Mehmood",
    corridor: "M-2 Motorway (Bhera KM 142)",
    speed_kmh: 78,
    engine_temp_c: 84,
    fuel_pct: 68,
    tire_pressure_psi: 105
  };

  return (
    <div className="telematics-simulator-container">
      {/* Ticker & Status Bar */}
      <div className="telematics-bar">
        {/* Status Pill */}
        <div className="telematics-status-pill">
          <span className="telematics-pulse-dot" />
          <span className="telematics-status-text">LIVE TELEMATICS STREAM</span>
          <span className="telematics-unit-badge">110 UNITS ACTIVE</span>
        </div>

        {/* Live Moving Ticker */}
        <div className="telematics-ticker-track">
          <div className="telematics-ticker-item">
            <strong style={{ color: 'var(--text-main)' }}>{currentVehicle.vehicle_id}</strong>
            <span className="plate-tag">{currentVehicle.plate}</span>
            <span style={{ color: 'var(--text-muted)' }}>({currentVehicle.driver})</span>
            <span className="corridor-tag">{currentVehicle.corridor}</span>
            <span className="metric-tag">
              <Gauge size={13} color="#00d084" /> {currentVehicle.speed_kmh} km/h
            </span>
            <span className="metric-tag">
              <Thermometer size={13} color={currentVehicle.engine_temp_c > 95 ? '#ef4444' : '#3b82f6'} /> {currentVehicle.engine_temp_c}°C
            </span>
            <span className="metric-tag">
              <Droplet size={13} color="#f59e0b" /> {currentVehicle.fuel_pct}% Fuel
            </span>
          </div>
        </div>

        {/* Live Incident Simulator Controls (For Presentation/Evaluators) */}
        <div className="telematics-actions-group">
          <span className="simulator-label">Simulate Live Incident:</span>
          <button 
            className="sim-btn sim-btn-danger" 
            onClick={() => handleSimulate('overspeeding')}
            disabled={isSimulating}
            title="Simulate 106 km/h on Kallar Kahar descent"
          >
            🚨 Overspeeding
          </button>
          <button 
            className="sim-btn sim-btn-warning" 
            onClick={() => handleSimulate('engine_overheat')}
            disabled={isSimulating}
            title="Simulate 107°C coolant overheating on M-4"
          >
            ⚠️ Overheat
          </button>
          <button 
            className="sim-btn sim-btn-info" 
            onClick={() => handleSimulate('harsh_braking')}
            disabled={isSimulating}
            title="Simulate emergency deceleration on N-5"
          >
            ⚡ Harsh Brake
          </button>
          <button 
            className="sim-btn sim-btn-purple" 
            onClick={() => handleSimulate('fuel_siphon')}
            disabled={isSimulating}
            title="Simulate abrupt stationary fuel drop"
          >
            ⛽ Fuel Drop
          </button>
        </div>
      </div>

      {/* Floating Real-Time Incident Toast/Modal if triggered */}
      {activeIncident && (
        <div className="live-incident-card">
          <div className="incident-card-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="incident-pulse-beacon" />
              <strong style={{ color: '#ef4444', fontSize: '13px' }}>
                LIVE ANOMALY DETECTED • {activeIncident.incident_id}
              </strong>
              <span className="pill-badge badge-high" style={{ fontSize: '10px', padding: '2px 6px' }}>
                {activeIncident.severity}
              </span>
            </div>
            <button className="icon-btn-circle" style={{ width: '24px', height: '24px' }} onClick={() => setActiveIncident(null)}>
              <X size={14} />
            </button>
          </div>

          <div className="incident-card-body">
            <div>
              <div className="incident-title">{activeIncident.type}</div>
              <div className="incident-meta">
                Unit: <strong>{activeIncident.vehicle_id}</strong> ({activeIncident.plate}) • Driver: <strong>{activeIncident.driver}</strong>
              </div>
              <div className="incident-location">📍 {activeIncident.location}</div>
            </div>

            <div className="incident-telemetry-pill">
              {Object.entries(activeIncident.telemetry || {}).map(([k, v]) => (
                <div key={k} className="telemetry-pill-item">
                  <span className="telemetry-key">{k.replace('_', ' ')}:</span>
                  <span className="telemetry-val">{v}</span>
                </div>
              ))}
            </div>

            <div className="incident-ai-recommendation">
              <Sparkles size={14} color="var(--primary)" />
              <span><strong>AI Directive:</strong> {activeIncident.ai_action}</span>
            </div>

            <div className="incident-buttons-row">
              <button 
                className="btn-primary" 
                style={{ fontSize: '11px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                onClick={() => {
                  navigate('/ai-assistant');
                }}
              >
                <Sparkles size={13} /> Open in Fleet AI Assistant
              </button>
              <button 
                className="btn-secondary" 
                style={{ fontSize: '11px', padding: '5px 10px' }}
                onClick={() => {
                  alert(`Intervention order dispatched to in-cabin telematics unit for ${activeIncident.vehicle_id}.`);
                  setActiveIncident(null);
                }}
              >
                <CheckCircle2 size={13} color="#10b981" /> Acknowledge & Dispatch Intervention
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

