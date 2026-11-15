/**
 * FleetMind AI — Drivers Management Controller
 */

async function initDrivers() {
  const drivers = await window.api.getDrivers();
  renderDriversTable(drivers);
  setupDriverListeners();
}

function renderDriversTable(drivers) {
  const tbody = document.getElementById('driversTableBody');
  if (!tbody) return;

  tbody.innerHTML = drivers.map(d => {
    const isRobert = d.name.includes("Robert");
    const avatarSrc = isRobert ? 'assets/images/driver_robert.jpg' : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face';

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${avatarSrc}" alt="${d.name}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover;">
            <div>
              <strong style="display: block; color: var(--text-main); font-size: 14px;">${d.name}</strong>
              <span style="font-size: 11px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace;">${d.driver_id}</span>
            </div>
          </div>
        </td>
        <td>${d.experience_years} years</td>
        <td>${Number(d.total_trips).toLocaleString()}</td>
        <td>
          <span style="color: ${d.late_deliveries > 20 ? '#ef4444' : 'var(--text-main)'}; font-weight: 600;">
            ${d.late_deliveries} (${d.delay_rate || 2.7}%)
          </span>
        </td>
        <td>${d.accidents}</td>
        <td>${d.average_speed} km/h</td>
        <td>
          <div style="display: flex; align-items: center; gap: 4px; color: #f59e0b; font-weight: 700;">
            ★ <span>${d.rating}</span>
          </div>
        </td>
        <td>
          <span class="pill-badge ${d.status === 'Active' ? 'badge-active' : 'badge-idle'}">${d.status}</span>
        </td>
        <td>
          <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px;" onclick="window.askAboutDriver('${d.name}')">Ask AI</button>
        </td>
      </tr>
    `;
  }).join('');
}

function setupDriverListeners() {
  document.getElementById('driverSearchInput')?.addEventListener('input', async (e) => {
    const drivers = await window.api.getDrivers({ search: e.target.value });
    renderDriversTable(drivers);
  });
}

window.askAboutDriver = function(name) {
  window.navigateTo('/ai-assistant');
  const input = document.getElementById('aiChatInput');
  if (input) {
    input.value = `Summarize driver performance for ${name}.`;
    window.sendChatMessage();
  }
};
