/**
 * FleetMind AI — Authentication & Session Controller
 */

function checkAuthState() {
  const token = localStorage.getItem('fleetmind_token');
  const user = JSON.parse(localStorage.getItem('fleetmind_user') || '{}');

  if (user && user.user_name) {
    const nameEl = document.getElementById('headerUserName');
    if (nameEl) nameEl.textContent = user.user_name;
    const roleEl = document.getElementById('headerUserRole');
    if (roleEl) roleEl.textContent = user.role || 'Fleet Manager';
  }
}

async function loginUser(email, password) {
  const res = await window.api.login(email, password);
  if (res && res.access_token) {
    localStorage.setItem('fleetmind_user', JSON.stringify({
      user_name: res.user_name,
      role: res.role,
      email: res.email
    }));
    checkAuthState();
    window.navigateTo('/dashboard');
  }
}

function initAuth() {
  const form = document.getElementById('loginForm');
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const pass = document.getElementById('loginPassword').value;
      await loginUser(email, pass);
    };
  }

  // Quick 1-click demo logins
  document.getElementById('demoLoginManagerBtn')?.addEventListener('click', () => {
    loginUser('manager@fleetmind.ai', 'fleetmind123');
  });

  document.getElementById('demoLoginSafetyBtn')?.addEventListener('click', () => {
    loginUser('safety@fleetmind.ai', 'fleetmind123');
  });

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    window.api.setToken(null);
    localStorage.removeItem('fleetmind_user');
    window.navigateTo('/login');
  });
}
