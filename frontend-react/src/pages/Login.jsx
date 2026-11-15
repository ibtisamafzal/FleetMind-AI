import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { ShieldCheck, Truck, Lock, Mail, ArrowRight, UserCheck, LogOut, KeyRound, RefreshCw } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fleetmind_user') || 'null');
    } catch {
      return null;
    }
  });
  const [email, setEmail] = useState('manager@fleetmind.ai');
  const [password, setPassword] = useState('fleetmind123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (loginEmail, loginPass) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.login(loginEmail, loginPass);
      if (res && res.access_token) {
        localStorage.setItem('fleetmind_user', JSON.stringify(res));
        setCurrentUser(res);
        setSuccess(`Welcome back, ${res.user_name || 'Fleet Manager'}!`);
        setTimeout(() => {
          navigate('/dashboard');
        }, 700);
      } else {
        setError('Authentication failed. Check credentials.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin(email, password);
  };

  const handleLogout = () => {
    api.logout();
    localStorage.removeItem('fleetmind_user');
    setCurrentUser(null);
    setSuccess('Signed out successfully.');
    setTimeout(() => {
      setSuccess('');
    }, 1500);
  };

  return (
    <div className="login-page-container" style={{
      minHeight: 'calc(100vh - 120px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative'
    }}>
      {/* Decorative Glow */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(0, 208, 132, 0.12) 0%, rgba(0,0,0,0) 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <div className="argo-card" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '36px',
        borderRadius: '24px',
        position: 'relative',
        zIndex: 1,
        boxShadow: 'var(--shadow-floating)'
      }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--primary) 0%, #00a86b 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 6px 16px rgba(0, 208, 132, 0.35)',
            marginBottom: '16px'
          }}>
            <Truck size={28} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 6px 0' }}>
            FleetMind <span style={{ color: 'var(--primary)' }}>AI</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            Commercial Fleet Intelligence & Dispatch Command
          </p>
        </div>

        {currentUser ? (
          /* Already Signed In View */
          <div style={{
            background: 'var(--bg-card-subtle)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid var(--border-light)',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              margin: '0 auto 12px',
              overflow: 'hidden',
              border: '2px solid var(--primary)'
            }}>
              <img 
                src="/assets/images/driver_robert.jpg" 
                alt="Active User"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
            <h4 style={{ margin: '0 0 4px', fontSize: '18px', color: 'var(--text-main)', fontWeight: 800 }}>
              {currentUser.user_name || 'Active Operator'}
            </h4>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>
              {currentUser.email}
            </div>
            <span className="pill-badge badge-active" style={{ display: 'inline-block', marginBottom: '18px' }}>
              Role: {currentUser.role || 'Fleet Manager'}
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn-primary" 
                onClick={() => navigate('/dashboard')}
                style={{ flex: 1, padding: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                Go to Dashboard <ArrowRight size={15} />
              </button>
              <button 
                className="btn-secondary" 
                onClick={handleLogout}
                style={{ padding: '12px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Sign Out"
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          </div>
        ) : (
          /* Sign In Form */
          <>
            {/* Quick 1-Click Demo Logins */}
            <div style={{
              marginBottom: '24px',
              background: 'var(--bg-card-subtle)',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: '700',
                color: 'var(--text-secondary)',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                <UserCheck size={14} color="var(--primary)" /> 1-Click Instant Login:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEmail('manager@fleetmind.ai');
                    setPassword('fleetmind123');
                    handleLogin('manager@fleetmind.ai', 'fleetmind123');
                  }}
                  style={{ fontSize: '11px', padding: '9px 6px', textAlign: 'center', justifyContent: 'center' }}
                  disabled={loading}
                  title="Sign in as Fleet Manager (Tariq Mehmood)"
                >
                  Manager
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEmail('safety@fleetmind.ai');
                    setPassword('fleetmind123');
                    handleLogin('safety@fleetmind.ai', 'fleetmind123');
                  }}
                  style={{ fontSize: '11px', padding: '9px 6px', textAlign: 'center', justifyContent: 'center' }}
                  disabled={loading}
                  title="Sign in as Safety Officer (Sarah Khan)"
                >
                  Safety
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEmail('admin@fleetmind.ai');
                    setPassword('admin123');
                    handleLogin('admin@fleetmind.ai', 'admin123');
                  }}
                  style={{ fontSize: '11px', padding: '9px 6px', textAlign: 'center', justifyContent: 'center' }}
                  disabled={loading}
                  title="Sign in as System Admin"
                >
                  Admin
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '12px 14px',
                background: 'var(--risk-high-bg)',
                color: 'var(--risk-high-text)',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '18px',
                border: '1px solid var(--risk-high-border)'
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{
                padding: '12px 14px',
                background: 'var(--risk-low-bg)',
                color: 'var(--risk-low-text)',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '18px',
                border: '1px solid var(--risk-low-border)'
              }}>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px'
                }}>
                  CORPORATE EMAIL
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@fleetmind.ai"
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 40px',
                      borderRadius: '14px',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-canvas)',
                      color: 'var(--text-main)',
                      fontSize: '14px',
                      fontWeight: '500',
                      outline: 'none',
                      transition: 'border 0.2s'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px'
                }}>
                  PASSWORD
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 40px',
                      borderRadius: '14px',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-canvas)',
                      color: 'var(--text-main)',
                      fontSize: '14px',
                      fontWeight: '500',
                      outline: 'none',
                      transition: 'border 0.2s'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '14px',
                  fontWeight: '700',
                  borderRadius: '14px',
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {loading ? 'Authenticating...' : 'Sign In to Workspace'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          </>
        )}

        {/* Demo Credentials Reference Card */}
        <div style={{
          marginTop: '22px',
          background: 'var(--bg-card-subtle)',
          borderRadius: '16px',
          padding: '16px',
          border: '1px solid var(--border-light)',
          fontSize: '12px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '700',
            color: 'var(--text-main)',
            marginBottom: '10px'
          }}>
            <KeyRound size={15} color="var(--primary)" /> Demo User Accounts & Credentials:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 8px',
              background: 'var(--bg-card)',
              borderRadius: '8px',
              border: '1px solid var(--border-light)'
            }}>
              <div>
                <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>Fleet Manager</span>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>manager@fleetmind.ai</div>
              </div>
              <code style={{
                background: 'var(--primary-subtle)',
                color: 'var(--primary-text)',
                padding: '3px 8px',
                borderRadius: '6px',
                fontWeight: '700',
                fontSize: '12px'
              }}>
                fleetmind123
              </code>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 8px',
              background: 'var(--bg-card)',
              borderRadius: '8px',
              border: '1px solid var(--border-light)'
            }}>
              <div>
                <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>Safety Officer</span>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>safety@fleetmind.ai</div>
              </div>
              <code style={{
                background: 'var(--primary-subtle)',
                color: 'var(--primary-text)',
                padding: '3px 8px',
                borderRadius: '6px',
                fontWeight: '700',
                fontSize: '12px'
              }}>
                fleetmind123
              </code>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 8px',
              background: 'var(--bg-card)',
              borderRadius: '8px',
              border: '1px solid var(--border-light)'
            }}>
              <div>
                <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>System Administrator</span>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>admin@fleetmind.ai</div>
              </div>
              <code style={{
                background: 'var(--primary-subtle)',
                color: 'var(--primary-text)',
                padding: '3px 8px',
                borderRadius: '6px',
                fontWeight: '700',
                fontSize: '12px'
              }}>
                admin123
              </code>
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: 'var(--text-muted)',
          fontSize: '12px'
        }}>
          <ShieldCheck size={16} color="var(--primary)" /> End-to-end encrypted telematics link (v1.4)
        </div>
      </div>
    </div>
  );
}
