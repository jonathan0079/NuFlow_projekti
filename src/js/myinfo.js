// myinfo.js - Käsittelee käyttäjän tietojen näyttämisen myinfo.html-sivulla
import './auth.js';
const API_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', function() {
  console.log('myinfo.js loaded');
  
  // Tarkistetaan, onko käyttäjä kirjautunut sisään
  const userJson = localStorage.getItem('user');
  if (!userJson) {
    console.log('User not logged in, redirecting to index.html');
    window.location.href = 'index.html';
    return;
  }
  
  // Haetaan käyttäjän tiedot
  const user = JSON.parse(userJson);
  console.log('User data from localStorage:', user);
  
  // Tarkistetaan onko user_id saatavilla
  // Huom: Tämä voi olla eri nimellä riippuen siitä, miten se on tallennettu kirjautumisen aikana
  const userId = user.user_id || user.id || user.userId;
  
  if (!userId) {
    console.error('User ID not found in user data');
    showMessage('Käyttäjätunnusta ei löydy, kirjaudu uudelleen sisään', 'error');
    return;
  }
  
  console.log('User ID:', userId);
  
  // Haetaan käyttäjän terveysmetriikat
  fetchHealthMetrics(userId);
  
  // Tallennuspainikkeen käsittely
  const submitButton = document.getElementById('submit-button');
  if (submitButton) {
    submitButton.addEventListener('click', handleSubmit);
  }
});

// Hakee käyttäjän terveysmetriikat API:sta
async function fetchHealthMetrics(userId) {
  try {
    console.log('Fetching health metrics for user ID:', userId);
    
    const authToken = getAuthToken();
    if (!authToken) {
      console.error('Auth token not found');
      return;
    }
    
    // Kokeillaan ensin /metrics/:id endpoint
    let response = await fetch(`${API_URL}/metrics/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    // Jos 404, kokeillaan /metrics/user/:id endpoint
    if (response.status === 404) {
      console.log('First endpoint returned 404, trying alternate endpoint');
      response = await fetch(`${API_URL}/metrics/user/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
    }
    
    if (!response.ok) {
      console.error('Failed to fetch health metrics:', response.status);
      return;
    }
    
    const data = await response.json();
    console.log('Health metrics data:', data);
    
    // Näytetään terveysmetriikat lomakkeessa
    if (data && data.length > 0) {
      const metrics = data[0];
      
      // Täytetään vain lomakkeen 4 viimeistä kenttää
      document.getElementById('drug_use').value = metrics.drug_use || '';
      document.getElementById('drug_use').placeholder = 'Kerro käyttämistäsi päihteistä...';
      
      document.getElementById('diseases_medications').value = metrics.diseases_medications || '';
      document.getElementById('diseases_medications').placeholder = 'Kerro sairauksistasi ja lääkityksistäsi...';
      
      document.getElementById('sleep').value = metrics.sleep || '';
      document.getElementById('sleep').placeholder = 'Kerro unen laadusta...';
      
      document.getElementById('self_assessment').value = metrics.self_assessment || '';
      document.getElementById('self_assessment').placeholder = 'Kerro tämänhetkisestä voinnistasi...';
    }
  } catch (error) {
    console.error('Error fetching health metrics:', error);
  }
}

// Käsittelee lomakkeen lähetyksen
async function handleSubmit(event) {
  event.preventDefault();
  
  try {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      showMessage('Et ole kirjautunut sisään', 'error');
      return;
    }
    
    const user = JSON.parse(userJson);
    const userId = user.user_id || user.id || user.userId;
    
    if (!userId) {
      showMessage('Käyttäjätunnusta ei löydy', 'error');
      return;
    }
    
    // Kerätään lomakkeen tiedot
    const metricData = {
      user_id: userId,
      drug_use: document.getElementById('drug_use').value,
      diseases_medications: document.getElementById('diseases_medications').value,
      sleep: document.getElementById('sleep').value,
      self_assessment: document.getElementById('self_assessment').value
    };
    
    console.log('Submitting metric data:', metricData);
    
    const authToken = getAuthToken();
    if (!authToken) {
      console.error('Auth token not found');
      showMessage('Kirjautumistietoja ei löydy', 'error');
      return;
    }
    
    // Haetaan ensin käyttäjän nykyiset terveysmetriikat
    // Kokeillaan molempia mahdollisia API-polkuja
    let getResponse;
    try {
      getResponse = await fetch(`${API_URL}/metrics/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (getResponse.status === 404) {
        getResponse = await fetch(`${API_URL}/metrics/user/${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
    
    let createResponse;
    
    if (getResponse && getResponse.ok) {
      const data = await getResponse.json();
      
      if (data && data.length > 0) {
        const metrics = data[0];
        const metricId = metrics.metric_id;
        
        // Päivitetään olemassa olevat tiedot
        const updateResponse = await fetch(`${API_URL}/metrics/${metricId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(metricData)
        });
        
        if (updateResponse.ok) {
          showMessage('Tiedot päivitetty onnistuneesti!', 'success');
        } else {
          showMessage('Tietojen päivitys epäonnistui', 'error');
        }
      } else {
        // Jos tietoja ei löydy, luodaan uudet
        createResponse = await fetch(`${API_URL}/metrics/insert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(metricData)
        });
        
        if (createResponse.ok) {
          showMessage('Tiedot tallennettu onnistuneesti!', 'success');
        } else {
          showMessage('Tietojen tallennus epäonnistui', 'error');
        }
      }
    } else {
      // Jos aikaisempaa pyyntöä ei onnistunut tai tietoja ei löytynyt, yritetään luoda uudet tiedot
      createResponse = await fetch(`${API_URL}/metrics/insert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(metricData)
      });
      
      if (createResponse.ok) {
        showMessage('Tiedot tallennettu onnistuneesti!', 'success');
      } else {
        showMessage('Tietojen tallennus epäonnistui', 'error');
      }
    }
    
    // Päivitetään näkymä
    fetchHealthMetrics(userId);
  } catch (error) {
    console.error('Error submitting form:', error);
    showMessage('Virhe lomakkeen lähetyksessä', 'error');
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
    return user.token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

// Näyttää viestin käyttäjälle
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

  messageElement.style.display = 'block';

  setTimeout(() => {
    messageElement.style.display = 'none';
  }, 3000);
}