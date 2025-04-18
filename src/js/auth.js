const API_URL = 'http://localhost:5000/api';

// Odottaa, että koko sivu on ladattu
document.addEventListener('DOMContentLoaded', function() {
  console.log('Auth client script loaded');
  console.log('API URL is set to:', API_URL);
  
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

  // Näyttää login modalin, kun login nappia painetaan
  if (loginButton) {
    console.log('Login button found');
    loginButton.addEventListener('click', () => {
      console.log('Login button clicked');
      modal.style.display = 'block';
      showLoginForm();
    });
  } else {
    console.warn('Login button not found in the DOM');
  }

// Sulkee login modalin, kun close modal nappia painetaan
  if (closeModal) {
    closeModal.addEventListener('click', () => {
      console.log('Close modal button clicked');
      modal.style.display = 'none';
      clearForms();
    });
  }

// Sulkee login modalin, kun klikataan ulkopuolelle
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      console.log('Clicked outside modal, closing');
      modal.style.display = 'none';
      clearForms();
    }
  });

 // vaihtaa login ja register formien välillä
  if (loginTab) {
    loginTab.addEventListener('click', showLoginForm);
  }

  if (registerTab) {
    registerTab.addEventListener('click', showRegisterForm);
  }

// Käsittelee login formia
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  } else {
    console.warn('Login form not found in the DOM');
  }

// Käsittelee register formia
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  } else {
    console.warn('Register form not found in the DOM');
  }

// Käsittelee logout nappia
  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  }

// Näyttää login formia ja piilottaa register formia
  function showLoginForm() {
    console.log('Showing login form');
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
    clearErrors();
  }

// sama kuin edellinen mutta toisinpäin
  function showRegisterForm() {
    console.log('Showing register form');
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
    clearErrors();
  }

// Tyhjentää formit
  function clearForms() {
    console.log('Clearing forms');
    loginForm.reset();
    registerForm.reset();
    clearErrors();
  }

 // Tyhjentää errorit
  function clearErrors() {
    if (loginError) loginError.textContent = '';
    if (registerError) {
      registerError.textContent = '';
      registerError.className = 'login-error'; // Resetoinnin jälkeen palautetaan alkuperäinen tyyli
    }
  }

