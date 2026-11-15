/**
 * FleetMind AI — Vehicle Fleet Management Controller
 */

let currentVehicles = [];
let vehicleViewMode = 'grid'; // 'grid' or 'table'

async function initVehicles() {
  loadVehiclesList();
  setupVehicleListeners();
}

async function loadVehiclesList() {
  const search = document.getElementById('vehSearchInput')?.value || '';
  const status = document.getElementById('vehStatusFilter')?.value || 'All';
  const risk = document.getElementById('vehRiskFilter')?.value || 'All';
  const fuel = document.getElementById('vehFuelFilter')?.value || 'All';

  const params = {};
  if (search) params.search = search;
  if (status !== 'All') params.status = status;
  if (risk !== 'All') params.risk_level = risk;
  if (fuel !== 'All') params.fuel_type = fuel;

  currentVehicles = await window.api.getVehicles(params);
  renderVehiclesStats(currentVehicles);
  renderVehiclesDisplay();
}

function renderVehiclesStats(vehicles) {
  const total = vehicles.length;
  const active = vehicles.filter(v => v.current_status === 'Active').length;
  const highRisk = vehicles.filter(v => (v.risk_level === 'HIGH' || v.risk_score >= 70)).length;
  const maint = vehicles.filter(v => v.current_status === 'In Maintenance').length;

  const totalEl = document.getElementById('vehStatTotal');
  if (totalEl) totalEl.textContent = total;
  const activeEl = document.getElementById('vehStatActive');
  if (activeEl) activeEl.textContent = active;
  const highEl = document.getElementById('vehStatHighRisk');
  if (highEl) highEl.textContent = highRisk;
  const maintEl = document.getElementById('vehStatMaint');
  if (maintEl) maintEl.textContent = maint;
}

function renderVehiclesDisplay() {
  const gridContainer = document.getElementById('vehiclesGridDisplay');
  const tableContainer = document.getElementById('vehiclesTableDisplay');

  if (vehicleViewMode === 'grid') {
    if (gridContainer) gridContainer.style.display = 'grid';
    if (tableContainer) tableContainer.style.display = 'none';
    renderVehiclesGrid(gridContainer);
  } else {
    if (gridContainer) gridContainer.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'block';
    renderVehiclesTable();
  }
}

function renderVehiclesGrid(container) {
  if (!container) return;
  if (currentVehicles.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-muted);">No vehicles match search criteria.</div>`;
    return;
  }

  container.innerHTML = currentVehicles.map(v => {
    const isTruck = v.vehicle_type.includes('Truck');
    const imgPath = isTruck ? 'assets/images/delivery_truck.jpg' : 'assets/images/delivery_van.jpg';
    
    let riskBadgeClass = 'badge-low';
    if (v.risk_score >= 70 || v.risk_level === 'HIGH') riskBadgeClass = 'badge-high';
    else if (v.risk_score >= 40 || v.risk_level === 'MEDIUM') riskBadgeClass = 'badge-medium';

    return `
      <div class="vehicle-item-card" onclick="window.navigateTo('/vehicles/${v.vehicle_id}')">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <span class="pill-badge ${v.current_status === 'Active' ? 'badge-active' : 'badge-idle'}">${v.current_status}</span>
              <span class="pill-badge badge-blue" style="margin-left: 4px;">${v.fuel_type}</span>
            </div>
            <span class="pill-badge ${riskBadgeClass}">Risk: ${v.risk_score || 35}/100</span>
          </div>

          <div style="text-align: center; padding: 8px 0;">
            <img src="${imgPath}" alt="${v.model}" style="max-height: 95px; width: 100%; object-fit: contain;">
          </div>

          <div style="margin-top: 10px;">
            <div style="font-size: 16px; font-weight: 800; color: var(--text-main);">${v.vehicle_id}</div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; color: var(--text-secondary);">${v.registration_number}</div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${v.make} ${v.model} (${v.manufacturing_year})</div>
          </div>
        </div>

        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; font-size: 12px;">
          <div>
            <span style="color: var(--text-muted);">Mileage:</span>
            <strong style="color: var(--text-main); display: block;">${Number(v.mileage).toLocaleString()} km</strong>
          </div>
          <div>
            <span style="color: var(--text-muted);">Last Service:</span>
            <strong style="color: var(--text-main); display: block;">${v.last_service_date || 'N/A'}</strong>
          </div>
          <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px;">Inspect →</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderVehiclesTable() {
  const tbody = document.getElementById('vehiclesTableBody');
  if (!tbody) return;

  tbody.innerHTML = currentVehicles.map(v => {
    let riskBadgeClass = 'badge-low';
    if (v.risk_score >= 70 || v.risk_level === 'HIGH') riskBadgeClass = 'badge-high';
    else if (v.risk_score >= 40 || v.risk_level === 'MEDIUM') riskBadgeClass = 'badge-medium';

    return `
      <tr onclick="window.navigateTo('/vehicles/${v.vehicle_id}')" style="cursor: pointer;">
        <td><strong>${v.vehicle_id}</strong></td>
        <td><code>${v.registration_number}</code></td>
        <td>${v.make} ${v.model}</td>
        <td>${v.vehicle_type}</td>
        <td><span class="pill-badge badge-blue">${v.fuel_type}</span></td>
        <td>${Number(v.mileage).toLocaleString()} km</td>
        <td><span class="pill-badge ${v.current_status === 'Active' ? 'badge-active' : 'badge-idle'}">${v.current_status}</span></td>
        <td><span class="pill-badge ${riskBadgeClass}">${v.risk_score || 35} (${v.risk_level || 'LOW'})</span></td>
        <td><button class="btn-secondary" style="padding: 4px 10px; font-size: 11px;">View</button></td>
      </tr>
    `;
  }).join('');
}

function setupVehicleListeners() {
  document.getElementById('vehSearchInput')?.addEventListener('input', debounce(loadVehiclesList, 300));
  document.getElementById('vehStatusFilter')?.addEventListener('change', loadVehiclesList);
  document.getElementById('vehRiskFilter')?.addEventListener('change', loadVehiclesList);
  document.getElementById('vehFuelFilter')?.addEventListener('change', loadVehiclesList);

  document.getElementById('toggleGridViewBtn')?.addEventListener('click', () => {
    vehicleViewMode = 'grid';
    document.getElementById('toggleGridViewBtn').classList.add('active');
    document.getElementById('toggleTableViewBtn').classList.remove('active');
    renderVehiclesDisplay();
  });

  document.getElementById('toggleTableViewBtn')?.addEventListener('click', () => {
    vehicleViewMode = 'table';
    document.getElementById('toggleTableViewBtn').classList.add('active');
    document.getElementById('toggleGridViewBtn').classList.remove('active');
    renderVehiclesDisplay();
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
