const API_URL = 'http://localhost:5000/api';

// Odottaa, että koko sivu on ladattu
document.addEventListener('DOMContentLoaded', function() {
  console.log('Auth client script ladattu');
  console.log('API URL on asetettu:', API_URL);
  
// Etsii tarvittavat elementit DOM:sta
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
  const userMenuContent = document.getElementById('user-menu-content');
  const logoutButton = document.getElementById('logoutButton');
  const userGreeting = document.getElementById('user-greeting');

 // Tarkistaa käyttäjän kirjautumistilan
  checkAuthStatus();

  // Näyttää login-modal ikkunan, kun login-nappia painetaan
  if (loginButton) {
    console.log('Login-nappi löytyi');
    loginButton.addEventListener('click', () => {
      console.log('Login-nappia painettu');
      modal.style.display = 'block';
      showLoginForm();
    });
  } else {
    console.warn('Login-nappia ei löytynyt DOM:sta');
  }

// Sulkee login-modal ikkunan, kun sulje-nappia painetaan
  if (closeModal) {
    closeModal.addEventListener('click', () => {
      console.log('Sulje-nappia painettu');
      modal.style.display = 'none';
      clearForms();
    });
  }

// Sulkee login-modal ikkunan, kun klikataan ulkopuolelle
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      console.log('Klikattu modalin ulkopuolelle, suljetaan');
      modal.style.display = 'none';
      clearForms();
    }
  });

 // Vaihtaa login- ja rekisteröintilomakkeiden välillä
  if (loginTab) {
    loginTab.addEventListener('click', showLoginForm);
  }

  if (registerTab) {
    registerTab.addEventListener('click', showRegisterForm);
  }

// Käsittelee login-lomakkeen lähettämistä
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  } else {
    console.warn('Login-lomaketta ei löytynyt DOM:sta');
  }

// Käsittelee logout-nappia
  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  }

// Näyttää login-lomakkeen ja piilottaa rekisteröintilomakkeen
  function showLoginForm() {
    console.log('Näytetään login-lomake');
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
    clearErrors();
  }

// Näyttää rekisteröintilomakkeen ja piilottaa login-lomakkeen
  function showRegisterForm() {
    console.log('Näytetään rekisteröintilomake');
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
    clearErrors();
  }

// Tyhjentää lomakkeet
  function clearForms() {
    console.log('Tyhjennetään lomakkeet');
    loginForm.reset();
    registerForm.reset();
    clearErrors();
  }

 // Tyhjentää virheilmoitukset
  function clearErrors() {
    if (loginError) loginError.textContent = '';
    if (registerError) {
      registerError.textContent = '';
      registerError.className = 'login-error'; // Resetoinnin jälkeen palautetaan alkuperäinen tyyli
    }
  }

// Käsittelee login-lomakkeen lähettämistä
async function handleLogin(e) {
  e.preventDefault();
  console.log('Login-lomake lähetetty');
  
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  
  if (!username || !password) {
    loginError.textContent = 'Käyttäjänimi ja salasana vaaditaan';
    return;
  }
  
  console.log('Yritetään kirjautua käyttäjänimellä:', username);
  
  const submitButton = loginForm.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.textContent;
  submitButton.textContent = 'Kirjaudutaan...';
  submitButton.disabled = true;
  
  const loginUrl = `${API_URL}/auth/login`;
  console.log('Login-päätepiste (täysi URL):', loginUrl);
  
  try {
    const response = await secureFetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
  
    if (!response) return;
  
    const data = await response.json();
  
    if (!response.ok) {
      loginError.textContent = data.message || 'Kirjautuminen epäonnistui';
      console.error('Kirjautuminen epäonnistui:', data.message);
      return;
    }
  
    // Tallenna käyttäjätiedot
    localStorage.setItem('user', JSON.stringify(data));
    modal.style.display = 'none';
    updateAuthUI(true);
    
    // Tarkista käyttäjän tila
    const hasMetrics = await checkUserStatus();
    
    // Ohjaa käyttäjä oikealle sivulle
    if (hasMetrics) {
      // Olemassa oleva käyttäjä - vie päiväkirjasivulle
      window.location.href = 'diary.html';
    } else {
      // Uusi käyttäjä - vie esitietosivulle
      window.location.href = 'initial_info.html';
    }
    
  } catch (error) {
    console.error('Kirjautumisvirhe:', error);
    loginError.textContent = 'Palvelinvirhe, yritä myöhemmin uudelleen';
  } finally {
    submitButton.textContent = originalButtonText;
    submitButton.disabled = false;
  }
}

