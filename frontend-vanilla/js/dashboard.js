/**
 * FleetMind AI — Dashboard Controller
 * ArgoLogics interactive Map, Chart.js Sparklines, Vehicle Spotlight, and KPI Metrics
 */

let dashboardMap = null;
let deliveryVolumeChart = null;
let salesOverviewChart = null;

async function initDashboard() {
  const data = await window.api.getDashboardAnalytics();
  renderDashboardKPIs(data);
  initDarkLeafletMap();
  renderDeliveryVolumeChart(data.delivery_volume_chart);
  renderSalesOverviewChart(data.sales_overview_chart);
  renderAttentionVehicles(data.vehicles_requiring_attention);
}

function renderDashboardKPIs(data) {
  // Volume card
  const delivMonthEl = document.getElementById('dashDeliveredMonth');
  if (delivMonthEl) delivMonthEl.textContent = Number(data.total_deliveries || 1544).toLocaleString();

  const successRateEl = document.getElementById('dashSuccessRate');
  if (successRateEl) successRateEl.textContent = `${data.on_time_rate || 96}%`;

  // Mini metrics
  const inTransitEl = document.getElementById('dashOrdersInTransit');
  if (inTransitEl) inTransitEl.textContent = data.orders_in_transit || 482;

  const delayedEl = document.getElementById('dashDelayedDeliveries');
  if (delayedEl) delayedEl.textContent = data.delayed_deliveries || 14;

  const fuelCostEl = document.getElementById('dashFuelCost');
  if (fuelCostEl) fuelCostEl.textContent = `$${Number(data.fuel_cost_month || 18420).toLocaleString()}`;

  const avgTimeEl = document.getElementById('dashAvgDeliveryTime');
  if (avgTimeEl) avgTimeEl.textContent = data.avg_delivery_time_display || '2d 24h 16m';
}

