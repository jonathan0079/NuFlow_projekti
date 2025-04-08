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
      
      console.log('Sending health data:', healthData);
      
      // 5. Lähetetään data backendiin - KORJATTU REITTI
      const API_URL = 'http://localhost:3000/api';
      
      // OIKEA REITTI terveystietojen tallentamiseen
      const response = await fetch(`${API_URL}/metrics/insert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(healthData)
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Palvelinvirhe: ${response.status}`);
      }
      
      alert('Tiedot tallennettu onnistuneesti!');
      window.location.href = 'diary.html';
      
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