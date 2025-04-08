document.addEventListener('DOMContentLoaded', function() {
    console.log('Health metrics form handler loaded');
    
    const infoForm = document.getElementById('infoForm');
    
    if (infoForm) {
      infoForm.addEventListener('submit', submitHealthData);
    } else {
      console.error('Form not found!');
    }
    
    async function submitHealthData(e) {
      e.preventDefault();
      
      try {
        // 1. Haetaan käyttäjätiedot
        const userData = localStorage.getItem('user');
        if (!userData) {
          alert('Kirjaudu sisään jatkaaksesi');
          return;
        }
        
        const user = JSON.parse(userData);
        const userId = user.user_id;
        const token = user.token;
        
        console.log('Current user ID:', userId);
        
        // 2. Haetaan lomakkeen tiedot
        const drugUse = document.querySelector('textarea[name="drug_use"]').value.trim();
        const diseasesMedications = document.querySelector('textarea[name="diseases_medications"]').value.trim();
        const sleep = document.querySelector('textarea[name="sleep"]').value.trim();
        const selfAssessment = document.querySelector('textarea[name="self_assessment"]').value.trim();
          
        // 4. Muodostetaan lähetettävä data
        const healthData = {
          user_id: userId,
          drug_use: drugUse,
          diseases_medications: diseasesMedications,
          sleep: sleep,
          self_assessment: selfAssessment
        };
        
        console.log('Sending health data:', healthData);
        
        // 5. Tulostetaan auth.js:n käyttämät GET-pyynnöt konsoliin
        console.log('AUTH.JS uses GET endpoint:', `http://localhost:3000/api/users/${userId}/health_metrics`);
        
        // 6. Kokeillaan sekä users että user endpointteja
        const API_URL = 'http://localhost:3000/api';
        let response = null;
        
        // Tarkistetaan onko backend päällä tekemällä ping
        try {
          const pingResponse = await fetch(`${API_URL}/auth/ping`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          console.log('Backend ping response:', pingResponse.status);
        } catch (pingError) {
          console.error('Backend might be down:', pingError);
        }
        
        // Tee pyyntö GET metodilla nähdäksesi, löytyykö jo terveystietoja
        try {
          const getResponse = await fetch(`${API_URL}/users/${userId}/health_metrics`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          console.log('GET health metrics response:', getResponse.status);
          
          if (getResponse.ok) {
            // Yritetään lukea vastaus
            const responseData = await getResponse.json();
            console.log('Existing health metrics data:', responseData);
          }
        } catch (getError) {
          console.error('Error checking existing health metrics:', getError);
        }
        
        // Kokeillaan erilaisia metodeja
        try {
          console.log('Trying PUT method...');
          response = await fetch(`${API_URL}/users/${userId}/health_metrics`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(healthData)
          });
          
          console.log('PUT response status:', response.status);
          
          if (response.ok) {
            console.log('PUT method succeeded!');
            alert('Tiedot tallennettu onnistuneesti!');
            window.location.href = 'diary.html';
            return;
          }
        } catch (putError) {
          console.error('PUT method error:', putError);
        }
        
        try {
          console.log('Trying POST method to /health_metrics...');
          response = await fetch(`${API_URL}/health_metrics`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(healthData)
          });
          
          console.log('POST response status:', response.status);
          
          if (response.ok) {
            console.log('POST method succeeded!');
            alert('Tiedot tallennettu onnistuneesti!');
            window.location.href = 'diary.html';
            return;
          }
        } catch (postError) {
          console.error('POST method error:', postError);
        }
        
        // Jos mikään ei onnistunut, näytetään virheilmoitus
        alert('Terveystietojen tallennus epäonnistui. Backend ei tue mitään kokeiltua endpointia. Tarkista backendin toteutus.');
        
      } catch (error) {
        console.error('Error:', error);
        alert(`Virhe: ${error.message}`);
      } finally {
        // Palautetaan nappi normaalitilaan
        const submitButton = document.getElementById('submit-button');
        if (submitButton) {
          submitButton.textContent = 'Jatka';
          submitButton.disabled = false;
        }
      }
    }
  });