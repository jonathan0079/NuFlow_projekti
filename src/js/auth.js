const API_URL = 'http://localhost:3000/api';

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
  const logoutButton = document.getElementById('logout-button');
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
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      console.log('Login response:', data);
      
      if (!response.ok) {
        loginError.textContent = data.message || 'Kirjautuminen epäonnistui';
        console.error('Login failed:', data.message);
        return;
      }
      
// Tallentaa käyttäjän datan local storageen

      // Tämä korjattiin
      localStorage.setItem('user', JSON.stringify(data));
      console.log('User data stored in localStorage:', data);
      
// Sulkee login modalin
      modal.style.display = 'none';
      
// Näyttää viestin onnistuneesta kirjautumisesta
      updateAuthUI(true);
      
// Lataa päiväkirja sivu, jos käyttäjä on siellä
      window.location.reload();
      
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
      
      const response = await fetch(`${API_URL}/users`, {
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

    // Mitä jos on undefined tai tyhjä? Kaataa scriptin tähän
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (user && user.token) {
      console.log('User is logged in:', user.user.given_name);
// Käyttäjä on kirjautunut
      updateAuthUI(true);
      
// Jos käyttäjä on päiväkirja sivulla, lataa päiväkirja
// Harkitse poistoa, nyt ei tee mitään
      if (window.location.pathname.includes('diary.html')) {
        console.log('On diary page, loading entries');
        if (typeof loadDiaryEntries === 'function') {
          loadDiaryEntries();
        } else {
          console.warn('loadDiaryEntries function not found');
        }
      }
    } else {
      console.log('User is not logged in');
// Käyttäjä ei ole kirjautunut
      updateAuthUI(false);
      
// Jos käyttäjä on päiväkirja sivulla, ohjaa hänet etusivulle
      if (window.location.pathname.includes('diary.html')) {
        console.log('Redirecting from diary page to home page');
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

// Hakee autentikaatio tokenin local storagesta

function getAuthToken() {
  const user = JSON.parse(localStorage.getItem('user'));
  return user ? user.token : null;
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