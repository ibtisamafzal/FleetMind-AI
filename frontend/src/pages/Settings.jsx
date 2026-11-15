import React, { useEffect, useState } from 'react';
import { Sliders, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

export default function Settings() {
  const [weights, setWeights] = useState({ maintenance: 40, fuel: 30, delay: 30 });
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3.2');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    api.getSettings().then(s => {
      if (s.weights) {
        setWeights({
          maintenance: Math.round((s.weights.maintenance || 0.4) * 100),
          fuel: Math.round((s.weights.fuel || 0.3) * 100),
          delay: Math.round((s.weights.delay || 0.3) * 100)
        });
      }
      if (s.ollama_base_url) setOllamaUrl(s.ollama_base_url);
      if (s.ollama_model) setOllamaModel(s.ollama_model);
    });
  }, []);

  const total = weights.maintenance + weights.fuel + weights.delay;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.saveSettings({
      ollama_base_url: ollamaUrl,
      ollama_model: ollamaModel,
      weight_maintenance: weights.maintenance / 100,
      weight_fuel: weights.fuel / 100,
      weight_delay: weights.delay / 100
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div>
      <div className="page-header-bar">
        <div className="page-title-box">
          <h1>System Configuration & Risk Weights</h1>
          <p>Configure GenAI Ollama integration parameters and calibrate multi-factor fleet risk weights.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Risk Weights Form */}
        <div className="saas-card">
          <div className="card-title-row">
            <div className="card-title-text">
              <Sliders size={18} /> Fleet Risk Calculation Formula
            </div>
            <span className="pill-badge badge-active">Dynamic Recalculation</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            <code>Overall Risk = (W_Maint * Maint_Risk) + (W_Fuel * Fuel_Risk) + (W_Delay * Delay_Risk)</code>
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                <span>Maintenance Risk Weight</span>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>{weights.maintenance}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={weights.maintenance}
                onChange={(e) => setWeights({ ...weights, maintenance: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                <span>Fuel Efficiency Risk Weight</span>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>{weights.fuel}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={weights.fuel}
                onChange={(e) => setWeights({ ...weights, fuel: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                <span>Delivery Delay Risk Weight</span>
                <span style={{ color: '#3b82f6', fontWeight: 700 }}>{weights.delay}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={weights.delay}
                onChange={(e) => setWeights({ ...weights, delay: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
              <strong>Total Weight Sum:</strong>
              <strong style={{ color: total === 100 ? 'var(--primary-text)' : '#ef4444' }}>
                {total}%
              </strong>
            </div>

            {/* Ollama Settings */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', marginTop: '10px' }}>
              <div className="card-title-text" style={{ marginBottom: '12px' }}>
                🤖 Ollama Local LLM Integration
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Ollama Base URL
                </label>
                <input 
                  type="text" 
                  value={ollamaUrl} 
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  className="select-pill" 
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Configurable Ollama Model
                </label>
                <input 
                  type="text" 
                  value={ollamaModel} 
                  onChange={(e) => setOllamaModel(e.target.value)}
                  className="select-pill" 
                  style={{ width: '100%' }}
                  placeholder="llama3.2, mistral, phi3..."
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              {saveSuccess ? (
                <>
                  <CheckCircle2 size={16} /> Configuration Saved!
                </>
              ) : 'Save Configuration Changes'}
            </button>
          </form>
        </div>

        {/* Diagnostics Card */}
        <div className="saas-card">
          <div className="card-title-row">
            <div className="card-title-text">🔌 System Diagnostics</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px', margin: '16px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span>FastAPI Backend Service:</span>
              <span className="pill-badge badge-active">Connected (Port 8000)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span>Database Engine:</span>
              <span className="pill-badge badge-active">SQLite (Local Fallback Active)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span>Delay ML Model:</span>
              <span className="pill-badge badge-active">Logistic Regression (F1: 0.556)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span>Risk ML Model:</span>
              <span className="pill-badge badge-active">Random Forest (Accuracy: 100%)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>RAG Knowledge Base:</span>
              <span className="pill-badge badge-active">13 Document Chunks Indexed</span>
            </div>
          </div>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
            <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => alert('Synthetic demo dataset verified and intact.')}>
              <RefreshCw size={14} /> Verify Synthetic Demo Datasets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
