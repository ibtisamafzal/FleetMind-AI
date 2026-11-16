import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckSquare, 
  AlertTriangle, 
  Plus, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  User, 
  Truck, 
  X
} from 'lucide-react';
import { api } from '../api';

export default function ActionCenter() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal to create custom task
  const [showAddModal, setShowAddModal] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Maintenance');
  const [formPriority, setFormPriority] = useState('High');
  const [formVehicle, setFormVehicle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formAssignee, setFormAssignee] = useState('Fleet Operations Team');
  const [formLoading, setFormLoading] = useState(false);

  const navigate = useNavigate();

  const loadActions = useCallback(() => {
    setLoading(true);
    const params = {};
    if (statusFilter !== 'All') params.status = statusFilter;
    if (priorityFilter !== 'All') params.priority = priorityFilter;
    if (categoryFilter !== 'All') params.category = categoryFilter;

    api.getActionItems(params)
      .then(setData)
      .finally(() => setLoading(false));
  }, [categoryFilter, priorityFilter, statusFilter]);

  useEffect(() => {
    // Data loading synchronizes this screen with filter changes.
    // oxlint-disable-next-line react/set-state-in-effect
    loadActions();
  }, [loadActions]);

  const handleUpdateStatus = async (actionId, newStatus) => {
    try {
      await api.updateActionItem(actionId, { status: newStatus });
      setSuccessMsg(`Task ${actionId} marked as ${newStatus}.`);
      loadActions();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAutoSync = async () => {
    setSyncing(true);
    try {
      const res = await api.autoSyncRiskRadarActions();
      setSuccessMsg(res.message || 'Risk alerts synchronized.');
      loadActions();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!formTitle) return;
    setFormLoading(true);
    try {
      await api.createActionItem({
        title: formTitle,
        category: formCategory,
        priority: formPriority,
        vehicle_id: formVehicle || null,
        description: formDesc,
        assigned_to: formAssignee,
        status: 'Pending'
      });
      setShowAddModal(false);
      setFormTitle('');
      setFormDesc('');
      setFormVehicle('');
      setSuccessMsg('Operational task registered successfully.');
      loadActions();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const stats = data?.stats || {
    total_actions: 5,
    pending: 3,
    in_progress: 1,
    completed: 1,
    critical_unresolved: 1
  };

  const actions = (data?.actions || []).filter(a => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      a.title?.toLowerCase().includes(s) ||
      a.action_id?.toLowerCase().includes(s) ||
      a.vehicle_id?.toLowerCase().includes(s) ||
      a.description?.toLowerCase().includes(s)
    );
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-bar">
        <div className="page-title-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="pill-badge badge-active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <CheckSquare size={12} /> Closed-Loop Execution
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Automated Telematics Directives</span>
          </div>
          <h1>Fleet Action Center</h1>
          <p>Convert AI intelligence, risk alerts, and compliance directives into tracked operational tasks.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn-secondary"
            onClick={handleAutoSync}
            disabled={syncing}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={syncing ? 'spin' : ''} />
            {syncing ? 'Scanning Risk Radar...' : 'Auto-Sync Alerts'}
          </button>
          <button 
            className="btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} /> Create Task
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div style={{
          padding: '12px 16px',
          background: 'var(--risk-low-bg)',
          color: 'var(--risk-low-text)',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '18px',
          border: '1px solid var(--risk-low-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* KPI Metric Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '22px' }}>
        <div className="saas-card mini-metric-card">
          <span className="mini-metric-title">Total Active Tasks</span>
          <span className="mini-metric-val">{stats.total_actions}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Cross-fleet pipeline</span>
        </div>

        <div className="saas-card mini-metric-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <span className="mini-metric-title">Critical Attention</span>
          <span className="mini-metric-val" style={{ color: '#ef4444' }}>{stats.critical_unresolved} Tasks</span>
          <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, marginTop: '4px' }}>Requires immediate sign-off</span>
        </div>

        <div className="saas-card mini-metric-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <span className="mini-metric-title">Pending Dispatch</span>
          <span className="mini-metric-val" style={{ color: '#f59e0b' }}>{stats.pending}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Awaiting workshop action</span>
        </div>

        <div className="saas-card mini-metric-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <span className="mini-metric-title">In Progress</span>
          <span className="mini-metric-val" style={{ color: '#3b82f6' }}>{stats.in_progress}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Assigned & being serviced</span>
        </div>

        <div className="saas-card mini-metric-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <span className="mini-metric-title">Resolved & Closed</span>
          <span className="mini-metric-val" style={{ color: 'var(--primary)' }}>{stats.completed}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Signed off with notes</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="toolbar-bar">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-input-box">
            <Search size={16} color="#64748b" />
            <input 
              type="text" 
              placeholder="Search tasks, vehicle, directives..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <select className="select-pill" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>

            <select className="select-pill" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select className="select-pill" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="All">All Categories</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Fuel Anomaly">Fuel Anomaly</option>
              <option value="Driver Training">Driver Training</option>
              <option value="Safety">Safety & Compliance</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Showing <strong>{actions.length}</strong> directives
        </div>
      </div>

      {/* Task List / Table */}
      <div className="saas-card" style={{ padding: 0, overflowX: 'auto', marginBottom: '24px' }}>
        <table className="saas-table">
          <thead>
            <tr>
              <th style={{ width: '90px' }}>Task ID</th>
              <th>Operational Directive</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Created</th>
              <th style={{ textAlign: 'right' }}>Workflow Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Loading Fleet Action Center tasks...
                </td>
              </tr>
            ) : actions.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No operational directives found matching the selected filters.
                </td>
              </tr>
            ) : (
              actions.map(a => {
                const isCrit = a.priority === 'Critical';
                const isHigh = a.priority === 'High';
                const prioColor = isCrit ? '#ef4444' : isHigh ? '#f59e0b' : '#3b82f6';
                const statusBadge = a.status === 'Completed' ? 'badge-active' : a.status === 'In Progress' ? 'badge-blue' : 'badge-idle';

                return (
                  <tr key={a.action_id} style={{ background: isCrit && a.status !== 'Completed' ? 'rgba(239, 68, 68, 0.02)' : 'transparent' }}>
                    <td>
                      <code style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>
                        {a.action_id}
                      </code>
                    </td>

                    <td style={{ maxWidth: '340px' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--text-main)', display: 'block' }}>
                        {a.title}
                      </strong>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {a.description}
                      </p>
                      {a.resolution_notes && (
                        <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--primary)', background: 'var(--primary-subtle)', padding: '4px 8px', borderRadius: '6px' }}>
                          ✓ Resolution: {a.resolution_notes}
                        </div>
                      )}
                    </td>

                    <td>
                      <span className="pill-badge" style={{ background: 'var(--bg-card-subtle)', color: 'var(--text-secondary)', fontSize: '11px' }}>
                        {a.category}
                      </span>
                    </td>

                    <td>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        color: prioColor, 
                        fontWeight: 800, 
                        fontSize: '12px' 
                      }}>
                        {isCrit && <AlertTriangle size={12} />}
                        {a.priority}
                      </span>
                    </td>

                    <td>
                      <span className={`pill-badge ${statusBadge}`}>
                        {a.status}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <User size={13} color="var(--text-muted)" />
                        <span>{a.assigned_to}</span>
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {a.created_at}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {a.status === 'Pending' && (
                          <button 
                            className="btn-secondary"
                            onClick={() => handleUpdateStatus(a.action_id, 'In Progress')}
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                          >
                            Mark In Progress
                          </button>
                        )}
                        {a.status === 'In Progress' && (
                          <button 
                            className="btn-primary"
                            onClick={() => handleUpdateStatus(a.action_id, 'Completed')}
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                          >
                            Mark Completed
                          </button>
                        )}
                        {a.status === 'Completed' && (
                          <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>
                            Resolved ✓
                          </span>
                        )}
                        {a.vehicle_id && (
                          <button
                            className="btn-secondary"
                            onClick={() => navigate(`/vehicles/${a.vehicle_id}`)}
                            title={`Inspect ${a.vehicle_id}`}
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                          >
                            <Truck size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Task Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="pill-badge badge-active"><Plus size={12} /> New Directive</span>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Create Operational Task</h2>
              </div>
              <button className="icon-btn-circle" onClick={() => setShowAddModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTask}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Task Title *
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Schedule Brake Lining Inspection: Unit VH-027" 
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select className="input-field" value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Fuel Anomaly">Fuel Anomaly</option>
                    <option value="Driver Training">Driver Training</option>
                    <option value="Safety">Safety & Compliance</option>
                    <option value="Dispatch">Dispatch & Routing</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Priority Level
                  </label>
                  <select className="input-field" value={formPriority} onChange={(e) => setFormPriority(e.target.value)}>
                    <option value="Critical">Critical (Immediate Grounding)</option>
                    <option value="High">High (Within 48h)</option>
                    <option value="Medium">Medium (Routine Service)</option>
                    <option value="Low">Low (Informational)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Related Vehicle ID (Optional)
                  </label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. VH-027" 
                    value={formVehicle}
                    onChange={(e) => setFormVehicle(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Assigned Role
                  </label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formAssignee}
                    onChange={(e) => setFormAssignee(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Operational Instructions & Directives
                </label>
                <textarea 
                  className="input-field" 
                  rows={3} 
                  placeholder="Describe necessary workshop checks or driver interview instructions..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={formLoading}>
                  {formLoading ? 'Creating...' : 'Register Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
