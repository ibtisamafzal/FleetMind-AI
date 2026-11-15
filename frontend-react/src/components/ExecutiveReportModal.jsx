import React from 'react';
import { 
  X, 
  Printer, 
  Award, 
  ShieldCheck, 
  AlertTriangle, 
  Leaf, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  FileText 
} from 'lucide-react';

export default function ExecutiveReportModal({ report, onClose }) {
  if (!report) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Toolbar (hidden during print) */}
        <div className="report-modal-toolbar no-print">
          <div className="report-modal-toolbar-title">
            <FileText size={18} color="var(--primary)" />
            <span>Executive Audit & Compliance Dossier</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Printer size={15} /> Print / Save as PDF
            </button>
            <button className="icon-btn-circle" onClick={onClose} title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Report Document Body */}
        <div className="report-document-body" id="printable-audit-report">
          {/* Official Header */}
          <div className="report-doc-header">
            <div className="report-doc-brand">
              <div className="report-seal-badge">
                <Award size={28} color="#00d084" />
              </div>
              <div>
                <h1 className="report-doc-title">FleetMind <span>AI</span></h1>
                <div className="report-doc-subtitle">Autonomous Telematics & Intelligent Fleet Operations Platform</div>
                <div className="report-authority-tag">{report.auditor_authority}</div>
              </div>
            </div>

            <div className="report-meta-box">
              <div><strong>Dossier ID:</strong> <code>{report.report_id}</code></div>
              <div><strong>Generated:</strong> {report.generated_at}</div>
              <div><strong>Security Hash:</strong> <code>{report.digital_seal_hash}</code></div>
              <div><strong>Lead Auditor:</strong> {report.auditor_lead}</div>
            </div>
          </div>

          <hr className="report-divider" />

          {/* Readiness Grade Banner */}
          <div className="report-grade-banner">
            <div className="grade-badge-circle">
              <div className="grade-letter">A</div>
              <div className="grade-score">{report.fleet_readiness_index}/100</div>
            </div>
            <div className="grade-details">
              <div className="grade-title">{report.fleet_grade}</div>
              <p className="grade-summary">{report.executive_summary}</p>
            </div>
          </div>

          {/* 4 Key Executive Asset KPIs */}
          <div className="report-kpi-grid">
            <div className="report-kpi-card">
              <div className="kpi-num">{report.asset_status.total_fleet_size} Units</div>
              <div className="kpi-label">Commercial Fleet Size</div>
              <div className="kpi-sub">{report.asset_status.active_in_transit} Active In-Transit</div>
            </div>
            <div className="report-kpi-card">
              <div className="kpi-num" style={{ color: 'var(--primary)' }}>{report.asset_status.fleet_availability_rate}%</div>
              <div className="kpi-label">Fleet Availability Rate</div>
              <div className="kpi-sub">Target: ≥ 85.0%</div>
            </div>
            <div className="report-kpi-card">
              <div className="kpi-num" style={{ color: '#ef4444' }}>{report.asset_status.high_risk_count}</div>
              <div className="kpi-label">ML High-Risk Flags</div>
              <div className="kpi-sub">{report.asset_status.overdue_service_count} Units Overdue Service</div>
            </div>
            <div className="report-kpi-card">
              <div className="kpi-num" style={{ color: '#10b981' }}>₨ 1.42M</div>
              <div className="kpi-label">Prevented Inefficiency Loss</div>
              <div className="kpi-sub">{report.financial_impact?.roi_multiple || '4.8x ROI'}</div>
            </div>
          </div>

          {/* Section 1: NH&MP Regulatory & Safety Compliance */}
          <div className="report-section">
            <div className="report-section-title">
              <ShieldCheck size={18} color="var(--primary)" />
              1. National Highway & Motorway Police (NH&MP) Regulatory Audit
            </div>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Compliance Domain / Standard</th>
                  <th>Benchmark</th>
                  <th>Observed Score</th>
                  <th>Regulatory Status</th>
                </tr>
              </thead>
              <tbody>
                {report.regulatory_compliance?.map((rc, idx) => (
                  <tr key={idx}>
                    <td><strong>{rc.standard}</strong></td>
                    <td>{rc.benchmark}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: rc.score >= 95 ? '#10b981' : '#f59e0b' }}>
                        {rc.score}%
                      </span>
                    </td>
                    <td>
                      <span className={`pill-badge ${rc.status === 'Compliant' ? 'badge-active' : 'badge-high'}`}>
                        {rc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 2: Priority Directives & Remediation Actions */}
          <div className="report-section">
            <div className="report-section-title">
              <AlertTriangle size={18} color="#ef4444" />
              2. High-Priority Operational Directives & Mechanical Interventions
            </div>
            <div className="directives-list">
              {report.high_priority_directives?.map((dir, idx) => (
                <div key={idx} className="directive-item">
                  <div className="directive-badge">{dir.priority}</div>
                  <div className="directive-content">
                    <div className="directive-unit"><strong>Target Asset:</strong> {dir.unit}</div>
                    <div className="directive-finding"><strong>Audit Finding:</strong> {dir.finding}</div>
                    <div className="directive-action"><strong>Mandated Action:</strong> {dir.directive}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: ESG Decarbonization & Scope 1 Footprint */}
          <div className="report-section">
            <div className="report-section-title">
              <Leaf size={18} color="#10b981" />
              3. Environmental, Social & Governance (ESG) Decarbonization Footprint
            </div>
            <div className="esg-audit-grid">
              <div className="esg-box">
                <div className="esg-val">{report.esg_decarbonization?.scope1_co2_metric_tons} MT</div>
                <div className="esg-lbl">Total Fleet Scope 1 CO2 Emissions</div>
                <div className="esg-sub">Calculated per 42,850 L diesel combustion</div>
              </div>
              <div className="esg-box highlight-esg">
                <div className="esg-val" style={{ color: '#00d084' }}>−{report.esg_decarbonization?.ai_optimized_co2_savings_mt} MT</div>
                <div className="esg-lbl">AI Routing Net Carbon Reduction</div>
                <div className="esg-sub">−{report.esg_decarbonization?.carbon_reduction_pct}% fuel efficiency gain</div>
              </div>
              <div className="esg-box">
                <div className="esg-val" style={{ color: '#10b981' }}>{report.esg_decarbonization?.trees_offset_equivalent} Trees</div>
                <div className="esg-lbl">Equivalent Forest Carbon Sequestration</div>
                <div className="esg-sub">Calculated at 48 trees / metric ton</div>
              </div>
            </div>
          </div>

          {/* Official Sign-Off Block */}
          <div className="report-signoff-block">
            <div className="signoff-box">
              <div className="signoff-line" />
              <div className="signoff-name">{report.auditor_lead}</div>
              <div className="signoff-role">Lead Telematics & Fleet Safety Auditor</div>
              <div className="signoff-dept">Directorate of Commercial Fleet Logistics</div>
            </div>
            <div className="signoff-seal">
              <div className="seal-circle">
                <span>OFFICIAL AUDIT</span>
                <strong>VERIFIED</strong>
                <small>FLEETMIND AI</small>
              </div>
            </div>
            <div className="signoff-box">
              <div className="signoff-line" />
              <div className="signoff-name">Tariq Mehmood</div>
              <div className="signoff-role">Chief Fleet Operations Director</div>
              <div className="signoff-dept">Central Dispatch & Logistics Hub</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