// Käsittelee rekisteröinnin lähettämistä
  async function handleRegister(e) {
    e.preventDefault();
    console.log('Register form submitted');
    
// Tyhjentää errorit
    if (registerError) {
      registerError.textContent = '';
      registerError.className = 'login-error';
    }
    
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
// Validoi käyttäjän syötteet
    if (!username || !password || !confirmPassword) {
      registerError.textContent = 'Kaikki kentät vaaditaan';
      return;
    }
    
    if (password !== confirmPassword) {
      registerError.textContent = 'Salasanat eivät täsmää';
      return;
    }
    
    console.log('Attempting to register user:', { username });
    
    try {
// Näyttää lataus tilan
      const submitButton = registerForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.textContent = 'Rekisteröidään...';
      submitButton.disabled = true;
      
      const response = await secureFetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      console.log('Registration response:', data);
      
// Palauttaa alkuperäisen tilan napille
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
      
// tarkistaa vastauksen
      if (!response.ok) {
        registerError.textContent = data.message || 'Rekisteröinti epäonnistui';
        console.error('Registration failed:', data.message || 'Unknown error');
        return;
      }
      
// rekisteröinti onnistui
      if (data.success) {
// Näyttää onnistuneen rekisteröinnin viestin
        registerError.textContent = 'Rekisteröinti onnistui! Voit nyt kirjautua sisään.';
        registerError.className = 'login-error success';
        
// Tyhjentää formit
        registerForm.reset();
        
// Näyttää login formia
        setTimeout(() => {
          showLoginForm();
        }, 2000);
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      registerError.textContent = 'Palvelinvirhe, yritä myöhemmin uudelleen';
    }
  }

// Käsittelee uloskirjautumista
  function handleLogout(e) {
    e.preventDefault();
    console.log('Logging out user');
    localStorage.removeItem('user');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);


  window.addEventListener('popstate', async function() {
    const hasMetrics = await checkUserStatus();
    if (!hasMetrics && !window.location.pathname.includes('initial_info.html')) {
      showMessage('Täytä ensin esitietolomake', 'warning');
      window.location.href = 'initial_info.html';
  }
  });
    
// Päivittää UI:n uloskirjautumisen jälkeen
    updateAuthUI(false);
    
// Näyttää viestin onnistuneesta uloskirjautumisesta
    showMessage('Olet kirjautunut ulos onnistuneesti', 'success');
    
    
// jos käyttäjä on päiväkirja sivulla, ohjaa hänet etusivulle
    if (window.location.pathname.includes('diary.html')) {
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    } else {
// jos käyttäjä on etusivulla, päivitä sivu
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

// Tarkistaa käyttäjän kirjautumistilan
function checkAuthStatus() {
  console.log('Checking authentication status');

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch (e) {
    console.warn('Invalid user data in localStorage');
  }

  if (user && user.token) {
    const tokenPayload = parseJwt(user.token);
    const now = Math.floor(Date.now() / 1000);

    if (tokenPayload && tokenPayload.exp && tokenPayload.exp < now) {
      console.warn('Token is expired, logging out.');
      localStorage.removeItem('user');
      updateAuthUI(false);
      return;
    }

    console.log('User is logged in:', user.user.given_name);
    updateAuthUI(true);
    
    // Tarkista ja ohjaa vain jos ei olla initial_info sivulla
    if (!window.location.pathname.includes('initial_info.html')) {
      checkAndRedirect();
    }
    
    // Estä navigointi uusille käyttäjille
    checkUserStatusAndRestrictNavigation();
  } else {
    updateAuthUI(false);
    if (window.location.pathname.includes('diary.html') || 
        window.location.pathname.includes('initial_info.html') ||
        window.location.pathname.includes('myinfo.html')) {
      window.location.href = 'index.html';
    }
  }
}

// Päivittää käyttöliittymän kirjautumisen tilan mukaan

  function updateAuthUI(isLoggedIn) {
    console.log('Updating UI for authentication status:', isLoggedIn);
    if (isLoggedIn) {
// Hakee käyttäjän tiedot
      const user = JSON.parse(localStorage.getItem('user'));
      
// Piilottaa login napin
      if (loginButton) {
        loginButton.style.display = 'none';
        console.log('Login button hidden');
      }
      
// Näyttää käyttäjävalikon
      if (userMenuTrigger) {
        userMenuTrigger.style.display = 'flex';
        if (userGreeting) {
          userGreeting.textContent = `Hei, ${user.user.given_name}!`;
        }
        console.log('User menu displayed');
      } else {
        console.warn('User menu trigger not found');
      }
      
// Näyttää päiväkirja linkin navigaatiossa
      const diaryNavLink = document.getElementById('diary-nav-link');
      if (diaryNavLink) {
        diaryNavLink.style.display = 'inline';
        console.log('Diary nav link displayed');
      } else {
        console.warn('Diary nav link not found');
      }
    } else {

// Näyttää login napin
      if (loginButton) {
        loginButton.style.display = 'inline-block';
        console.log('Login button displayed');
      }

// Piilottaa logout napin
      if (logoutButton) {
        logoutButton.style.display = 'none';
        console.log('Logout button hidden');
      }
      
// Piilottaa käyttäjävalikon
      if (userMenuTrigger) {
        userMenuTrigger.style.display = 'none';
        console.log('User menu hidden');
      }
      
// Piilottaa päiväkirja linkin navigaatiossa
      const diaryNavLink = document.getElementById('diary-nav-link');
      if (diaryNavLink) {
        diaryNavLink.style.display = 'none';
        console.log('Diary nav link hidden');
      }
      
// Piilottaa "Omat tiedot" -linkin
      const myInfoNavLink = document.querySelector('a[href="/myinfo.html"]');
      if (myInfoNavLink) {
        myInfoNavLink.parentElement.style.display = 'none';
        console.log('MyInfo nav link hidden');
      }
    }
  }

// Näyttää viestin käyttäjälle

  function showMessage(message, type = 'info') {
// Luo viesti elementin, jos sitä ei ole olemassa
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

// Asettaa viestin sisällön ja tyylin
    messageElement.textContent = message;
    
// Asettaa värin viestin tyypin mukaan
    if (type === 'error') {
      messageElement.style.backgroundColor = '#f44336';
      messageElement.style.color = 'white';
    } else if (type === 'success') {
      messageElement.style.backgroundColor = '#4CAF50';
      messageElement.style.color = 'white';
    } else {
      messageElement.style.backgroundColor = '#2196F3';
      messageElement.style.color = 'white';
    }

// Näyttää viestin
    messageElement.style.display = 'block';

// Piilottaa viestin 3 sekunnin kuluttua
    setTimeout(() => {
      messageElement.style.display = 'none';
    }, 3000);
  }
});