function initDarkLeafletMap() {
  const mapEl = document.getElementById('leafletMapContainer');
  if (!mapEl || dashboardMap) return;

  // Center on Warsaw, Poland as shown in reference ("Warszawa, Polska")
  const warsawCoords = [52.2297, 21.0122];
  dashboardMap = L.map('leafletMapContainer', {
    center: warsawCoords,
    zoom: 13,
    zoomControl: false,
    attributionControl: false
  });

  // Genuine Google Maps Dark Mode (NO API KEY REQUIRED)
  L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    className: 'gmaps-dark-mode-tiles',
    attribution: '&copy; Google Maps'
  }).addTo(dashboardMap);

  // Custom Neon Mint Pin Marker Icon
  const createPinIcon = (isVehicle = false) => {
    return L.divIcon({
      className: 'custom-fleet-pin',
      html: `
        <div style="
          width: 34px; height: 34px;
          background: #ffffff;
          border: 2px solid #00d084;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 15px rgba(0, 208, 132, 0.6);
          cursor: pointer;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            ${isVehicle 
              ? '<rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle>' 
              : '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>'}
          </svg>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
  };

  // Sample fleet nodes around Warsaw
  const fleetLocations = [
    { coords: [52.248, 21.014], title: "Unit VH-027 (WA-4823K)", status: "Active • In Transit", sub: "Plac Zamkowy 4", isVehicle: true, vId: "VH-027" },
    { coords: [52.229, 21.002], title: "Order #AB-846134", status: "Priority Delivery", sub: "Warszawa Central", isVehicle: false },
    { coords: [52.235, 20.985], title: "Unit VH-001 (WA-1001K)", status: "Active", sub: "Wola Logistics Center", isVehicle: true, vId: "VH-001" },
    { coords: [52.215, 21.025], title: "Unit VH-014 (WA-1014M)", status: "Dispatched", sub: "Mokotow Hub", isVehicle: true, vId: "VH-014" },
    { coords: [52.255, 21.035], title: "Order #AB-901248", status: "In Transit", sub: "Praga Distribution Yard", isVehicle: false },
    { coords: [52.210, 20.970], title: "Unit VH-042 (WA-1042X)", status: "Active", sub: "Airport Transit Corridor", isVehicle: true, vId: "VH-042" }
  ];

  fleetLocations.forEach(loc => {
    const marker = L.marker(loc.coords, { icon: createPinIcon(loc.isVehicle) }).addTo(dashboardMap);
    marker.bindPopup(`
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px;">
        <div style="font-weight: 800; font-size: 13px; color: #111827;">${loc.title}</div>
        <div style="font-size: 11px; color: #00d084; font-weight: 700; margin: 2px 0;">${loc.status}</div>
        <div style="font-size: 11px; color: #64748b;">${loc.sub}</div>
        ${loc.vId ? `<button onclick="window.navigateTo('/vehicles/${loc.vId}')" style="margin-top: 6px; padding: 4px 8px; background: #00d084; border: none; border-radius: 6px; color: #fff; font-size: 11px; font-weight: 600; cursor: pointer;">Inspect Telemetry</button>` : ''}
      </div>
    `);
  });

  // Glowing mint green polyline representing active route
  const routePoints = [
    [52.215, 21.025],
    [52.229, 21.002],
    [52.248, 21.014]
  ];
  L.polyline(routePoints, {
    color: '#00d084',
    weight: 3.5,
    opacity: 0.85,
    dashArray: '6, 8',
    lineCap: 'round'
  }).addTo(dashboardMap);
}

function renderDeliveryVolumeChart(chartData) {
  const canvas = document.getElementById('deliveryVolumeSparkline');
  if (!canvas) return;

  if (deliveryVolumeChart) deliveryVolumeChart.destroy();

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 80);
  gradient.addColorStop(0, 'rgba(0, 208, 132, 0.25)');
  gradient.addColorStop(1, 'rgba(0, 208, 132, 0.0)');

  deliveryVolumeChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: (chartData && chartData.labels) || ["W1","W2","W3","W4","W5","W6","W7","W8","W9","W10","W11","W12"],
      datasets: [{
        data: (chartData && chartData.data) || [1120, 1250, 1180, 1340, 1420, 1390, 1480, 1510, 1490, 1530, 1515, 1544],
        borderColor: '#00d084',
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.35,
        fill: true,
        backgroundColor: gradient
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
      scales: {
        x: { display: false },
        y: { display: false }
      }
    }
  });
}

function renderSalesOverviewChart(chartData) {
  const canvas = document.getElementById('salesOverviewBarChart');
  if (!canvas) return;

  if (salesOverviewChart) salesOverviewChart.destroy();

  const labels = (chartData && chartData.labels) || ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
  const rawData = (chartData && chartData.data) || [140, 165, 150, 210, 245, 278, 223, 195, 175];
  
  // Highlighting active range in emerald mint green (indices 5, 6: Jul, Aug)
  const bgColors = rawData.map((_, i) => (i >= 4 && i <= 6) ? '#00d084' : '#e2e8f0');

  const ctx = canvas.getContext('2d');
  salesOverviewChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        data: rawData,
        backgroundColor: bgColors,
        borderRadius: 4,
        barPercentage: 0.55
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8', font: { size: 10, family: 'Plus Jakarta Sans' } }
        },
        y: { display: false }
      }
    }
  });
}

function renderAttentionVehicles(vehicles) {
  const container = document.getElementById('attentionVehiclesGrid');
  if (!container) return;

  if (!vehicles || vehicles.length === 0) {
    container.innerHTML = `<div style="color: #64748b; font-size: 13px;">No vehicles currently require emergency intervention.</div>`;
    return;
  }

  container.innerHTML = vehicles.map(v => `
    <div style="
      background: var(--bg-card);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.2s ease;
      cursor: pointer;
    " onclick="window.navigateTo('/vehicles/${v.vehicle_id}')">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="
          width: 44px; height: 44px;
          border-radius: 12px;
          background: #fee2e2;
          color: #ef4444;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 14px;
        ">
          ${v.risk_score}
        </div>
        <div>
          <div style="font-weight: 700; font-size: 14px; color: var(--text-main);">${v.vehicle_id} • ${v.registration_number}</div>
          <div style="font-size: 12px; color: var(--text-muted);">${v.make_model} • Maint Risk ${v.maintenance_risk}%</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="pill-badge badge-high">${v.risk_level}</span>
        <button class="btn-secondary" style="padding: 6px 12px; font-size: 12px;">Inspect</button>
      </div>
    </div>
  `).join('');
}
