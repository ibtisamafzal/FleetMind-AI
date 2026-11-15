/**
 * FleetMind AI — Master SPA Router & App Coordinator
 */

const ROUTES = {
  '/dashboard': 'viewDashboard',
  '/vehicles': 'viewVehicles',
  '/vehicles/:id': 'viewVehicleDetail',
  '/drivers': 'viewDrivers',
  '/trips': 'viewTrips',
  '/analytics': 'viewAnalytics',
  '/ai-assistant': 'viewAIAssistant',
  '/settings': 'viewSettings',
  '/login': 'viewLogin'
};

window.navigateTo = function(path) {
  window.location.hash = path;
};

function handleRoute() {
  const hash = window.location.hash.slice(1) || '/dashboard';
  
  // Hide all views
  document.querySelectorAll('.page-view').forEach(el => el.classList.remove('active-view'));

  // Update floating nav pills
  document.querySelectorAll('.nav-pill-btn').forEach(btn => btn.classList.remove('active'));

  // Handle vehicle detail /vehicles/:id
  if (hash.startsWith('/vehicles/')) {
    const vId = hash.split('/')[2];
    const viewEl = document.getElementById('viewVehicleDetail');
    if (viewEl) viewEl.classList.add('active-view');
    document.querySelector(`[data-route="/vehicles"]`)?.classList.add('active');
    loadVehicleDetails(vId);
    return;
  }

  const targetViewId = ROUTES[hash] || 'viewDashboard';
  const viewEl = document.getElementById(targetViewId);
  if (viewEl) {
    viewEl.classList.add('active-view');
  }

  // Active pill highlight
  const activeBtn = document.querySelector(`[data-route="${hash}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  // Specific initializations
  if (hash === '/dashboard') {
    initDashboard();
  } else if (hash === '/vehicles') {
    initVehicles();
  } else if (hash === '/drivers') {
    initDrivers();
  } else if (hash === '/trips') {
    initTrips();
  } else if (hash === '/analytics') {
    initAnalytics();
  } else if (hash === '/ai-assistant') {
    initAIAssistant();
  } else if (hash === '/settings') {
    initSettings();
  }

  window.scrollTo(0, 0);
}

// Theme Toggle
function setupThemeToggle() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const savedTheme = localStorage.getItem('fleetmind_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  if (toggleBtn) {
    toggleBtn.onclick = () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('fleetmind_theme', next);
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupThemeToggle();
  initAuth();
  checkAuthState();

  // Floating pill click listeners
  document.querySelectorAll('.nav-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const route = btn.getAttribute('data-route');
      if (route) window.navigateTo(route);
    });
  });

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
});