// Hakee autentikaatio tokenin local storagesta

function getAuthToken() {
  const user = JSON.parse(localStorage.getItem('user'));
  return user ? user.token : null;
}

// Tarkistaa onko käyttäjä kirjautunut
function isAuthenticated() {
  return getAuthToken() !== null;
}

document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("login-modal");
  const heroContainer = document.querySelector(".hero-container");
  const loginButton = document.getElementById("login-button");
  const closeModal = document.getElementById("close-modal");

  // Näytä modaali ja piilota hero-container
  loginButton.addEventListener("click", function () {
      modal.style.display = "block";
      heroContainer.style.display = "none"; // Piilota hero-container
  });

  // Sulje modaali ja näytä hero-container uudelleen
  closeModal.addEventListener("click", function () {
      modal.style.display = "none";
      heroContainer.style.display = "block"; // Näytä hero-container uudelleen
  });

  // Sulje modaali klikkaamalla ulkopuolelle
  window.addEventListener("click", function (event) {
      if (event.target === modal) {
          modal.style.display = "none";
          heroContainer.style.display = "block"; // Näytä hero-container uudelleen
      }
  });
});

// Tarkistaa onko token vanhentunut / 401 ja ohjaa ulos
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
      console.warn('Token expired or unauthorized. Logging out.');
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
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse JWT token:', e);
    return null;
  }
};

