/**
 * FleetMind AI — Fleet Analytics Controller
 * Renders Delivery, Fuel, and Maintenance analytics using Chart.js
 */

let driverDelayChart = null;
let routeDelayChart = null;
let fuelEfficiencyChart = null;
let riskDistributionChart = null;

async function initAnalytics() {
  try {
    const res = await fetch(`${API_BASE}/api/analytics/fleet`, { headers: window.api.getHeaders() });
    const data = res.ok ? await res.json() : getFallbackFleetAnalytics();
    renderAnalytics(data);
  } catch (e) {
    renderAnalytics(getFallbackFleetAnalytics());
  }
}

function renderAnalytics(data) {
  renderDeliveryAnalytics(data.delivery_analytics);
  renderFuelAnalytics(data.fuel_analytics);
  renderMaintenanceAnalytics(data.maintenance_analytics);
}

function renderDeliveryAnalytics(deliv) {
  document.getElementById('anOnTimePct').textContent = `${deliv.on_time_pct}%`;
  document.getElementById('anDelayPct').textContent = `${deliv.delay_pct}%`;
  document.getElementById('anAvgDelay').textContent = `${deliv.avg_delay_minutes} min`;

  // Driver delays chart
  const dCanvas = document.getElementById('analyticsDriverDelayChart');
  if (dCanvas && deliv.driver_delay_chart) {
    if (driverDelayChart) driverDelayChart.destroy();
    driverDelayChart = new Chart(dCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: deliv.driver_delay_chart.labels,
        datasets: [{
          data: deliv.driver_delay_chart.data,
          backgroundColor: '#00d084',
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#f1f5f9' }, ticks: { callback: v => v + '%' } },
          y: { grid: { display: false } }
        }
      }
    });
  }

  // Route delays chart
  const rCanvas = document.getElementById('analyticsRouteDelayChart');
  if (rCanvas && deliv.route_delay_chart) {
    if (routeDelayChart) routeDelayChart.destroy();
    routeDelayChart = new Chart(rCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: deliv.route_delay_chart.labels,
        datasets: [{
          data: deliv.route_delay_chart.data,
          backgroundColor: '#3b82f6',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: '#f1f5f9' } }
        }
      }
    });
  }
}

function renderFuelAnalytics(fuel) {
  document.getElementById('anTotalFuel').textContent = `${Number(fuel.total_consumption_liters).toLocaleString()} L`;
  document.getElementById('anAvgKml').textContent = `${fuel.avg_kml} km/L`;
  document.getElementById('anTotalCost').textContent = `$${Number(fuel.total_fuel_cost).toLocaleString()}`;

  // Efficiency distribution
  const fCanvas = document.getElementById('analyticsFuelDistChart');
  if (fCanvas && fuel.efficiency_distribution) {
    if (fuelEfficiencyChart) fuelEfficiencyChart.destroy();
    fuelEfficiencyChart = new Chart(fCanvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: fuel.efficiency_distribution.labels,
        datasets: [{
          data: fuel.efficiency_distribution.data,
          backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#00d084', '#10b981'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        cutout: '65%'
      }
    });
  }

  // Fuel anomalies table
  const tbody = document.getElementById('fuelAnomaliesTableBody');
  if (tbody && fuel.fuel_anomalies) {
    tbody.innerHTML = fuel.fuel_anomalies.map(a => `
      <tr>
        <td><strong><a href="javascript:void(0)" onclick="window.navigateTo('/vehicles/${a.vehicle_id}')" style="color: var(--primary-text);">${a.vehicle_id}</a></strong></td>
        <td><code>${a.reg}</code></td>
        <td>${a.current_eff} km/L</td>
        <td>${a.baseline} km/L</td>
        <td><strong style="color: #ef4444;">${a.drop_pct}%</strong></td>
        <td><span class="pill-badge badge-high">${a.flag}</span></td>
      </tr>
    `).join('');
  }
}

function renderMaintenanceAnalytics(maint) {
  document.getElementById('anTotalMaintCost').textContent = `$${Number(maint.total_maintenance_cost).toLocaleString()}`;
  document.getElementById('anOverdueCount').textContent = maint.vehicles_overdue_count;

  const tbody = document.getElementById('maintOverdueTableBody');
  if (tbody && maint.overdue_vehicles) {
    tbody.innerHTML = maint.overdue_vehicles.map(o => `
      <tr>
        <td><strong><a href="javascript:void(0)" onclick="window.navigateTo('/vehicles/${o.vehicle_id}')" style="color: var(--primary-text);">${o.vehicle_id}</a></strong></td>
        <td><code>${o.registration_number}</code></td>
        <td>${o.make_model}</td>
        <td><strong style="color: #ef4444;">${Number(o.kms_since_service).toLocaleString()} km</strong></td>
        <td>${o.last_service_date}</td>
        <td><button class="btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.navigateTo('/vehicles/${o.vehicle_id}')">Inspect</button></td>
      </tr>
    `).join('');
  }
}

function getFallbackFleetAnalytics() {
  return {
    delivery_analytics: {
      on_time_pct: 92.4,
      delay_pct: 7.6,
      avg_delay_minutes: 34.5,
      driver_delay_chart: {
        labels: ["Marcus Vance", "Thomas Nowak", "David Dabrowski", "Elena Rostova", "Sarah Jenkins"],
        data: [19.2, 14.8, 12.1, 9.4, 4.2]
      },
      route_delay_chart: {
        labels: ["Warszawa - Krakow", "Warszawa - Poznan", "Wroclaw - Katowice", "Gdansk - Warszawa"],
        data: [42, 29, 21, 18]
      }
    },
    fuel_analytics: {
      total_consumption_liters: 42850,
      avg_kml: 8.7,
      total_fuel_cost: 58420.0,
      efficiency_distribution: {
        labels: ["< 6 km/L", "6-8 km/L", "8-10 km/L", "10-14 km/L", "> 14 km/L"],
        data: [8, 38, 42, 14, 8]
      },
      fuel_anomalies: [
        { vehicle_id: "VH-027", reg: "WA-4823K", current_eff: 6.8, baseline: 11.5, drop_pct: -40.8, flag: "Severe Degradation" },
        { vehicle_id: "VH-054", reg: "WA-1054P", current_eff: 7.1, baseline: 9.2, drop_pct: -22.8, flag: "High Idle Detected" }
      ]
    },
    maintenance_analytics: {
      total_maintenance_cost: 45800.0,
      service_frequency_monthly: 28,
      vehicles_overdue_count: 8,
      overdue_vehicles: [
        { vehicle_id: "VH-027", registration_number: "WA-4823K", make_model: "Volvo FL Electric", kms_since_service: 18850, last_service_date: "2025-08-28" }
      ]
    }
  };
}