//Käsittelee login formin lähettämistä
  async function handleLogin(e) {
    e.preventDefault();
    console.log('Login form submitted');
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    // Validoi käyttäjän syötteet
    if (!username || !password) {
      loginError.textContent = 'Käyttäjänimi ja salasana vaaditaan';
      return;
    }
    
    console.log('Attempting login with username:', username);
    
    // Näyttää lataus tilan
    const submitButton = loginForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Kirjaudutaan...';
    submitButton.disabled = true;
    
    // Rakentaa login endpointin
    const loginUrl = `${API_URL}/auth/login`;
    console.log('Login endpoint (full URL):', loginUrl);
    
    try {
      const response = await secureFetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      // Tarkistaa onko vastaus null (secureFetch voi palauttaa null jos tapahtuu 401)
      if (!response) {
        console.error('Login failed: No response from server');
        loginError.textContent = 'Kirjautuminen epäonnistui';
        return;
      }
      
      // Jäsennetään vastaus
      const data = await response.json();
      console.log('Login response:', data);
      
      // Tarkistetaan vastauksen tila
      if (!response.ok) {
        loginError.textContent = data.message || 'Kirjautuminen epäonnistui';
        console.error('Login failed:', data.message);
        return;
      }
      
      // Tallentaa käyttäjän datan local storageen
      localStorage.setItem('user', JSON.stringify(data));
      console.log('User data stored in localStorage:', data);
      
      // Sulkee login modalin
      modal.style.display = 'none';
      
      // Näyttää viestin onnistuneesta kirjautumisesta
      updateAuthUI(true);
      showMessage('Kirjautuminen onnistui!', 'success');
      
      // Tarkistaa onko käyttäjällä esitietoja ja ohjaa käyttäjän oikealle sivulle
      const userId = data.user_id;
      console.log('User ID for checking health metrics:', userId);
      
      if (userId) {
        checkUserInitialInfo(userId);
      } else {
        console.error('User ID not found in login response');
        // Ohjataan käyttäjä esitietolomakkeelle joka tapauksessa
        window.location.href = 'initial_info.html';
      }
      
    } catch (error) {
      console.error('Login error:', error);
      loginError.textContent = 'Palvelinvirhe, yritä myöhemmin uudelleen';
    } finally {
      // Palauttaa alkuperäisen tilan
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
      
      // Tarkistaa onko vastaus null (secureFetch voi palauttaa null jos tapahtuu 401)
      if (!response) {
        console.error('Registration failed: No response from server');
        registerError.textContent = 'Rekisteröinti epäonnistui';
        return;
      }
      
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
        
        // Näyttää viestin myös popup-ilmoituksena
        showMessage('Rekisteröinti onnistui! Kirjaudu sisään jatkaaksesi.', 'success');
        
        // Tyhjentää formit
        registerForm.reset();
        
        // Näyttää kirjautumislomakkeen
        setTimeout(() => {
          showLoginForm();
        }, 1500);
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
  try {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      console.log('No user data in localStorage');
      updateAuthUI(false);
      
      // Jos käyttäjä on suojatulla sivulla, ohjaa etusivulle
      if (window.location.pathname.includes('diary.html') || 
          window.location.pathname.includes('initial_info.html')) {
        window.location.href = 'index.html';
      }
      return;
    }
    
    const user = JSON.parse(userJson);
    console.log('User data from localStorage:', user);
    
    if (!user || !user.token) {
      console.log('Invalid user data in localStorage');
      updateAuthUI(false);
      localStorage.removeItem('user');
      
      if (window.location.pathname.includes('diary.html') || 
          window.location.pathname.includes('initial_info.html')) {
        window.location.href = 'index.html';
      }
      return;
    }
    
    // Tarkistetaan tokenin voimassaolo
    const tokenPayload = parseJwt(user.token);
    const now = Math.floor(Date.now() / 1000);
    
    if (tokenPayload && tokenPayload.exp && tokenPayload.exp < now) {
      console.warn('Token is expired, logging out.');
      localStorage.removeItem('user');
      updateAuthUI(false);
      showMessage('Istunto vanhentunut. Kirjaudutaan ulos...', 'error');
      
      if (window.location.pathname.includes('diary.html') || 
          window.location.pathname.includes('initial_info.html')) {
        window.location.href = 'index.html';
      }
      return;
    }
    
    console.log('User is logged in:', user.username);
    updateAuthUI(true);
    
    // Jos käyttäjä on initial_info.html sivulla, ei tarvitse tarkistaa esitietoja
    if (window.location.pathname.includes('initial_info.html')) {
      return;
    }
    
    // Tarkista käyttäjän esitiedot ja ohjaa käyttäjä oikealle sivulle
    const userId = user.user_id;
    
    if (userId) {
      console.log('Found user ID:', userId);
      checkUserInitialInfo(userId);
    } else {
      console.error('User ID not found in stored user data. User data:', user);
      // Jos userId:tä ei ole, ohjaamme käyttäjän initial_info.html-sivulle
      window.location.href = 'initial_info.html';
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    // Virhetilanteessa poistetaan user tieto local storagesta
    localStorage.removeItem('user');
    updateAuthUI(false);
    
    if (window.location.pathname.includes('diary.html') || 
        window.location.pathname.includes('initial_info.html')) {
      window.location.href = 'index.html';
    }
  }
}

// Tarkistaa käyttäjän esitiedot
function checkUserInitialInfo(userId) {
  console.log('Checking if user has initial info filled, userId:', userId);
  
  // Jos olemme jo initial_info.html -sivulla, älä tee mitään
  if (window.location.pathname.includes('initial_info.html')) {
    console.log('Already on initial_info page');
    return;
  }
  
  // Tarkistetaan onko local storagessa tieto, että terveystiedot on jo tallennettu
  const healthMetricsCompleted = localStorage.getItem('healthMetricsCompleted');
  
  // Jos terveystietoja ei ole vielä merkitty tallennetuiksi
  if (!healthMetricsCompleted) {
    console.log('Health metrics not marked as completed, checking with API');
    
    // Kokeillaan hakea terveystiedot
    secureFetch(`${API_URL}/metrics/${userId}`)
      .then(response => {
        if (!response) {
          console.error('No response when checking health metrics');
          return null;
        }
        
        if (response.ok) {
          console.log('Health metrics found, marking as completed');
          localStorage.setItem('healthMetricsCompleted', 'true');
          return response.json();
        } else {
          console.log('Health metrics not found, status:', response.status);
          // Ohjataan initial_info.html-sivulle vain jos käyttäjä ei ole etusivulla tai asetuksissa
          if (!window.location.pathname.includes('index.html') && 
              !window.location.pathname.includes('settings.html')) {
            console.log('Redirecting to initial_info.html');
            window.location.href = 'initial_info.html';
          }
          return null;
        }
      })
      .then(data => {
        if (data) {
          console.log('Health metrics data:', data);
        }
      })
      .catch(error => {
        console.error('Error checking health metrics:', error);
        // Virhetilanteessa ei automaattisesti ohjata käyttäjää muualle
      });
  } else {
    console.log('Health metrics already marked as completed, skipping check');
  }}
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
          userGreeting.textContent = `Hei, ${user.username}!`;
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

// Tarkistaa onko token vanhentunut / 401 ja ohjaa ulos
async function secureFetch(url, options = {}) {
  const token = getAuthToken();
  
  // Jos token on olemassa ja options.headers on olemassa, lisää token
  if (token) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
  }

  try {
    const response = await fetch(url, options);

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

// Purkaa JWT tokenin ja palauttaa sen sisältämän datan
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
}

// Hakee autentikaatio tokenin local storagesta
function getAuthToken() {
  try {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      return null;
    }
    const user = JSON.parse(userJson);
    return user && user.token ? user.token : null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

// Tarkistaa onko käyttäjä kirjautunut
function isAuthenticated() {
  return getAuthToken() !== null;
}

// Näyttää viestin käyttäjälle (yleinen funktio)
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

document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("login-modal");
  const heroContainer = document.querySelector(".hero-container");
  const loginButton = document.getElementById("login-button");
  const closeModal = document.getElementById("close-modal");

  // Tarkista että elementit ovat olemassa ennen tapahtumankäsittelijöiden lisäämistä
  if (loginButton && modal && heroContainer) {
    loginButton.addEventListener("click", function () {
      modal.style.display = "block";
      heroContainer.style.display = "none";
    });
  }

  if (closeModal && modal && heroContainer) {
    closeModal.addEventListener("click", function () {
      modal.style.display = "none";
      heroContainer.style.display = "block";
    });
  }

  if (modal && heroContainer) {
    window.addEventListener("click", function (event) {
      if (event.target === modal) {
        modal.style.display = "none";
        heroContainer.style.display = "block";
      }
    });
  }
});