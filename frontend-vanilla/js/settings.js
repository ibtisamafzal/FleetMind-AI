/**
 * FleetMind AI — Settings Controller
 * Dynamic weights adjustment and Ollama LLM configuration
 */

async function initSettings() {
  const current = await window.api.getSettings();
  renderSettingsForm(current);
  setupSettingsListeners();
}

function renderSettingsForm(s) {
  const urlEl = document.getElementById('setOllamaUrl');
  if (urlEl) urlEl.value = s.ollama_base_url || 'http://localhost:11434';

  const modelEl = document.getElementById('setOllamaModel');
  if (modelEl) modelEl.value = s.ollama_model || 'llama3.2';

  const wMaint = document.getElementById('setWeightMaint');
  const wFuel = document.getElementById('setWeightFuel');
  const wDelay = document.getElementById('setWeightDelay');

  if (wMaint && s.weights) wMaint.value = Math.round((s.weights.maintenance || 0.4) * 100);
  if (wFuel && s.weights) wFuel.value = Math.round((s.weights.fuel || 0.3) * 100);
  if (wDelay && s.weights) wDelay.value = Math.round((s.weights.delay || 0.3) * 100);

  updateWeightLabels();
}

function updateWeightLabels() {
  const m = parseInt(document.getElementById('setWeightMaint')?.value || 40);
  const f = parseInt(document.getElementById('setWeightFuel')?.value || 30);
  const d = parseInt(document.getElementById('setWeightDelay')?.value || 30);

  document.getElementById('setWeightMaintVal').textContent = `${m}%`;
  document.getElementById('setWeightFuelVal').textContent = `${f}%`;
  document.getElementById('setWeightDelayVal').textContent = `${d}%`;

  const total = m + f + d;
  const totalEl = document.getElementById('setWeightTotal');
  if (totalEl) {
    totalEl.textContent = `${total}%`;
    totalEl.style.color = (total === 100) ? 'var(--primary-text)' : '#ef4444';
  }
}

function setupSettingsListeners() {
  ['setWeightMaint', 'setWeightFuel', 'setWeightDelay'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateWeightLabels);
  });

  const form = document.getElementById('settingsConfigForm');
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const m = parseInt(document.getElementById('setWeightMaint').value) / 100;
      const f = parseInt(document.getElementById('setWeightFuel').value) / 100;
      const d = parseInt(document.getElementById('setWeightDelay').value) / 100;

      const payload = {
        ollama_base_url: document.getElementById('setOllamaUrl').value,
        ollama_model: document.getElementById('setOllamaModel').value,
        weight_maintenance: m,
        weight_fuel: f,
        weight_delay: d
      };

      await window.api.saveSettings(payload);
      alert("Settings and risk calculation weights updated successfully!");
    };
  }
}
