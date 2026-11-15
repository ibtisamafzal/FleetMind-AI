import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

import TopHeader from './components/TopHeader';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import VehicleDetail from './pages/VehicleDetail';
import RiskRadar from './pages/RiskRadar';
import Simulator from './pages/Simulator';
import ActionCenter from './pages/ActionCenter';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Analytics from './pages/Analytics';
import AIAssistant from './pages/AIAssistant';
import Settings from './pages/Settings';
import Login from './pages/Login';
import './App.css';

// Register Chart.js components globally once for all charts
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('fleetmind_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fleetmind_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <Router>
      <div className="app-container">
        <TopHeader theme={theme} onToggleTheme={toggleTheme} />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/vehicles/:id" element={<VehicleDetail />} />
            <Route path="/risk-radar" element={<RiskRadar />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/action-center" element={<ActionCenter />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/trips" element={<Trips />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
