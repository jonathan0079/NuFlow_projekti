const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function () {
  console.log('Auth client script loaded');
  console.log('API URL is set to:', API_URL);

  const loginButton = document.getElementById('login-button');
  const modal = document.getElementById('login-modal');
  const closeModal = document.getElementById('close-modal');
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginError = document.getElementById('login-error');
  const registerError = document.getElementById('register-error');
  const userMenuTrigger = document.getElementById('user-menu-trigger');
  const logoutButton = document.getElementById('logoutButton');
  const userGreeting = document.getElementById('user-greeting');

  checkAuthStatus();

  if (loginButton) {
    loginButton.addEventListener('click', () => {
      modal.style.display = 'block';
      showLoginForm();
    });
  }

  if (closeModal) {
    closeModal.addEventListener('click', () => {
      modal.style.display = 'none';
      clearForms();
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      clearForms();
    }
  });

  if (loginTab) loginTab.addEventListener('click', showLoginForm);
  if (registerTab) registerTab.addEventListener('click', showRegisterForm);
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  if (logoutButton) logoutButton.addEventListener('click', handleLogout);

  function showLoginForm() {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
    clearErrors();
  }

  function showRegisterForm() {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
    clearErrors();
  }

  function clearForms() {
    loginForm.reset();
    registerForm.reset();
    clearErrors();
  }

  function clearErrors() {
    if (loginError) loginError.textContent = '';
    if (registerError) {
      registerError.textContent = '';
      registerError.className = 'login-error';
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
      loginError.textContent = 'Käyttäjänimi ja salasana vaaditaan';
      return;
    }

    const submitButton = loginForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Kirjaudutaan...';
    submitButton.disabled = true;

    const loginUrl = `${API_URL}/auth/login`;

    try {
      const response = await secureFetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response) {
        loginError.textContent = 'Palvelin ei vastaa tai yhteys epäonnistui.';
        return;
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON-parsing error:', jsonError);
        loginError.textContent = 'Virheellinen vastaus palvelimelta';
        return;
      }

      if (!response.ok) {
        loginError.textContent = data.message || 'Kirjautuminen epäonnistui';
        return;
      }

      localStorage.setItem('user', JSON.stringify(data));
      modal.style.display = 'none';
      updateAuthUI(true);
      window.location.reload();

    } catch (error) {
      console.error('Login error:', error);
      loginError.textContent = 'Palvelinvirhe, yritä myöhemmin uudelleen';
    } finally {
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
    }
  }

  function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('user');
    updateAuthUI(false);
    showMessage('Olet kirjautunut ulos onnistuneesti', 'success');

    if (window.location.pathname.includes('diary.html')) {
      setTimeout(() => { window.location.href = 'index.html'; }, 1000);
    } else {
      setTimeout(() => { window.location.reload(); }, 1000);
    }
  }

  function checkAuthStatus() {
    let user = null;
    const rawUser = localStorage.getItem('user');

    if (rawUser) {
      try {
        user = JSON.parse(rawUser);
      } catch (e) {
        console.warn('Invalid user data in localStorage, removing...');
        localStorage.removeItem('user');
      }
    }

    if (user && user.token) {
      const tokenPayload = parseJwt(user.token);
      const now = Math.floor(Date.now() / 1000);

      if (tokenPayload && tokenPayload.exp && tokenPayload.exp < now) {
        localStorage.removeItem('user');
        updateAuthUI(false);
        return;
      }

      updateAuthUI(true);
    } else {
      updateAuthUI(false);
    }
  }

  function updateAuthUI(isLoggedIn) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (isLoggedIn) {
      if (loginButton) loginButton.style.display = 'none';
      if (userMenuTrigger) {
        userMenuTrigger.style.display = 'flex';
        if (userGreeting) userGreeting.textContent = `Hei, ${user.user.given_name}!`;
      }
      const diaryNavLink = document.getElementById('diary-nav-link');
      if (diaryNavLink) diaryNavLink.style.display = 'inline';
    } else {
      if (loginButton) loginButton.style.display = 'inline-block';
      if (logoutButton) logoutButton.style.display = 'none';
      if (userMenuTrigger) userMenuTrigger.style.display = 'none';
      const diaryNavLink = document.getElementById('diary-nav-link');
      if (diaryNavLink) diaryNavLink.style.display = 'none';
    }
  }

  function showMessage(message, type = 'info') {
    let messageElement = document.getElementById('status-message');
    if (!messageElement) {
      messageElement = document.createElement('div');
      messageElement.id = 'status-message';
      messageElement.style.position = 'fixed';
      messageElement.style.top = '20px';
      messageElement.style.right = '20px';
      messageElement.style.padding = '10px 20px';
      messageElement.style.borderRadius = '5px';
      messageElement.style.zIndex = '1000';
      messageElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      document.body.appendChild(messageElement);
    }

    messageElement.textContent = message;
    messageElement.style.backgroundColor = type === 'success' ? '#4CAF50' :
                                           type === 'error' ? '#f44336' : '#2196F3';
    messageElement.style.color = 'white';
    messageElement.style.display = 'block';

    setTimeout(() => { messageElement.style.display = 'none'; }, 3000);
  }
});

function getAuthToken() {
  const user = JSON.parse(localStorage.getItem('user'));
  return user ? user.token : null;
}

function isAuthenticated() {
  return getAuthToken() !== null;
}

async function secureFetch(url, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      localStorage.removeItem('user');
      showMessage('Istunto vanhentunut. Kirjaudutaan ulos...', 'error');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
      return null;
    }

    return response;
  } catch (err) {
    console.error('secureFetch error:', err);
    showMessage('Palvelinvirhe, yritä myöhemmin uudelleen.', 'error');
    return null;
  }
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse JWT token:', e);
    return null;
  }
}
