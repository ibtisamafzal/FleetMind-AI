/**
 * FleetMind AI — Vehicle Details Controller (/vehicles/:id)
 * Renders full telemetry, component risks, AI explanations, and recommended actions
 */

let vehicleRiskTrendChart = null;

async function loadVehicleDetails(vehicleId) {
  const detail = await window.api.getVehicleDetail(vehicleId);
  const history = await window.api.getVehicleHistory(vehicleId);

  renderVehicleHeader(detail);
  renderRiskScores(detail);
  renderAIInsights(detail);
  renderHistoryTabs(history);
  renderRiskTrendChart(detail);
}

function renderVehicleHeader(v) {
  document.getElementById('vdVehicleIdTitle').textContent = `Vehicle #${v.vehicle_id}`;
  document.getElementById('vdPlateBadge').textContent = v.registration_number;
  document.getElementById('vdStatusBadge').textContent = v.current_status;
  document.getElementById('vdMakeModelYear').textContent = `${v.make} ${v.model} • ${v.manufacturing_year} • ${v.fuel_type} • ${v.vehicle_type}`;
  document.getElementById('vdMileageText').textContent = `${Number(v.mileage).toLocaleString()} km`;
  document.getElementById('vdLastServiceText').textContent = v.last_service_date || 'N/A';

  const img = document.getElementById('vdHeroImage');
  if (img) {
    const isTruck = v.vehicle_type.includes('Truck');
    img.src = isTruck ? 'assets/images/delivery_truck.jpg' : 'assets/images/delivery_van.jpg';
  }

  // Hook "Ask FleetMind about this vehicle" button
  const askBtn = document.getElementById('vdAskAIBtn');
  if (askBtn) {
    askBtn.onclick = () => {
      window.navigateTo('/ai-assistant');
      const input = document.getElementById('aiChatInput');
      if (input) {
        input.value = `Why is vehicle ${v.vehicle_id} high risk?`;
        window.sendChatMessage();
      }
    };
  }
}

function renderRiskScores(v) {
  const overall = v.risk_score || 82;
  const mRisk = v.maintenance_risk || 81;
  const fRisk = v.fuel_risk || 88;
  const dRisk = v.delay_risk || 72;

  document.getElementById('vdOverallRiskNum').textContent = `${overall} / 100`;
  const badge = document.getElementById('vdOverallRiskLevel');
  if (badge) {
    badge.textContent = v.risk_level || 'HIGH';
    badge.className = `pill-badge ${overall >= 70 ? 'badge-high' : (overall >= 40 ? 'badge-medium' : 'badge-low')}`;
  }

  // Maintenance Risk Bar
  setBar('vdMaintRiskBar', 'vdMaintRiskVal', mRisk, '#ef4444');
  // Fuel Risk Bar
  setBar('vdFuelRiskBar', 'vdFuelRiskVal', fRisk, '#f59e0b');
  // Delay Risk Bar
  setBar('vdDelayRiskBar', 'vdDelayRiskVal', dRisk, '#3b82f6');
}

function setBar(barId, valId, val, color) {
  const bar = document.getElementById(barId);
  const text = document.getElementById(valId);
  if (bar) {
    bar.style.width = `${val}%`;
    bar.style.backgroundColor = color;
  }
  if (text) text.textContent = `${val}%`;
}

function renderAIInsights(v) {
  const expBox = document.getElementById('vdAIExplanationText');
  if (expBox) {
    expBox.textContent = v.ai_explanation || 
      `The major contributing factors are high mileage since the last service (${Number(v.kms_since_service || 18850).toLocaleString()} km) and declining fuel efficiency (${v.avg_efficiency || 6.8} km/L).`;
  }

  const recList = document.getElementById('vdRecommendedActionsList');
  if (recList) {
    const recs = v.recommended_actions || [
      "Schedule maintenance inspection immediately.",
      "Review recent fuel consumption logs.",
      "Avoid assigning long-distance deliveries until inspection.",
      "Review recent driver performance."
    ];
    recList.innerHTML = recs.map((r, i) => `
      <li>
        <span style="font-weight: 700; color: var(--primary);">${i + 1}.</span>
        <span>${r}</span>
      </li>
    `).join('');
  }
}

function renderHistoryTabs(history) {
  // Trips table
  const tripsTbody = document.getElementById('vdTripsTableBody');
  if (tripsTbody && history.trips) {
    tripsTbody.innerHTML = history.trips.map(t => `
      <tr>
        <td><strong>${t.trip_id}</strong></td>
        <td>${t.origin} → ${t.destination}</td>
        <td>${t.distance_km} km</td>
        <td>${t.departure_time.split('T')[0]}</td>
        <td><span class="pill-badge ${t.delivery_status === 'Delayed' ? 'badge-delayed' : 'badge-active'}">${t.delivery_status}</span></td>
      </tr>
    `).join('');
  }

  // Fuel table
  const fuelTbody = document.getElementById('vdFuelTableBody');
  if (fuelTbody && history.fuel_records) {
    fuelTbody.innerHTML = history.fuel_records.map(f => `
      <tr>
        <td><strong>${f.record_id}</strong></td>
        <td>${f.date}</td>
        <td>${f.fuel_amount_liters} L</td>
        <td>$${f.cost_usd}</td>
        <td><strong>${f.efficiency_kml} km/L</strong></td>
      </tr>
    `).join('');
  }

  // Maintenance table
  const maintTbody = document.getElementById('vdMaintTableBody');
  if (maintTbody && history.maintenance_records) {
    maintTbody.innerHTML = history.maintenance_records.map(m => `
      <tr>
        <td><strong>${m.maintenance_id}</strong></td>
        <td>${m.service_date}</td>
        <td>${m.service_type}</td>
        <td>$${m.cost_usd}</td>
        <td>${m.notes || 'Normal inspection'}</td>
      </tr>
    `).join('');
  }
}

function renderRiskTrendChart(v) {
  const canvas = document.getElementById('vdRiskTrendChart');
  if (!canvas) return;

  if (vehicleRiskTrendChart) vehicleRiskTrendChart.destroy();

  const ctx = canvas.getContext('2d');
  const days = ["Day 1", "Day 5", "Day 10", "Day 15", "Day 20", "Day 25", "Day 30"];
  // Simulated gradual risk increase for high-risk vehicles
  const scores = (v.risk_score >= 70) 
    ? [52, 58, 64, 71, 74, 79, v.risk_score] 
    : [30, 32, 34, 31, 35, 33, v.risk_score];

  vehicleRiskTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: days,
      datasets: [{
        label: 'Overall Operational Risk',
        data: scores,
        borderColor: (v.risk_score >= 70) ? '#ef4444' : '#10b981',
        borderWidth: 2.5,
        fill: false,
        tension: 0.3,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: (v.risk_score >= 70) ? '#ef4444' : '#10b981',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          min: 0,
          max: 100,
          grid: { color: '#f1f5f9' }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}
