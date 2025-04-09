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
      
      // Tämä on avainmuutos: käsitellään molemmat mahdolliset kenttänimet
      // Kubiosin token käyttää 'user_id' kenttää, tavallinen login käyttää 'id' kenttää
      const userId = user.user_id || user.id;
      
      console.log('User data from storage:', user);
      console.log('Using user ID:', userId);
      
      if (!userId) {
        alert('Käyttäjän tunnistus epäonnistui. Kirjaudu ulos ja sisään uudelleen.');
        console.error('User ID not found in stored user data:', user);
        return;
      }
      
      const token = user.token;
      
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
      
      console.log('Sending health data with explicit user_id:', healthData);
      
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
        alert('Tiedot tallennettu onnistuneesti!');
        window.location.href = 'diary.html';
      } else {
        // Yritetään lukea virheilmoitus
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Palvelinvirhe: ${response.status} - ${errorText || 'Tuntematon virhe'}`);
      }
      
    } catch (error) {
      console.error('Error:', error);
      alert(`Virhe: ${error.message}`);
      
      // Palautetaan nappi normaalitilaan
      const submitButton = document.getElementById('submit-button');
      if (submitButton) {
        submitButton.textContent = 'Jatka';
        submitButton.disabled = false;
      }
    }
  }
});