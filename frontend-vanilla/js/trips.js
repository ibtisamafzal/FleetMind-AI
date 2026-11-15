/**
 * FleetMind AI — Trips & ML Delay Predictor Controller
 */

async function initTrips() {
  loadTripsList();
  setupTripsListeners();
}

async function loadTripsList() {
  const status = document.getElementById('tripStatusFilter')?.value || 'All';
  const trips = await window.api.getTrips(status !== 'All' ? { status } : {});
  renderTripsTable(trips);
}

function renderTripsTable(trips) {
  const tbody = document.getElementById('tripsTableBody');
  if (!tbody) return;

  tbody.innerHTML = trips.map(t => {
    let statusClass = 'badge-active';
    if (t.delivery_status === 'Delayed') statusClass = 'badge-delayed';
    else if (t.delivery_status === 'Cancelled') statusClass = 'badge-medium';

    return `
      <tr>
        <td><strong>${t.trip_id}</strong></td>
        <td><a href="javascript:void(0)" onclick="window.navigateTo('/vehicles/${t.vehicle_id}')" style="color: var(--primary-text); font-weight: 700;">${t.vehicle_id}</a></td>
        <td>${t.driver_id}</td>
        <td>${t.origin} → ${t.destination}</td>
        <td>${t.distance_km} km</td>
        <td>${t.estimated_duration}m / ${t.actual_duration ? t.actual_duration + 'm' : '--'}</td>
        <td>${t.number_of_stops}</td>
        <td><span class="pill-badge badge-blue">${t.traffic_level}</span></td>
        <td><span class="pill-badge" style="background: #f1f5f9; color: #475569;">${t.weather_condition}</span></td>
        <td><span class="pill-badge ${statusClass}">${t.delivery_status}</span></td>
      </tr>
    `;
  }).join('');
}

function setupTripsListeners() {
  document.getElementById('tripStatusFilter')?.addEventListener('change', loadTripsList);

  // Delay Predictor Form Submission
  const form = document.getElementById('delayPredictorForm');
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        distance_km: parseFloat(document.getElementById('dpDistance').value) || 25,
        estimated_duration: parseFloat(document.getElementById('dpDuration').value) || 40,
        number_of_stops: parseInt(document.getElementById('dpStops').value) || 2,
        traffic_level: document.getElementById('dpTraffic').value,
        weather_condition: document.getElementById('dpWeather').value,
        hour_of_day: parseInt(document.getElementById('dpHour').value) || 9,
        day_of_week: parseInt(document.getElementById('dpDay').value) || 2,
        driver_id: document.getElementById('dpDriver').value || 'DRV-001',
        vehicle_id: document.getElementById('dpVehicle').value || 'VH-027'
      };

      const resultBox = document.getElementById('delayPredictorResultBox');
      resultBox.style.display = 'block';
      resultBox.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 12px;">Running Random Forest inference...</div>`;

      const res = await window.api.predictDelay(payload);

      const probPercent = Math.round(res.delay_probability * 100);
      const isHigh = res.risk_level === 'HIGH';
      const badgeClass = isHigh ? 'badge-high' : (res.risk_level === 'MEDIUM' ? 'badge-medium' : 'badge-low');

      resultBox.innerHTML = `
        <div style="
          background: ${isHigh ? '#fee2e2' : '#f0fdf4'};
          border: 1px solid ${isHigh ? '#fca5a5' : '#bbf7d0'};
          border-radius: var(--radius-lg);
          padding: 18px;
          margin-top: 14px;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="color: #111827; font-size: 15px;">ML Delay Prediction</strong>
            <span class="pill-badge ${badgeClass}">${res.risk_level} RISK</span>
          </div>
          <div style="font-size: 26px; font-weight: 800; color: ${isHigh ? '#ef4444' : '#059669'}; margin-bottom: 4px;">
            ${probPercent}% Probability
          </div>
          <p style="font-size: 13px; color: #4b5563; margin-bottom: 8px;">
            Target Outcome: <strong>${res.prediction}</strong>
          </p>
          <div style="height: 6px; background: #e5e7eb; border-radius: 9999px; overflow: hidden;">
            <div style="width: ${probPercent}%; height: 100%; background: ${isHigh ? '#ef4444' : '#10b981'};"></div>
          </div>
        </div>
      `;
    };
  }
}

// Bulk CSV Upload trigger
window.openCSVUploadModal = function() {
  const modal = document.getElementById('csvUploadModal');
  if (modal) modal.classList.add('active');
};

window.closeCSVUploadModal = function() {
  const modal = document.getElementById('csvUploadModal');
  if (modal) modal.classList.remove('active');
};
