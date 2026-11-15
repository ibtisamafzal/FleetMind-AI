import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  Truck, 
  Users, 
  Navigation, 
  BarChart3, 
  Sparkles, 
  Settings, 
  Sun, 
  Moon, 
  Bell, 
  LogIn, 
  LogOut,
  ShieldAlert,
  Cpu,
  CheckSquare
} from 'lucide-react';

export default function TopHeader({ theme, onToggleTheme }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fleetmind_user') || 'null');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const syncUser = () => {
      try {
        setCurrentUser(JSON.parse(localStorage.getItem('fleetmind_user') || 'null'));
      } catch {
        setCurrentUser(null);
      }
    };

    window.addEventListener('storage', syncUser);
    const interval = setInterval(syncUser, 1000);
    return () => {
      window.removeEventListener('storage', syncUser);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = (e) => {
    e.stopPropagation();
    localStorage.removeItem('fleetmind_user');
    setCurrentUser(null);
    navigate('/login');
  };

  return (
    <header className="top-header">
      {/* Brand Section */}
      <div className="brand-section" onClick={() => navigate('/dashboard')}>
        <div className="brand-logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="brand-name">
          FleetMind <span>AI</span>
        </div>
      </div>

      {/* Centered Floating Pill Navigation (Exact ArgoLogics Style) */}
      <nav className="floating-nav-pill">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `nav-pill-btn ${isActive ? 'active' : ''}`}
          title="Dashboard"
        >
          <LayoutGrid size={20} />
          <span className="tooltip">Dashboard</span>
        </NavLink>

        <NavLink 
          to="/vehicles" 
          className={({ isActive }) => `nav-pill-btn ${isActive ? 'active' : ''}`}
          title="Vehicles"
        >
          <Truck size={20} />
          <span className="tooltip">Vehicles</span>
        </NavLink>

        <NavLink 
          to="/risk-radar" 
          className={({ isActive }) => `nav-pill-btn ${isActive ? 'active' : ''}`}
          title="Fleet Risk Radar (Module 1)"
        >
          <ShieldAlert size={20} />
          <span className="tooltip">Risk Radar</span>
        </NavLink>

        <NavLink 
          to="/simulator" 
          className={({ isActive }) => `nav-pill-btn ${isActive ? 'active' : ''}`}
          title="What-If Fleet Simulator (Module 2)"
        >
          <Cpu size={20} />
          <span className="tooltip">Simulator</span>
        </NavLink>

        <NavLink 
          to="/action-center" 
          className={({ isActive }) => `nav-pill-btn ${isActive ? 'active' : ''}`}
          title="Fleet Action Center (Module 7)"
        >
          <CheckSquare size={20} />
          <span className="tooltip">Action Center</span>
        </NavLink>

        <NavLink 
          to="/drivers" 
          className={({ isActive }) => `nav-pill-btn ${isActive ? 'active' : ''}`}
          title="Drivers"
        >
          <Users size={20} />
          <span className="tooltip">Drivers</span>
        </NavLink>

        <NavLink 
          to="/trips" 
          className={({ isActive }) => `nav-pill-btn ${isActive ? 'active' : ''}`}
          title="Trips & Dispatch"
        >
          <Navigation size={20} />
          <span className="tooltip">Trips</span>
        </NavLink>

        <NavLink 
          to="/analytics" 
          className={({ isActive }) => `nav-pill-btn ${isActive ? 'active' : ''}`}
          title="Fleet Analytics"
        >
          <BarChart3 size={20} />
          <span className="tooltip">Analytics</span>
        </NavLink>

        <NavLink 
          to="/ai-assistant" 
          className={({ isActive }) => `nav-pill-btn ${isActive ? 'active' : ''}`}
          title="AI Fleet Assistant"
        >
          <Sparkles size={20} />
          <span className="tooltip">AI Assistant</span>
        </NavLink>

        <NavLink 
          to="/settings" 
          className={({ isActive }) => `nav-pill-btn ${isActive ? 'active' : ''}`}
          title="Settings"
        >
          <Settings size={20} />
          <span className="tooltip">Settings</span>
        </NavLink>

        <NavLink 
          to="/login" 
          className={({ isActive }) => `nav-pill-btn ${isActive ? 'active' : ''}`}
          title="Login & Access"
        >
          <LogIn size={20} />
          <span className="tooltip">Login</span>
        </NavLink>
      </nav>

      {/* User Controls & Actions */}
      <div className="user-controls">
        {/* Dark/Light Mode Toggle */}
        <button className="icon-btn-circle" onClick={onToggleTheme} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button 
          className="icon-btn-circle" 
          title="Open Action Center (Pending Directives)" 
          onClick={() => navigate('/action-center')}
        >
          <span className="badge-dot" />
          <Bell size={18} />
        </button>

        {/* User Account / Sign In Status */}
        {currentUser && currentUser.access_token ? (
          <div 
            className="user-profile-badge" 
            onClick={() => navigate('/login')} 
            title="View Account Profile"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <div className="header-user-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: '1.2' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                {currentUser.user_name || "Tariq Mehmood"}
              </span>
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--primary)' }}>
                {currentUser.role || "Fleet Manager"}
              </span>
            </div>
            <img 
              src="/assets/images/driver_robert.jpg" 
              alt={currentUser.user_name || "Tariq Mehmood"} 
              className="user-avatar-circle"
            />
            <button 
              className="icon-btn-circle" 
              onClick={handleLogout} 
              title="Sign Out"
              style={{ width: '34px', height: '34px', border: 'none', background: 'var(--bg-card-subtle)', color: 'var(--text-muted)' }}
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button 
            className="header-login-btn" 
            onClick={() => navigate('/login')} 
            title="Sign In to FleetMind AI"
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
