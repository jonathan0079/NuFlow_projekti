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
  
  // Täytetään lomakkeen tiedot Kubios-profiilista, jos ne ovat saatavilla
  populateFormWithKubiosData(user);
  
  // Merkitse ei-muokattavat kentät harmaaksi
  markNonEditableFields();
  
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

// Merkitsee ei-muokattavat kentät harmaaksi ja disabloiduiksi
function markNonEditableFields() {
  // Lista ei-muokattavista kentistä
  const nonEditableFields = ['birthday', 'email']; // Syntymäaika & sähköposti
  
  nonEditableFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      // Aseta kenttä ei-muokattavaksi
      field.disabled = true;
      
      // Tyylittelyt on nyt siirretty CSS:ään
    }
  });
}

// Täyttää lomakkeen Kubios-profiilin tiedoilla
function populateFormWithKubiosData(userData) {
  // Tarkistetaan onko Kubios-profiilin tiedot saatavilla
  if (userData && userData.user) {
    const kubiosUser = userData.user;
    console.log('Kubios user data:', kubiosUser);
    
    // Täytetään perustiedot, jos ne löytyvät
    const firstNameField = document.getElementById('first_name');
    const lastNameField = document.getElementById('last_name');
    const birthdayField = document.getElementById('birthday');
    const heightField = document.getElementById('height');
    const weightField = document.getElementById('weight');
    const genderField = document.getElementById('gender');
    const emailField = document.getElementById('email'); // Lisätty sähköposti
    
    // Etunimi
    if (kubiosUser.given_name && firstNameField) {
      firstNameField.value = kubiosUser.given_name;
    }
    
    // Sukunimi
    if (kubiosUser.family_name && lastNameField) {
      lastNameField.value = kubiosUser.family_name;
    }
    
    // Syntymäaika - muotoillaan ISO-muodosta suomalaiseen muotoon (YYYY-MM-DD)
    if (kubiosUser.birthdate && birthdayField) {
      // Oletetaan, että syntymäaika on muodossa "YYYY-MM-DD" tai vastaava
      birthdayField.value = kubiosUser.birthdate;
    }
    
    // Sähköposti
    if (kubiosUser.email && emailField) {
      emailField.value = kubiosUser.email;
    }
    
    // Pituus (senttimetreinä)
    if (kubiosUser.height && heightField) {
      // Kubios tallentaa pituuden metreinä, muunnetaan senttimetreiksi
      const heightInCm = Math.round(kubiosUser.height * 100);
      heightField.value = heightInCm;
    }
    
    // Paino (kiloina)
    if (kubiosUser.weight && weightField) {
      weightField.value = kubiosUser.weight;
    }
    
    // Sukupuoli
    if (kubiosUser.gender && genderField) {
      // Muunnetaan englanniksi, jos tarpeen
      let finnishGender = kubiosUser.gender;
      if (kubiosUser.gender === 'male') {
        finnishGender = 'mies';
      } else if (kubiosUser.gender === 'female') {
        finnishGender = 'nainen';
      } else if (kubiosUser.gender === 'other') {
        finnishGender = 'muu';
      }
      genderField.value = finnishGender;
    }
  }
}

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
    
    // Päivitetään Kubios-profiilia
    await updateKubiosProfile();
    
    // Päivitetään näkymä
    fetchHealthMetrics(userId);
  } catch (error) {
    console.error('Error submitting form:', error);
    showMessage('Virhe lomakkeen lähetyksessä', 'error');
  }
}

// Päivittää Kubios-profiilin tiedot jos ne ovat muuttuneet
async function updateKubiosProfile() {
  try {
    const userJson = localStorage.getItem('user');
    if (!userJson) return;
    
    const user = JSON.parse(userJson);
    if (!user.token) return;
    
    // Kerätään lomakkeen tiedot
    const given_name = document.getElementById('first_name').value;
    const family_name = document.getElementById('last_name').value;
    const height = parseFloat(document.getElementById('height').value) / 100; // Muunna cm → m
    const weight = parseFloat(document.getElementById('weight').value);
    
    // Sukupuoli (muunna englanniksi jos tarpeen)
    let gender = document.getElementById('gender').value.toLowerCase();
    if (gender === 'mies') gender = 'male';
    else if (gender === 'nainen') gender = 'female';
    else if (gender === 'muu') gender = 'other';
    
    // Nykyinen käyttäjä Kubioksessa
    const kubiosUser = user.user || {};
    
    // Tarkista, onko tietoja muutettu
    const updateData = {};
    if (given_name && given_name !== kubiosUser.given_name) updateData.given_name = given_name;
    if (family_name && family_name !== kubiosUser.family_name) updateData.family_name = family_name;
    if (height && height !== kubiosUser.height) updateData.height = height;
    if (weight && weight !== kubiosUser.weight) updateData.weight = weight;
    if (gender && gender !== kubiosUser.gender) updateData.gender = gender;
    
    // Vain jos on päivitettävää, lähetetään pyyntö
    if (Object.keys(updateData).length > 0) {
      console.log('Updating Kubios profile:', updateData);
      
      // Käytä uutta userinfo-endpointia
      const response = await fetch(`${API_URL}/kubios/userinfo`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        console.log('Kubios profile updated successfully');
        
        // Päivitä käyttäjän tiedot localStoragessa
        const updatedUser = { ...user };
        if (updatedUser.user) {
          updatedUser.user = { ...updatedUser.user, ...updateData };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        showMessage('Profiili päivitetty onnistuneesti!', 'success');
      } else {
        console.error('Failed to update Kubios profile:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        showMessage('Profiilin päivitys epäonnistui', 'error');
      }
    }
  } catch (error) {
    console.error('Error updating Kubios profile:', error);
    showMessage('Virhe profiilin päivityksessä', 'error');
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