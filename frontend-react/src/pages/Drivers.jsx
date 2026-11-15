import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, MessageSquare, Plus, X, Users, ArrowUp, ArrowDown, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import { api } from '../api';

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Table Sorting state: default by name ascending
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  const initialForm = {
    driver_id: '',
    name: '',
    experience_years: 5,
    average_speed: 55.0,
    rating: 4.85,
    status: 'Active'
  };
  const [formData, setFormData] = useState(initialForm);

  const navigate = useNavigate();

  const loadDrivers = () => {
    api.getDrivers(search ? { search } : {}).then(setDrivers);
  };

  useEffect(() => {
    loadDrivers();
  }, [search]);

  // Handle header or dropdown sort change
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      // For string fields like name or status, default to ascending (A-Z)
      // For numerical/metrics fields, default to descending (highest first)
      if (['name', 'status'].includes(field)) {
        setSortOrder('asc');
      } else {
        setSortOrder('desc');
      }
    }
  };

  // Compute sorted driver dataset
  const sortedDrivers = useMemo(() => {
    return [...drivers].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (aVal === undefined || aVal === null) aVal = '';
      if (bVal === undefined || bVal === null) bVal = '';

      if (sortField === 'name') {
        const valA = String(a.name || '').toLowerCase();
        const valB = String(b.name || '').toLowerCase();
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      if (sortField === 'status') {
        const valA = String(a.status || '').toLowerCase();
        const valB = String(b.status || '').toLowerCase();
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      const numA = parseFloat(aVal) || 0;
      const numB = parseFloat(bVal) || 0;
      return sortOrder === 'asc' ? numA - numB : numB - numA;
    });
  }, [drivers, sortField, sortOrder]);

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...formData,
        experience_years: parseInt(formData.experience_years) || 1,
        average_speed: parseFloat(formData.average_speed) || 50.0,
        rating: parseFloat(formData.rating) || 4.8
      };
      if (!payload.driver_id) delete payload.driver_id;

      await api.addDriver(payload);
      setSuccessMsg(`Driver successfully registered!`);
      setShowAddModal(false);
      setFormData(initialForm);
      loadDrivers();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to register driver.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header-bar">
        <div className="page-title-box">
          <h1>Driver Management</h1>
          <p>Fleet operators, driving safety scores, delay frequency, and telematics performance.</p>
        </div>
        <button className="btn-primary" onClick={() => { setError(''); setShowAddModal(true); }}>
          <Plus size={16} /> Add Driver
        </button>
      </div>

      {successMsg && (
        <div style={{
          padding: '12px 16px',
          background: 'var(--risk-low-bg)',
          color: 'var(--risk-low-text)',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '16px',
          border: '1px solid var(--risk-low-border)'
        }}>
          {successMsg}
        </div>
      )}

      <div className="toolbar-bar">
        <div className="search-input-box">
          <Search size={16} color="#64748b" />
          <input 
            type="text" 
            placeholder="Search driver name or ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Interactive Ascending / Descending Sorting Controls */}
        <div className="table-sort-toolbar">
          <div className="sort-label-box">
            <SlidersHorizontal size={14} />
            <span>Sort by:</span>
          </div>

          <select 
            className="sort-dropdown-select"
            value={sortField}
            onChange={(e) => {
              const field = e.target.value;
              setSortField(field);
              if (['name', 'status'].includes(field)) {
                setSortOrder('asc');
              } else {
                setSortOrder('desc');
              }
            }}
          >
            <option value="name">Driver Name</option>
            <option value="experience_years">Experience</option>
            <option value="total_trips">Total Trips</option>
            <option value="late_deliveries">Late Deliveries</option>
            <option value="accidents">Accidents</option>
            <option value="average_speed">Avg Speed</option>
            <option value="rating">Safety Rating</option>
            <option value="status">Status</option>
          </select>

          <div className="sort-order-pill-group">
            <button 
              type="button"
              className={`sort-pill-btn ${sortOrder === 'asc' ? 'active' : ''}`}
              onClick={() => setSortOrder('asc')}
              title="Sort Ascending (Lowest to Highest / A → Z)"
            >
              <ArrowUp size={14} />
              <span>Ascending</span>
            </button>
            <button 
              type="button"
              className={`sort-pill-btn ${sortOrder === 'desc' ? 'active' : ''}`}
              onClick={() => setSortOrder('desc')}
              title="Sort Descending (Highest to Lowest / Z → A)"
            >
              <ArrowDown size={14} />
              <span>Descending</span>
            </button>
          </div>
        </div>
      </div>

      <div className="saas-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="saas-table">
          <thead>
            <tr>
              <th 
                className={`sortable-th ${sortField === 'name' ? 'active-sort' : ''}`}
                onClick={() => handleSort('name')}
                title="Click to sort by Driver Name"
              >
                <div className="th-sort-wrapper">
                  <span>Driver</span>
                  <span className="sort-indicator">
                    {sortField === 'name' ? (
                      sortOrder === 'asc' ? <ArrowUp size={14} className="active-arrow" /> : <ArrowDown size={14} className="active-arrow" />
                    ) : (
                      <ArrowUpDown size={13} className="idle-arrow" />
                    )}
                  </span>
                </div>
              </th>

              <th 
                className={`sortable-th ${sortField === 'experience_years' ? 'active-sort' : ''}`}
                onClick={() => handleSort('experience_years')}
                title="Click to sort by Experience"
              >
                <div className="th-sort-wrapper">
                  <span>Experience</span>
                  <span className="sort-indicator">
                    {sortField === 'experience_years' ? (
                      sortOrder === 'asc' ? <ArrowUp size={14} className="active-arrow" /> : <ArrowDown size={14} className="active-arrow" />
                    ) : (
                      <ArrowUpDown size={13} className="idle-arrow" />
                    )}
                  </span>
                </div>
              </th>

              <th 
                className={`sortable-th ${sortField === 'total_trips' ? 'active-sort' : ''}`}
                onClick={() => handleSort('total_trips')}
                title="Click to sort by Total Trips"
              >
                <div className="th-sort-wrapper">
                  <span>Total Trips</span>
                  <span className="sort-indicator">
                    {sortField === 'total_trips' ? (
                      sortOrder === 'asc' ? <ArrowUp size={14} className="active-arrow" /> : <ArrowDown size={14} className="active-arrow" />
                    ) : (
                      <ArrowUpDown size={13} className="idle-arrow" />
                    )}
                  </span>
                </div>
              </th>

              <th 
                className={`sortable-th ${sortField === 'late_deliveries' ? 'active-sort' : ''}`}
                onClick={() => handleSort('late_deliveries')}
                title="Click to sort by Late Deliveries"
              >
                <div className="th-sort-wrapper">
                  <span>Late Deliveries</span>
                  <span className="sort-indicator">
                    {sortField === 'late_deliveries' ? (
                      sortOrder === 'asc' ? <ArrowUp size={14} className="active-arrow" /> : <ArrowDown size={14} className="active-arrow" />
                    ) : (
                      <ArrowUpDown size={13} className="idle-arrow" />
                    )}
                  </span>
                </div>
              </th>

              <th 
                className={`sortable-th ${sortField === 'accidents' ? 'active-sort' : ''}`}
                onClick={() => handleSort('accidents')}
                title="Click to sort by Accidents"
              >
                <div className="th-sort-wrapper">
                  <span>Accidents</span>
                  <span className="sort-indicator">
                    {sortField === 'accidents' ? (
                      sortOrder === 'asc' ? <ArrowUp size={14} className="active-arrow" /> : <ArrowDown size={14} className="active-arrow" />
                    ) : (
                      <ArrowUpDown size={13} className="idle-arrow" />
                    )}
                  </span>
                </div>
              </th>

              <th 
                className={`sortable-th ${sortField === 'average_speed' ? 'active-sort' : ''}`}
                onClick={() => handleSort('average_speed')}
                title="Click to sort by Avg Speed"
              >
                <div className="th-sort-wrapper">
                  <span>Avg Speed</span>
                  <span className="sort-indicator">
                    {sortField === 'average_speed' ? (
                      sortOrder === 'asc' ? <ArrowUp size={14} className="active-arrow" /> : <ArrowDown size={14} className="active-arrow" />
                    ) : (
                      <ArrowUpDown size={13} className="idle-arrow" />
                    )}
                  </span>
                </div>
              </th>

              <th 
                className={`sortable-th ${sortField === 'rating' ? 'active-sort' : ''}`}
                onClick={() => handleSort('rating')}
                title="Click to sort by Safety Rating"
              >
                <div className="th-sort-wrapper">
                  <span>Safety Rating</span>
                  <span className="sort-indicator">
                    {sortField === 'rating' ? (
                      sortOrder === 'asc' ? <ArrowUp size={14} className="active-arrow" /> : <ArrowDown size={14} className="active-arrow" />
                    ) : (
                      <ArrowUpDown size={13} className="idle-arrow" />
                    )}
                  </span>
                </div>
              </th>

              <th 
                className={`sortable-th ${sortField === 'status' ? 'active-sort' : ''}`}
                onClick={() => handleSort('status')}
                title="Click to sort by Status"
              >
                <div className="th-sort-wrapper">
                  <span>Status</span>
                  <span className="sort-indicator">
                    {sortField === 'status' ? (
                      sortOrder === 'asc' ? <ArrowUp size={14} className="active-arrow" /> : <ArrowDown size={14} className="active-arrow" />
                    ) : (
                      <ArrowUpDown size={13} className="idle-arrow" />
                    )}
                  </span>
                </div>
              </th>

              <th>AI Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedDrivers.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No drivers found matching your search.
                </td>
              </tr>
            ) : (
              sortedDrivers.map(d => {
              const isRobert = d.name.includes("Robert") || d.name.includes("Tariq");
              const avatarSrc = isRobert ? '/assets/images/driver_robert.jpg' : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face';

              return (
                <tr key={d.driver_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={avatarSrc} alt={d.name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '14px' }}>{d.name}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{d.driver_id}</span>
                      </div>
                    </div>
                  </td>
                  <td>{d.experience_years} years</td>
                  <td>{Number(d.total_trips).toLocaleString()}</td>
                  <td>
                    <span style={{ color: d.late_deliveries > 20 ? '#ef4444' : 'var(--text-main)', fontWeight: 600 }}>
                      {d.late_deliveries} ({d.delay_rate || 2.7}%)
                    </span>
                  </td>
                  <td>{d.accidents}</td>
                  <td>{d.average_speed} km/h</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: 700 }}>
                      <Star size={14} fill="#f59e0b" />
                      <span>{d.rating}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`pill-badge ${d.status === 'Active' ? 'badge-active' : 'badge-idle'}`}>
                      {d.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => navigate('/ai-assistant', { state: { prefilledPrompt: `Summarize driver performance for ${d.name}.` } })}
                    >
                      <MessageSquare size={12} /> Ask AI
                    </button>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>

      {/* Add Driver Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowAddModal(false)}>
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Users size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>Add New Driver</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'var(--risk-high-bg)',
                color: 'var(--risk-high-text)',
                borderRadius: '10px',
                fontSize: '13px',
                marginBottom: '16px',
                border: '1px solid var(--risk-high-border)'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateDriver} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kamran Akram"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-card-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Driver ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto (e.g. DRV-056)"
                    value={formData.driver_id}
                    onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-card-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.experience_years}
                    onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 1 })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-card-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Avg Speed (km/h)
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="140"
                    value={formData.average_speed}
                    onChange={(e) => setFormData({ ...formData, average_speed: parseFloat(e.target.value) || 50.0 })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-card-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Safety Rating (1.0 - 5.0)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1.0"
                    max="5.0"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 4.8 })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-card-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-card-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '13px'
                  }}
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Registering...' : 'Save Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
