document.addEventListener('DOMContentLoaded', function() {
    console.log('MyInfo page script loaded');
    
    // Haetaan käyttäjätiedot local storagesta
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      console.error('User data not found in local storage');
      alert('Kirjaudu sisään nähdäksesi tietosi');
      window.location.href = 'index.html';
      return;
    }
    
    const user = JSON.parse(userJson);
    // Huomioi eri kirjautumistapojen epäjohdonmukaisuudet
    const userId = user.user_id || user.id;
    const token = user.token;
    
    if (!userId || !token) {
      console.error('User ID or token missing');
      alert('Kirjautumistiedot puutteelliset. Kirjaudu sisään uudelleen.');
      window.location.href = 'index.html';
      return;
    }
    
    console.log('User ID:', userId);
    
    // Haetaan käyttäjätiedot
    fetchUserData(userId, token);
    
    // Haetaan terveystiedot
    fetchHealthMetrics(userId, token);
    
    // Lisätään tallennuspainikkeen tapahtumankäsittelijä
    const submitButton = document.getElementById('submit-button');
    if (submitButton) {
      submitButton.addEventListener('click', handleSubmit);
    }
    
    // Funktio käyttäjätietojen hakemiseen
    async function fetchUserData(userId, token) {
      try {
        const API_URL = 'http://localhost:3000/api';
        const response = await fetch(`${API_URL}/users/${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Käyttäjätietojen haku epäonnistui: ${response.status}`);
        }
        
        const userData = await response.json();
        console.log('User data:', userData);
        
        // Täytetään käyttäjätietokentät
        fillUserData(userData);
        
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
    
    // Funktio terveystietojen hakemiseen
    async function fetchHealthMetrics(userId, token) {
      try {
        const API_URL = 'http://localhost:3000/api';
        
        // Käytä oikeaa endpointia
        const response = await fetch(`${API_URL}/metrics/user/${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Health metrics response status:', response.status);
        
        if (!response.ok) {
          if (response.status === 404) {
            console.log('No health metrics found for this user');
            return;
          }
          throw new Error(`Terveystietojen haku epäonnistui: ${response.status}`);
        }
        
        // Käsitellään vastaus
        const healthData = await response.json();
        console.log('Health metrics data:', healthData);
        
        // Täytetään terveystietokentät
        if (healthData && healthData.length > 0) {
          fillHealthMetrics(healthData[0]); // Käytetään ensimmäistä tietuetta
        }
        
      } catch (error) {
        console.error('Error fetching health metrics:', error);
      }
    }
    // Funktio terveystietojen täyttämiseen lomakkeelle
    function fillHealthMetrics(healthData) {
      // Täytetään terveystietokentät jos ne ovat olemassa
      if (document.getElementById('drug_use')) {
        document.getElementById('drug_use').value = healthData.drug_use || '';
      }
      
      if (document.getElementById('diseases_medications')) {
        document.getElementById('diseases_medications').value = healthData.diseases_medications || '';
      }
      
      if (document.getElementById('sleep')) {
        document.getElementById('sleep').value = healthData.sleep || '';
      }
      
      if (document.getElementById('self_assessment')) {
        document.getElementById('self_assessment').value = healthData.self_assessment || '';
      }
    }
    
    // Funktio lomakkeen tallentamiseen
    async function handleSubmit(e) {
      e.preventDefault();
      
      try {
        const userData = {
          first_name: document.getElementById('first_name').value,
          last_name: document.getElementById('last_name').value,
          birthday: document.getElementById('birthday').value,
          height: document.getElementById('height').value,
          weight: document.getElementById('weight').value,
          gender: document.getElementById('gender').value
        };
        
        const healthData = {
          user_id: userId,
          drug_use: document.getElementById('drug_use').value,
          diseases_medications: document.getElementById('diseases_medications').value,
          sleep: document.getElementById('sleep').value,
          self_assessment: document.getElementById('self_assessment').value
        };
        
        console.log('Saving user data:', userData);
        console.log('Saving health data:', healthData);
        
        // Näytetään latausanimaatio
        const submitButton = document.getElementById('submit-button');
        submitButton.textContent = 'Tallennetaan...';
        submitButton.disabled = true;
        
        const API_URL = 'http://localhost:3000/api';
        
        // Tallennetaan käyttäjätiedot
        try {
          const userResponse = await fetch(`${API_URL}/users/userinfo/${userId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
          });
          
          if (!userResponse.ok) {
            console.error('Error saving user data:', userResponse.status);
          } else {
            console.log('User data saved successfully');
          }
        } catch (userError) {
          console.error('Error saving user data:', userError);
        }
        
        // Tallennetaan terveystiedot - haetaan ensin olemassa olevat tiedot metric_id:n selvittämiseksi
        try {
          const metricsResponse = await fetch(`${API_URL}/metrics/user/${userId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (metricsResponse.ok) {
            const existingMetrics = await metricsResponse.json();
            
            let saveMethod = 'POST';
            let saveUrl = `${API_URL}/metrics/insert`;
            
            // Jos metriikoita on jo olemassa, käytetään PUT-metodia ja lisätään metric_id
            if (existingMetrics && existingMetrics.length > 0) {
              const metricId = existingMetrics[0].metric_id;
              saveMethod = 'PUT';
              saveUrl = `${API_URL}/metrics/${metricId}`;
            }
            
            // Tallennetaan terveystiedot
            const healthResponse = await fetch(saveUrl, {
              method: saveMethod,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(healthData)
            });
            
            if (!healthResponse.ok) {
              console.error('Error saving health data:', healthResponse.status);
              throw new Error(`Terveystietojen tallennus epäonnistui: ${healthResponse.status}`);
            } else {
              console.log('Health data saved successfully');
            }
          } else {
            // Jos metriikoita ei löydy, käytetään POST-metodia
            const healthResponse = await fetch(`${API_URL}/metrics/insert`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(healthData)
            });
            
            if (!healthResponse.ok) {
              console.error('Error saving health data:', healthResponse.status);
              throw new Error(`Terveystietojen tallennus epäonnistui: ${healthResponse.status}`);
            } else {
              console.log('Health data saved successfully');
            }
          }
          
          // Tallennus onnistui
          alert('Tiedot tallennettu onnistuneesti!');
          
        } catch (healthError) {
          console.error('Error saving health data:', healthError);
          alert(`Virhe terveystietojen tallennuksessa: ${healthError.message}`);
        }
        
        // Palautetaan nappi normaalitilaan
        submitButton.textContent = 'Tallenna';
        submitButton.disabled = false;
        
      } catch (error) {
        console.error('Overall save error:', error);
        alert(`Virhe tietojen tallennuksessa: ${error.message}`);
        
        // Palautetaan nappi normaalitilaan
        const submitButton = document.getElementById('submit-button');
        submitButton.textContent = 'Tallenna';
        submitButton.disabled = false;
      }
    }
  });