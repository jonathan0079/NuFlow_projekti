import './auth.js';
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
      console.log('User data from storage:', user);
      
      // Tarkistetaan eri mahdolliset kenttänimet käyttäjätunnukselle
      // Kubiosin token käyttää 'user_id' kenttää, tavallinen login voi käyttää 'id', tai response.user.id kenttää
      const userId = user.user_id || (user.user && user.user.id) || user.id;
      
      console.log('Using user ID:', userId);
      
      if (!userId) {
        // Jos käyttäjä-ID:tä ei löydy, tarkistetaan onko siellä muita kenttiä, joista se voisi löytyä
        console.error('User ID not found. Full user object:', JSON.stringify(user));
        alert('Käyttäjän tunnistus epäonnistui. Kirjaudu ulos ja sisään uudelleen.');
        return;
      }
      
      const token = user.token;
      if (!token) {
        console.error('Token not found in user data');
        alert('Istunto vanhentunut. Kirjaudu sisään uudelleen.');
        return;
      }
      
      // 2. Haetaan lomakkeen tiedot
      const drugUse = document.querySelector('textarea[name="drug_use"]').value.trim();
      const diseasesMedications = document.querySelector('textarea[name="diseases_medications"]').value.trim();
      const sleep = document.querySelector('textarea[name="sleep"]').value.trim();
      const selfAssessment = document.querySelector('textarea[name="self_assessment"]').value.trim();
      
      if (!drugUse || !diseasesMedications || !sleep || !selfAssessment) {
        alert('Täytä kaikki kentät');
        return;
      }
      
      // 3. Näytetään latausanimaatio
      const submitButton = document.getElementById('submit-button');
      const originalButtonText = submitButton.textContent;
      submitButton.textContent = 'Tallennetaan...';
      submitButton.disabled = true;
      
      // 4. Muodostetaan lähetettävä data
      const healthData = {
        user_id: userId,
        drug_use: drugUse,
        diseases_medications: diseasesMedications,
        sleep: sleep,
        self_assessment: selfAssessment
      };
      
      console.log('Sending health data:', healthData);
      
      // 5. Lähetetään data backendiin
      const API_URL = 'http://localhost:3000/api';
      
      const response = await fetch(`${API_URL}/metrics/insert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(healthData)
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        // 6. Merkitään terveystiedot tallennetuiksi
        localStorage.setItem('healthMetricsCompleted', 'true');
        showMessage('Tiedot tallennettu onnistuneesti!', 'success');
        setTimeout(() => {
          window.location.href = 'diary.html';
        }, 1500);
      } else {
        // Yritetään lukea virheilmoitus
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Palvelinvirhe: ${response.status} - ${errorText || 'Tuntematon virhe'}`);
      }
      
    } catch (error) {
      console.error('Error:', error);
      showMessage(`Virhe: ${error.message}`, 'error');
      
      // Palautetaan nappi normaalitilaan
      const submitButton = document.getElementById('submit-button');
      if (submitButton) {
        submitButton.textContent = 'Jatka';
        submitButton.disabled = false;
      }
    }
  }
  
  // Helper function to show messages to the user
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
});