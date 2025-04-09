
import './auth.js';

console.log("diary.js ladattu");

// Hakee autentikaatio tokenin local storagesta

function getAuthToken() {
  const user = JSON.parse(localStorage.getItem('user'));
  return user ? user.token : null;
}

//  Kun sivun HTML on ladattu selaimessa
document.addEventListener('DOMContentLoaded', () => {
  const token = getAuthToken(); // Haetaan käyttäjän token (auth.js tiedostosta)

  console.log("Haettu token:", token);

  // Jos token puuttuu, ohjataan takaisin kirjautumissivulle
  //if (!token) {
  //  console.warn("Token puuttuu – ohjataan kirjautumaan.");
   // window.location.href = "/index.html";
  //  return;
  //}
  if (!token) {
    alert("Et ole kirjautunut sisään."); // ← Tämä näkyy!
    // mutta mitään ei tapahdu, koska ohjaus puuttuu
    return
  }

  // Käynnistetään päiväkirjan päätoiminnallisuus
  initDiary(token);
});


// 750GmuduMdLX Päätoiminnallisuus: lomakkeen käsittely ja HRV-datan nouto
function initDiary(token) {
  const diaryForm = document.getElementById('diaryForm'); // Lomake-elementti
  const submitButton = document.querySelector('#submit-button'); // Tallennusnappi
  const API_URL = 'http://localhost:5000/api/entries/insert'; // Backend-osoite merkintöjen lisäykseen

  fetchAndDisplayHrvData(token); // Ladataan HRV-arvot automaattisesti heti sivun alussa

  //  Kun lomake lähetetään
  diaryForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Estetään oletustoiminto (sivun uudelleenlataus)

    toggleSubmitButton(submitButton, true); // Näytetään, että tallennus on käynnissä

    //  Kerätään kaikki tiedot lomakkeesta objektiin
    const entryData = {
      entry_date: new Date().toISOString().split('T')[0], // Päivämäärä (esim. "2025-04-08")
      time_of_day: getRadioValue('time'), // Aamu / Ilta valinta
      sleep_duration: getRadioValue('sleep'), // Uni-laadun valinta (hymiöt)
      current_mood: getRadioValue('mood'), // Mieliala (hymiöt)
      sleep_notes: getTextareaValue(0), // Ensimmäinen tekstialue (uni)
      activity: getTextareaValue(1), // Toinen tekstialue (muistiinpanot)
    };

    //  Lähetetään tiedot backendille
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Lähetetään käyttäjän token
        },
        body: JSON.stringify(entryData) // Muutetaan JS-objekti JSON-muotoon
      });

      const result = await response.json(); // Luetaan palvelimen vastaus

      // ⚠️ Jos palvelin ei vastannut OK
      if (!response.ok) {
        alert("Tallennus epäonnistui: " + (result.message || "Tuntematon virhe"));
      } else {
        //  Onnistunut tallennus
        alert("Päiväkirjamerkintä tallennettu!");
        diaryForm.reset(); // Tyhjennetään lomake
        resetHrvDisplay(); // Nollataan HRV-näyttö
        fetchAndDisplayHrvData(token); // Ladataan HRV-arvot uudelleen
        showSuccessFeedback(submitButton); // Näytetään vihreä palaute napissa
      }

    } catch (error) {
      alert("Palvelinvirhe. Yritä myöhemmin."); // Virhe esim. yhteydessä
      console.error("[TALLENNUS VIRHE]", error);
    }

    toggleSubmitButton(submitButton, false); // Palautetaan nappi normaaliksi
  });
}


//  HRV-arvojen nouto backendiltä ja näyttö sivulla
async function fetchAndDisplayHrvData(token) {
    const staticDate = "2025-02-14"; // Kovakoodattu päivämäärä
    console.log("📡 Haetaan HRV päivälle:", staticDate);
  
    try {
      const response = await fetch(`http://localhost:5000/api/kubios/hrv/by-date/${staticDate}`, {
        headers: {
          'Authorization': `Bearer ${token}` // Käyttäjän token mukaan
        }
      });
  
      // 🔐 Jos käyttäjä ei ole enää kirjautunut
      if (response.status === 401) {
        alert("Istunto vanhentunut. Kirjaudu uudelleen.");
        window.location.href = "/index.html";
        return;
      }
  
      if (!response.ok) {
        console.warn('[HRV HAKU] status:', response.status); // Muu virhe
        return;
      }
  
      const data = await response.json(); // Luetaan vastaus
      console.log(data); // Tarkista konsolista, että data on oikein
  
      // Haetaan 'results' taulukosta ensimmäinen objekti
      const hrv = data.results[0];  // Oletetaan, että aina tulee vain yksi tulos kyseiseltä päivältä
  
      // Asetetaan arvot HTML:ään
      setText('hrv-syke', hrv.heart_rate);
      setText('hrv-rmssd', hrv.rmssd);
      setText('hrv-meanrr', hrv.mean_rr);
      setText('hrv-sdnn', hrv.sdnn);
      setText('hrv-pns', hrv.pns_index);
      setText('hrv-sns', hrv.sns_index);
  
    } catch (err) {
      console.error('[HRV VIRHE]', err.message); // Virhe yhteydessä
    }
}

  


//  Asettaa tekstin tiettyyn elementtiin id:n perusteella
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? '-';
}

//  Hakee tekstin näkyvästä spanista (esim. HRV-syke)
function getText(id) {
  return document.getElementById(id)?.textContent.trim() || "-";
}

// Palauttaa valitun radion arvon (esim. uni/mieliala)
function getRadioValue(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || "";
}

// Hakee tekstialueen (textarea) sisällön järjestyksessä
function getTextareaValue(index) {
  return document.querySelectorAll('textarea')[index]?.value || "";
}

// Nollaa HRV-näytön arvot takaisin "-"
function resetHrvDisplay() {
  ['hrv-syke', 'hrv-rmssd', 'hrv-meanrr', 'hrv-sdnn', 'hrv-pns', 'hrv-sns'].forEach(id => setText(id, '-'));
}

// Muuttaa tallennusnapin tilaa (lataus päällä tai ei)
function toggleSubmitButton(button, loading) {
  button.disabled = loading;
  button.textContent = loading ? 'Tallennetaan...' : 'Tallenna';
}

// Näyttää vihreän onnistumisefektin napissa
function showSuccessFeedback(button) {
  button.classList.add('success');
  setTimeout(() => button.classList.remove('success'), 2000); // Palauttaa normaaliksi 2s jälkeen
}