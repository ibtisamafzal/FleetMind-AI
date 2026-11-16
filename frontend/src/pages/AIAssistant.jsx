import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Send, 
  Sparkles, 
  FileText, 
  Zap, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  Trash2, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  Users, 
  Compass, 
  CloudFog, 
  Fuel, 
  Bot
} from 'lucide-react';
import { api } from '../api';

export default function AIAssistant() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "### ✦ Welcome to FleetMind AI Dispatch Copilot\nI am your intelligent fleet operational assistant for Pakistan logistics. I continuously cross-reference **live database telemetry**, **ML multi-component risk scores**, and **official standard operating procedures (SOPs)**.\n\nAsk me about any vehicle (e.g. *Why is vehicle VH-027 high risk?*), driver performance ratings, optimal motorway routing, fuel consumption anomalies, or seasonal weather dispatch directives.",
      sources: [
        { doc_title: "Fleet Maintenance SOPs", section: "Preventative Overhaul", source_file: "fleet_maintenance_policies.md", relevance_score: 0.95 },
        { doc_title: "NH&MP Regulations", section: "Speed & Rest Hours", source_file: "driver_safety_policies.md", relevance_score: 0.92 }
      ],
      actionCards: [
        { title: "Inspect High-Risk Unit VH-027", route: "/vehicles/VH-027" },
        { title: "Optimize Smallest Route", route: "/dashboard" }
      ]
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [activeTab, setActiveTab] = useState('decision_intel');
  const [vehiclesList, setVehiclesList] = useState([]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    // Load vehicle list for context selector
    api.getVehicles().then(data => {
      if (Array.isArray(data)) setVehiclesList(data.slice(0, 15));
    }).catch(() => {
      setVehiclesList([]);
    });
  }, []);

  const sendMessage = async (textToSend) => {
    const text = textToSend || inputValue.trim();
    if (!text) return;

    setInputValue('');
    const newMessages = [...messages, { role: 'user', text }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const res = await api.sendAIChat(text, selectedVehicle || null);
      setIsTyping(false);
      setMessages([...newMessages, {
        role: 'assistant',
        text: res.response,
        mlPrediction: res.ml_prediction,
        deterministicStats: res.deterministic_stats,
        responseSource: res.response_source,
        sources: res.sources,
        recommendations: res.recommended_actions,
        actionCards: res.action_cards
      }]);
    } catch {
      setIsTyping(false);
      setMessages([...newMessages, {
        role: 'assistant',
        text: "Connection error: Unable to contact AI service. Ensure Ollama is running or use cached telemetry.",
        sources: []
      }]);
    }
  };

  useEffect(() => {
    if (location.state?.prefilledPrompt) {
      sendMessage(location.state.prefilledPrompt);
    }
    // This effect intentionally runs only when navigation supplies a new prompt.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.prefilledPrompt]);

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleSpeech = (text, idx) => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown symbols for cleaner pronunciation
    const cleanText = text.replace(/[#*`•]/g, '').replace(/\[.*?\]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);

    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  };

  const clearChat = () => {
    window.speechSynthesis?.cancel();
    setSpeakingIdx(null);
    setMessages([
      {
        role: 'assistant',
        text: "Chat cleared. What fleet operational query would you like to explore?",
        sources: []
      }
    ]);
  };

  const promptCategories = {
    decision_intel: {
      label: "Operational Intelligence",
      icon: <Sparkles size={14} />,
      prompts: [
        "Which vehicles have the highest operational risk?",
        "Why is vehicle VH-027 classified as high risk?",
        "Which vehicles require maintenance attention?",
        "Which driver has the highest historical delay rate?",
        "Which vehicles have unusual fuel consumption?",
        "Prepare a weekly fleet performance report.",
        "Recommend suitable available vehicles for priority deliveries.",
        "Summarize the biggest operational problems in the fleet."
      ]
    },
    risk: {
      label: "Vehicle Risk",
      icon: <Truck size={14} />,
      prompts: [
        "⚠️ Which vehicles are high risk?",
        "🔍 Why is vehicle VH-027 high risk?",
        "🛠️ Which vehicles need attention this week?",
        "🔧 What are the preventative overhaul km thresholds?"
      ]
    },
    routing: {
      label: "Route Optimization",
      icon: <Compass size={14} />,
      prompts: [
        "🛣️ Suggest best smallest route with minimum traffic",
        "🗺️ How does M-2 outer bypass compare to urban route?",
        "⏱️ What departure time minimizes Lahore congestion?",
        "📍 Optimize route from Sundar Estate to Port Qasim"
      ]
    },
    drivers: {
      label: "Driver Safety",
      icon: <Users size={14} />,
      prompts: [
        "⏱️ Which driver has the highest delay rate?",
        "📜 What is the NH&MP commercial speed and rest policy?",
        "👨‍✈️ Show performance profile for Tariq Mehmood",
        "⭐ How are driver safety ratings calculated?"
      ]
    },
    weather: {
      label: "Weather & Fog",
      icon: <CloudFog size={14} />,
      prompts: [
        "🌫️ How does winter smog on M-2 impact transit times?",
        "☀️ What is the extreme summer heat protocol for M-5?",
        "🌧️ What are dispatch rules during monsoon rains?",
        "🛑 When does NH&MP mandate convoy dispatch?"
      ]
    },
    fuel: {
      label: "Fuel & Analytics",
      icon: <Fuel size={14} />,
      prompts: [
        "⛽ Why has fuel efficiency decreased on Karachi routes?",
        "📉 What causes a sudden >15% fuel efficiency drop?",
        "🔋 What is standard battery efficiency for Volvo FL Electric?",
        "📊 Summarize today's fleet performance."
      ]
    }
  };

  // Helper to render basic markdown nicely without external heavy libraries
  const renderFormattedContent = (content, isUserMessage = false) => {
    if (!content) return null;

    const textColor = isUserMessage ? '#ffffff' : 'var(--text-main)';
    const lines = content.split('\n');
    const isTableSeparator = (line) => /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(line.trim());
    const tableCells = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());
    const rendered = [];

    const renderLine = (line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={idx} style={{ 
            fontSize: '15px', 
            fontWeight: 800, 
            color: textColor,
            margin: '12px 0 6px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {trimmed.replace('### ', '')}
          </h4>
        );
      }

      if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
        const bulletText = trimmed.substring(2);
        return (
          <div key={idx} style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '8px', 
            margin: '4px 0',
            fontSize: '13px',
            color: 'var(--text-main)',
            lineHeight: '1.5'
          }}>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>•</span>
            <div>{renderBoldAndCode(bulletText, textColor)}</div>
          </div>
        );
      }

      if (/^\d+\.\s/.test(trimmed)) {
        const num = trimmed.match(/^\d+\./)[0];
        const itemText = trimmed.replace(/^\d+\.\s*/, '');
        return (
          <div key={idx} style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '8px', 
            margin: '4px 0',
            fontSize: '13px',
            color: 'var(--text-main)',
            lineHeight: '1.5'
          }}>
            <span style={{ color: 'var(--primary)', fontWeight: 800, minWidth: '18px' }}>{num}</span>
            <div>{renderBoldAndCode(itemText, textColor)}</div>
          </div>
        );
      }

      if (trimmed === '') {
        return <div key={idx} style={{ height: '6px' }} />;
      }

      return (
        <p key={idx} style={{ margin: '4px 0', fontSize: '13px', lineHeight: '1.5', color: textColor }}>
          {renderBoldAndCode(line, textColor)}
        </p>
      );
    };

    for (let idx = 0; idx < lines.length; idx += 1) {
      if (lines[idx].includes('|') && idx + 1 < lines.length && isTableSeparator(lines[idx + 1])) {
        const rows = [tableCells(lines[idx])];
        let rowIndex = idx + 2;
        while (rowIndex < lines.length && lines[rowIndex].includes('|') && lines[rowIndex].trim()) {
          rows.push(tableCells(lines[rowIndex]));
          rowIndex += 1;
        }

        rendered.push(
          <div key={`table-${idx}`} style={{ overflowX: 'auto', margin: '12px 0' }}>
            <table style={{
              width: '100%',
              minWidth: '520px',
              borderCollapse: 'collapse',
              fontSize: '12px',
              color: textColor,
              background: 'var(--bg-card)'
            }}>
              <thead>
                <tr>
                  {rows[0].map((cell, cellIndex) => (
                    <th key={cellIndex} style={{
                      textAlign: 'left',
                      padding: '9px 10px',
                      borderBottom: '2px solid var(--primary)',
                      background: 'var(--bg-card-subtle)',
                      fontWeight: 800
                    }}>
                      {renderBoldAndCode(cell, textColor)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(1).map((row, rowNumber) => (
                  <tr key={rowNumber}>
                    {rows[0].map((_, cellIndex) => (
                      <td key={cellIndex} style={{
                        padding: '8px 10px',
                        borderBottom: '1px solid var(--border-light)',
                        verticalAlign: 'top'
                      }}>
                        {renderBoldAndCode(row[cellIndex] || '', textColor)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        idx = rowIndex - 1;
      } else {
        rendered.push(renderLine(lines[idx], idx));
      }
    }

    return rendered;
  };

  const renderBoldAndCode = (text, textColor = 'var(--text-main)') => {
    // Replaces **bold** and `code`
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: textColor }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} style={{ 
            background: 'var(--bg-card-subtle)', 
            padding: '2px 6px', 
            borderRadius: '4px',
            fontSize: '12px',
            color: textColor,
            fontFamily: 'JetBrains Mono, monospace'
          }}>
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="chat-container-layout">
      {/* Left Sidebar: Knowledge Base & Prompt Hub */}
      <div className="saas-card chat-sidebar-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          {/* Header branding */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--primary) 0%, #00a86b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(0, 208, 132, 0.3)'
              }}>
                <Bot size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '15px', color: 'var(--text-main)', display: 'block' }}>FleetMind AI</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Operational Copilot</span>
              </div>
            </div>
            <button 
              className="icon-btn-circle" 
              onClick={clearChat} 
              title="Clear & Reset Conversation"
              style={{ width: '32px', height: '32px' }}
            >
              <Trash2 size={14} />
            </button>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.4' }}>
            Multi-model intelligence grounding real-time SQL telemetry against NH&MP motorway policies.
          </p>

          {/* Categorized Tabs */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {Object.entries(promptCategories).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  padding: '5px 9px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: '1px solid',
                  borderColor: activeTab === key ? 'var(--primary)' : 'var(--border-light)',
                  background: activeTab === key ? 'var(--primary-subtle)' : 'var(--bg-card)',
                  color: activeTab === key ? 'var(--primary-text)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* Suggested Prompts List */}
          <div className="chat-suggestions-group" style={{ maxHeight: 'calc(100vh - 420px)', overflowY: 'auto' }}>
            {promptCategories[activeTab].prompts.map((chip, i) => {
              const query = chip.replace(/^[^\w]+/, '').trim();
              return (
                <button 
                  key={i} 
                  className="prompt-chip-btn" 
                  onClick={() => sendMessage(query)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span>{chip}</span>
                  <ArrowRight size={12} color="var(--primary)" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Engine Status Footer */}
        <div style={{ 
          paddingTop: '14px', 
          borderTop: '1px solid var(--border-light)', 
          fontSize: '11px', 
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Active Engine:</span>
            <strong style={{ color: 'var(--text-main)' }}>Ollama • Hybrid</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Knowledge Base:</span>
            <span style={{ color: 'var(--primary-text)', fontWeight: 600 }}>5 SOP Documents Indexed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 700, marginTop: '2px' }}>
            <ShieldCheck size={14} /> Zero-Hallucination Grounding
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="saas-card chat-main-card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Chat Control Top Bar */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-card-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge-dot" style={{ position: 'static', background: '#00d084' }} />
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
              Operational Telematics Channel
            </span>
          </div>

          {/* Quick Context Vehicle Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>ATTACH VEHICLE CONTEXT:</span>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              style={{
                padding: '4px 10px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid var(--border-light)',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                cursor: 'pointer'
              }}
            >
              <option value="">All Fleet Units (Global)</option>
              {vehiclesList.map(v => (
                <option key={v.vehicle_id} value={v.vehicle_id}>
                  {v.vehicle_id} ({v.registration_number}) - {v.make}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Message Stream */}
        <div className="chat-messages-area" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {messages.map((m, idx) => (
            <div 
              key={idx} 
              className={`chat-bubble ${m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}
              style={{ position: 'relative' }}
            >
              {m.role === 'assistant' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} color="var(--primary)" />
                    <strong style={{ color: 'var(--primary-text)', fontSize: '13px' }}>FleetMind AI Copilot</strong>
                    <span className="pill-badge badge-active" style={{ fontSize: '10px', padding: '2px 8px' }}>
                      {m.responseSource === 'llama3.2' ? 'Generated by Llama 3.2' : 'SQLite fallback'}
                    </span>
                  </div>

                  {/* Message Action Utilities */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      onClick={() => handleSpeech(m.text, idx)}
                      className="icon-btn-circle"
                      style={{ width: '28px', height: '28px', border: 'none', background: 'transparent' }}
                      title={speakingIdx === idx ? "Stop Voice Readout" : "Listen to Dispatch Briefing"}
                    >
                      {speakingIdx === idx ? <VolumeX size={14} color="#ef4444" /> : <Volume2 size={14} />}
                    </button>
                    <button
                      onClick={() => handleCopy(m.text, idx)}
                      className="icon-btn-circle"
                      style={{ width: '28px', height: '28px', border: 'none', background: 'transparent' }}
                      title="Copy response to clipboard"
                    >
                      {copiedIdx === idx ? <Check size={14} color="var(--primary)" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              )}

              {/* ML Prediction Risk Banner */}
              {m.mlPrediction && (
                <div style={{
                  background: m.mlPrediction.risk_score >= 70 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 208, 132, 0.1)',
                  border: `1px solid ${m.mlPrediction.risk_score >= 70 ? '#ef4444' : '#00d084'}`,
                  borderRadius: '12px',
                  padding: '12px 14px',
                  marginBottom: '12px',
                  fontSize: '13px'
                }}>
                  <div style={{ 
                    fontWeight: 800, 
                    color: m.mlPrediction.risk_score >= 70 ? '#ef4444' : 'var(--primary-text)', 
                    marginBottom: '4px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px' 
                  }}>
                    <Zap size={15} /> 
                    <span>Live ML Prediction: Unit {m.mlPrediction.vehicle_id} Risk Score = {m.mlPrediction.risk_score}/100 ({m.mlPrediction.risk_level})</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span>Maintenance Risk: <strong>{m.mlPrediction.maintenance_risk}%</strong></span>
                    <span>Fuel Risk: <strong>{m.mlPrediction.fuel_risk}%</strong></span>
                    <span>Delay Risk: <strong>{m.mlPrediction.delay_risk}%</strong></span>
                  </div>
                </div>
              )}

              {/* Formatted Text Content */}
              <div>
                {renderFormattedContent(m.text, m.role === 'user')}
              </div>

              {/* Interactive Navigation Action Cards */}
              {m.actionCards && m.actionCards.length > 0 && (
                <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {m.actionCards.map((card, ci) => (
                    <button
                      key={ci}
                      className="btn-primary"
                      onClick={() => navigate(card.route)}
                      style={{ 
                        padding: '6px 12px', 
                        fontSize: '12px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        borderRadius: '8px'
                      }}
                    >
                      {card.title} <ArrowRight size={13} />
                    </button>
                  ))}
                </div>
              )}

              {/* RAG Citation Sources */}
              {m.sources && m.sources.length > 0 && (
                <div className="chat-sources-tag" style={{ marginTop: '12px' }}>
                  <strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Verified Policy Sources & Grounding:
                  </strong>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {m.sources.map((s, si) => (
                      <span key={si} className="pill-badge badge-blue" style={{ fontSize: '11px' }}>
                        <FileText size={11} style={{ marginRight: '4px' }} />
                        {s.doc_title} ({s.section})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="chat-bubble chat-bubble-ai">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
                <span style={{ 
                  display: 'inline-block', 
                  width: '8px', 
                  height: '8px', 
                  background: 'var(--primary)', 
                  borderRadius: '50%',
                  animation: 'pulse 1.2s infinite' 
                }} />
                Checking Llama 3.2 first with verified fleet data; fallback activates automatically if needed...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="chat-input-bar">
          <input 
            type="text" 
            placeholder="Ask FleetMind about any vehicle (VH-027), driver, route, or policy..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button 
            className="btn-primary" 
            onClick={() => sendMessage()} 
            style={{ padding: '10px 22px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>Send</span>
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