async function checkUserStatus() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || !user.token) return false;
  
  // Haetaan käyttäjän ID
  const userId = user.user_id || user.id || user.userId || (user.user && user.user.id);
  
  try {
    // Käytä ensimmäisenä metrics/:id endpointia
    let response = await fetch(`${API_URL}/metrics/${userId}`, {
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });
    
    // Jos 404, kokeile toista päätepistettä
    if (response.status === 404) {
      response = await fetch(`${API_URL}/metrics/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
    }
    
    if (response.status === 404) {
      // Ei löytynyt tietoja, uusi käyttäjä
      return false;
    }
    
    if (!response.ok) {
      // Älä heitä virhettä, vaan palauta false
      console.error('Error checking user status:', response.status);
      return false;
    }
    
    const metrics = await response.json();
    // Jos käyttäjällä on metriikat, hän on olemassa oleva käyttäjä
    return metrics && metrics.length > 0;
    
  } catch (error) {
    // Älä heitä virhettä, vaan palauta false
    console.error('Error checking user status:', error);
    return false;
  }
}

// Lisää auth.js tiedostoon
async function checkAndRedirect() {
  const currentPath = window.location.pathname;
  const hasMetrics = await checkUserStatus();
  
  // Jos käyttäjä on index.html sivulla, ohjaa hänet oikealle sivulle
  
  // Jos uusi käyttäjä yrittää päästä diary tai myinfo sivulle
  if (!hasMetrics && (currentPath.includes('diary.html') || currentPath.includes('myinfo.html'))) {
    showMessage('Täytä ensin esitietolomake', 'error');
    window.location.href = 'initial_info.html';
  }
}

async function checkUserStatusAndRestrictNavigation() {
  const hasMetrics = await checkUserStatus();
  
  if (!hasMetrics) {
    // Piilota kaikki navigaatiolinkit uusilta käyttäjiltä
    const diaryLink = document.querySelector('a[href="/diary.html"]');
    const myInfoLink = document.querySelector('a[href="/myinfo.html"]');
    const homeLink = document.querySelector('a[href="/index.html"]');

    if (homeLink && homeLink.parentElement) {
      homeLink.parentElement.style.display = 'none';
    }
    
    if (diaryLink && diaryLink.parentElement) {
      diaryLink.parentElement.style.display = 'none';
    }
    
    if (myInfoLink && myInfoLink.parentElement) {
      myInfoLink.parentElement.style.display = 'none';
    }


  } else {
    // Varmista että linkit ovat näkyvissä kun käyttäjä on täyttänyt lomakkeen
    const homeLink = document.querySelector('a[href="/index.html"]');
    const diaryLink = document.querySelector('a[href="/diary.html"]');
    const myInfoLink = document.querySelector('a[href="/myinfo.html"]');
    
    if (homeLink && homeLink.parentElement) {
      homeLink.parentElement.style.display = '';
    }
    
    if (diaryLink && diaryLink.parentElement) {
      diaryLink.parentElement.style.display = '';
    }
    
    if (myInfoLink && myInfoLink.parentElement) {
      myInfoLink.parentElement.style.display = '';
    }
  }
}
