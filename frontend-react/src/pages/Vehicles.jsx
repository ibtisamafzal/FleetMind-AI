import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutGrid, List, ArrowRight, Truck, X, Plus, ArrowUp, ArrowDown, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import { api } from '../api';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [risk, setRisk] = useState('All');
  const [fuel, setFuel] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Table & Grid Sorting state
  const [sortField, setSortField] = useState('vehicle_id');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  const initialForm = {
    vehicle_id: '',
    registration_number: '',
    vehicle_type: 'Box Truck',
    make: 'Hino',
    model: '300 Series Euro-IV',
    manufacturing_year: 2024,
    fuel_type: 'Diesel',
    mileage: 15000,
    current_status: 'Active'
  };
  const [formData, setFormData] = useState(initialForm);

  const navigate = useNavigate();

  const loadVehicles = () => {
    const params = {};
    if (search) params.search = search;
    if (status !== 'All') params.status = status;
    if (risk !== 'All') params.risk_level = risk;
    if (fuel !== 'All') params.fuel_type = fuel;

    api.getVehicles(params).then(setVehicles);
  };

  useEffect(() => {
    loadVehicles();
  }, [search, status, risk, fuel]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      if (['vehicle_id', 'make', 'model', 'registration_number', 'current_status', 'vehicle_type', 'fuel_type'].includes(field)) {
        setSortOrder('asc');
      } else {
        setSortOrder('desc'); // risk_score, mileage, manufacturing_year default to desc
      }
    }
  };

  const sortedVehicles = useMemo(() => {
    return [...vehicles].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (aVal === undefined || aVal === null) aVal = '';
      if (bVal === undefined || bVal === null) bVal = '';

      if (['vehicle_id', 'make', 'registration_number', 'vehicle_type', 'fuel_type', 'current_status'].includes(sortField)) {
        const valA = String(aVal).toLowerCase();
        const valB = String(bVal).toLowerCase();
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      const numA = parseFloat(aVal) || 0;
      const numB = parseFloat(bVal) || 0;
      return sortOrder === 'asc' ? numA - numB : numB - numA;
    });
  }, [vehicles, sortField, sortOrder]);

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...formData,
        manufacturing_year: parseInt(formData.manufacturing_year) || 2024,
        mileage: parseFloat(formData.mileage) || 0,
        service_mileage: Math.max(0, (parseFloat(formData.mileage) || 0) - 2000),
        last_service_date: new Date().toISOString().split('T')[0]
      };
      if (!payload.vehicle_id) delete payload.vehicle_id;

      await api.addVehicle(payload);
      setSuccessMsg(`Vehicle successfully registered!`);
      setShowAddModal(false);
      setFormData(initialForm);
      loadVehicles();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to register vehicle.');
    } finally {
      setLoading(false);
    }
  };

  const total = vehicles.length;
  const active = vehicles.filter(v => v.current_status === 'Active').length;
  const highRisk = vehicles.filter(v => v.risk_score >= 70 || v.risk_level === 'HIGH').length;
  const maint = vehicles.filter(v => v.current_status === 'In Maintenance').length;

  return (
    <div>
      <div className="page-header-bar">
        <div className="page-title-box">
          <h1>Vehicle Fleet Management</h1>
          <p>Real-time vehicle telemetry, multi-component operational risk scores, and service logs.</p>
        </div>
        <button className="btn-primary" onClick={() => { setError(''); setShowAddModal(true); }}>
          <Plus size={16} /> Add Vehicle
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

      {/* KPI Stats */}
      <div className="responsive-kpi-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div className="saas-card mini-metric-card">
          <span className="mini-metric-title">Total Fleet</span>
          <span className="mini-metric-val">{total}</span>
        </div>
        <div className="saas-card mini-metric-card">
          <span className="mini-metric-title">Active In Service</span>
          <span className="mini-metric-val" style={{ color: 'var(--primary)' }}>{active}</span>
        </div>
        <div className="saas-card mini-metric-card">
          <span className="mini-metric-title">High Risk Units</span>
          <span className="mini-metric-val" style={{ color: '#ef4444' }}>{highRisk}</span>
        </div>
        <div className="saas-card mini-metric-card">
          <span className="mini-metric-title">In Maintenance</span>
          <span className="mini-metric-val" style={{ color: '#f59e0b' }}>{maint}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar-bar">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-input-box">
            <Search size={16} color="#64748b" />
            <input 
              type="text" 
              placeholder="Search by ID, plate, model..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <select className="select-pill" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="In Maintenance">In Maintenance</option>
              <option value="Idle">Idle</option>
            </select>

            <select className="select-pill" value={risk} onChange={(e) => setRisk(e.target.value)}>
              <option value="All">All Risk Levels</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>

            <select className="select-pill" value={fuel} onChange={(e) => setFuel(e.target.value)}>
              <option value="All">All Fuel Types</option>
              <option value="Electric">Electric</option>
              <option value="Diesel">Diesel</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Sorting Controls */}
          <div className="table-sort-toolbar">
            <div className="sort-label-box">
              <SlidersHorizontal size={14} />
              <span>Sort:</span>
            </div>

            <select 
              className="sort-dropdown-select"
              value={sortField}
              onChange={(e) => {
                const f = e.target.value;
                setSortField(f);
                if (['vehicle_id', 'make', 'registration_number', 'current_status', 'vehicle_type', 'fuel_type'].includes(f)) {
                  setSortOrder('asc');
                } else {
                  setSortOrder('desc');
                }
              }}
            >
              <option value="vehicle_id">Vehicle ID</option>
              <option value="make">Make & Model</option>
              <option value="mileage">Mileage</option>
              <option value="risk_score">Risk Score</option>
              <option value="manufacturing_year">Year</option>
              <option value="current_status">Status</option>
            </select>

            <div className="sort-order-pill-group">
              <button 
                type="button"
                className={`sort-pill-btn ${sortOrder === 'asc' ? 'active' : ''}`}
                onClick={() => setSortOrder('asc')}
                title="Sort Ascending"
              >
                <ArrowUp size={14} />
                <span>Asc</span>
              </button>
              <button 
                type="button"
                className={`sort-pill-btn ${sortOrder === 'desc' ? 'active' : ''}`}
                onClick={() => setSortOrder('desc')}
                title="Sort Descending"
              >
                <ArrowDown size={14} />
                <span>Desc</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              className={`btn-secondary ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              style={{ padding: '8px 14px' }}
            >
              <LayoutGrid size={15} /> Grid
            </button>
            <button 
              className={`btn-secondary ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              style={{ padding: '8px 14px' }}
            >
              <List size={15} /> Table
            </button>
          </div>
        </div>
      </div>

      {/* Content Rendering */}
      {viewMode === 'grid' ? (
        <div className="vehicles-card-grid">
          {sortedVehicles.map(v => {
            let riskBadgeClass = 'badge-low';
            if (v.risk_score >= 70 || v.risk_level === 'HIGH') riskBadgeClass = 'badge-high';
            else if (v.risk_score >= 40 || v.risk_level === 'MEDIUM') riskBadgeClass = 'badge-medium';

            const isTruck = v.vehicle_type ? (v.vehicle_type.toLowerCase().includes('truck') || v.vehicle_type.toLowerCase().includes('cargo') || v.vehicle_type.toLowerCase().includes('linehaul')) : true;
            const imgPath = isTruck ? '/assets/images/delivery_truck.jpg' : '/assets/images/delivery_van.jpg';

            return (
              <div 
                key={v.vehicle_id} 
                className="saas-card vehicle-item-card"
                onClick={() => navigate(`/vehicles/${v.vehicle_id}`)}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="vehicle-id-tag" style={{ fontWeight: 800 }}>{v.vehicle_id}</span>
                      <span className={`pill-badge ${v.current_status === 'Active' ? 'badge-active' : 'badge-idle'}`}>
                        {v.current_status}
                      </span>
                      <span className="pill-badge badge-blue">
                        {v.fuel_type}
                      </span>
                    </div>
                    <span className={`pill-badge ${riskBadgeClass}`}>
                      Risk: {v.risk_score || 35}/100
                    </span>
                  </div>

                  {/* Premium Vehicle Image Stage */}
                  <div className="vehicle-img-stage">
                    <img 
                      src={imgPath} 
                      alt={`${v.make} ${v.model}`}
                      className="vehicle-img"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/assets/images/delivery_truck.jpg';
                      }}
                    />
                  </div>

                  <div style={{ marginTop: '6px' }}>
                    <h3 style={{ margin: '0 0 2px 0', fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                      {v.make} {v.model}
                    </h3>
                    <code style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{v.registration_number}</code>
                  </div>

                  <div className="vehicle-card-specs">
                    <div className="spec-item">
                      <span className="spec-label">Type</span>
                      <span className="spec-val" title={v.vehicle_type}>{v.vehicle_type || 'Commercial'}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Mileage</span>
                      <span className="spec-val">{Number(v.mileage || 0).toLocaleString()} km</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Last Service</span>
                      <span className="spec-val">{v.last_service_date || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    Year: <strong>{v.manufacturing_year || 2023}</strong>
                  </span>
                  <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Inspect Telemetry <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="saas-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="saas-table">
            <thead>
              <tr>
                <th 
                  className={`sortable-th ${sortField === 'vehicle_id' ? 'active-sort' : ''}`}
                  onClick={() => handleSort('vehicle_id')}
                  title="Click to sort by Vehicle ID"
                >
                  <div className="th-sort-wrapper">
                    <span>Vehicle ID</span>
                    <span className="sort-indicator">
                      {sortField === 'vehicle_id' ? (
                        sortOrder === 'asc' ? <ArrowUp size={14} className="active-arrow" /> : <ArrowDown size={14} className="active-arrow" />
                      ) : (
                        <ArrowUpDown size={13} className="idle-arrow" />
                      )}
                    </span>
                  </div>
                </th>

                <th 
                  className={`sortable-th ${sortField === 'registration_number' ? 'active-sort' : ''}`}
                  onClick={() => handleSort('registration_number')}
                  title="Click to sort by Plate"
                >
                  <div className="th-sort-wrapper">
                    <span>Plate</span>
                    <span className="sort-indicator">
                      {sortField === 'registration_number' ? (
                        sortOrder === 'asc' ? <ArrowUp size={14} className="active-arrow" /> : <ArrowDown size={14} className="active-arrow" />
                      ) : (
                        <ArrowUpDown size={13} className="idle-arrow" />
                      )}
                    </span>
                  </div>
                </th>

                <th 
                  className={`sortable-th ${sortField === 'make' ? 'active-sort' : ''}`}
                  onClick={() => handleSort('make')}
                  title="Click to sort by Make & Model"
                >
                  <div className="th-sort-wrapper">
                    <span>Make & Model</span>
                    <span className="sort-indicator">
                      {sortField === 'make' ? (
                        sortOrder === 'asc' ? <ArrowUp size={14} className="active-arrow" /> : <ArrowDown size={14} className="active-arrow" />
                      ) : (
                        <ArrowUpDown size={13} className="idle-arrow" />
                      )}
                    </span>
                  </div>
                </th>

                <th 
                  className={`sortable-th ${sortField === 'vehicle_type' ? 'active-sort' : ''}`}
                  onClick={() => handleSort('vehicle_type')}
                  title="Click to sort by Type"
                >
                  <div className="th-sort-wrapper">
                    <span>Type</span>
                    <span className="sort-indicator">
                      {sortField === 'vehicle_type' ? (
                        sortOrder === 'asc' ? <ArrowUp size={14} className="active-arrow" /> : <ArrowDown size={14} className="active-arrow" />
                      ) : (
                        <ArrowUpDown size={13} className="idle-arrow" />
                      )}
                    </span>
                  </div>
                </th>

                <th 
                  className={`sortable-th ${sortField === 'fuel_type' ? 'active-sort' : ''}`}
                  onClick={() => handleSort('fuel_type')}
                  title="Click to sort by Fuel"
                >
                  <div className="th-sort-wrapper">
                    <span>Fuel</span>
                    <span className="sort-indicator">
                      {sortField === 'fuel_type' ? (
                        sortOrder === 'asc' ? <ArrowUp size={14} className="active-arrow" /> : <ArrowDown size={14} className="active-arrow" />
                      ) : (
                        <ArrowUpDown size={13} className="idle-arrow" />
                      )}
                    </span>
                  </div>
                </th>

                <th 
                  className={`sortable-th ${sortField === 'mileage' ? 'active-sort' : ''}`}
                  onClick={() => handleSort('mileage')}
                  title="Click to sort by Mileage"
                >
                  <div className="th-sort-wrapper">
                    <span>Mileage</span>
                    <span className="sort-indicator">
                      {sortField === 'mileage' ? (
                        sortOrder === 'asc' ? <ArrowUp size={14} className="active-arrow" /> : <ArrowDown size={14} className="active-arrow" />
                      ) : (
                        <ArrowUpDown size={13} className="idle-arrow" />
                      )}
                    </span>
                  </div>
                </th>

                <th 
                  className={`sortable-th ${sortField === 'current_status' ? 'active-sort' : ''}`}
                  onClick={() => handleSort('current_status')}
                  title="Click to sort by Status"
                >
                  <div className="th-sort-wrapper">
                    <span>Status</span>
                    <span className="sort-indicator">
                      {sortField === 'current_status' ? (
                        sortOrder === 'asc' ? <ArrowUp size={14} className="active-arrow" /> : <ArrowDown size={14} className="active-arrow" />
                      ) : (
                        <ArrowUpDown size={13} className="idle-arrow" />
                      )}
                    </span>
                  </div>
                </th>

                <th 
                  className={`sortable-th ${sortField === 'risk_score' ? 'active-sort' : ''}`}
                  onClick={() => handleSort('risk_score')}
                  title="Click to sort by Operational Risk"
                >
                  <div className="th-sort-wrapper">
                    <span>Operational Risk</span>
                    <span className="sort-indicator">
                      {sortField === 'risk_score' ? (
                        sortOrder === 'asc' ? <ArrowUp size={14} className="active-arrow" /> : <ArrowDown size={14} className="active-arrow" />
                      ) : (
                        <ArrowUpDown size={13} className="idle-arrow" />
                      )}
                    </span>
                  </div>
                </th>

                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedVehicles.map(v => {
                let riskBadgeClass = 'badge-low';
                if (v.risk_score >= 70 || v.risk_level === 'HIGH') riskBadgeClass = 'badge-high';
                else if (v.risk_score >= 40 || v.risk_level === 'MEDIUM') riskBadgeClass = 'badge-medium';

                return (
                  <tr key={v.vehicle_id} onClick={() => navigate(`/vehicles/${v.vehicle_id}`)} style={{ cursor: 'pointer' }}>
                    <td><strong>{v.vehicle_id}</strong></td>
                    <td><code>{v.registration_number}</code></td>
                    <td>{v.make} {v.model}</td>
                    <td>{v.vehicle_type}</td>
                    <td><span className="pill-badge badge-blue">{v.fuel_type}</span></td>
                    <td>{Number(v.mileage).toLocaleString()} km</td>
                    <td><span className={`pill-badge ${v.current_status === 'Active' ? 'badge-active' : 'badge-idle'}`}>{v.current_status}</span></td>
                    <td><span className={`pill-badge ${riskBadgeClass}`}>{v.risk_score} ({v.risk_level})</span></td>
                    <td><button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>View</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowAddModal(false)}>
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
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
                  <Truck size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>Add New Vehicle</h3>
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

            <form onSubmit={handleCreateVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="responsive-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Registration No. *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LEA-5829"
                    value={formData.registration_number}
                    onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
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
                    Vehicle ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto (e.g. VH-111)"
                    value={formData.vehicle_id}
                    onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
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

              <div className="responsive-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Make *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hino, Isuzu, Volvo"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
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
                    Model *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 300 Series Euro-IV"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
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

              <div className="responsive-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Vehicle Type
                  </label>
                  <select
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
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
                    <option value="Box Truck">Box Truck</option>
                    <option value="Light Delivery">Light Delivery</option>
                    <option value="Cargo Van">Cargo Van</option>
                    <option value="Heavy Freight">Heavy Freight</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Fuel Type
                  </label>
                  <select
                    value={formData.fuel_type}
                    onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
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
                    <option value="Diesel">Diesel</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>
              </div>

              <div className="responsive-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Manufacturing Year
                  </label>
                  <input
                    type="number"
                    min="2010"
                    max="2027"
                    value={formData.manufacturing_year}
                    onChange={(e) => setFormData({ ...formData, manufacturing_year: parseInt(e.target.value) || 2024 })}
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
                    Current Mileage (km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: parseFloat(e.target.value) || 0 })}
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
                  value={formData.current_status}
                  onChange={(e) => setFormData({ ...formData, current_status: e.target.value })}
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
                  <option value="In Maintenance">In Maintenance</option>
                  <option value="Idle">Idle</option>
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
                  {loading ? 'Creating Vehicle...' : 'Save Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
