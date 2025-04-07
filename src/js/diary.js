// Tuodaan tyylitiedosto (CSS)
import '../css/style.css';

// Tuodaan kirjautumiseen liittyvät toiminnot (esim. tokenin tarkistus)
import './auth.js';

// Kun koko HTML on ladattu selaimessa
document.addEventListener('DOMContentLoaded', () => {

  // Haetaan käyttäjän tiedot localStoragesta
  const rawUserData = localStorage.getItem('user');

  // Jos käyttäjätietoa ei ole tai se on merkkijono "undefined", ohjataan etusivulle
  if (!rawUserData || rawUserData === 'undefined') {
    alert("Et ole kirjautunut. Siirrytään etusivulle.");
    window.location.href = "index.html";
    return;
  }

  let token;
  try {
    // Yritetään muuttaa käyttäjätiedot objektiksi
    const parsedUser = JSON.parse(rawUserData);

    // Haetaan kirjautumistunnus (token)
    token = parsedUser?.token;

    // Jos token puuttuu, ohjataan etusivulle
    if (!token) {
      alert("Kirjautumistunnus puuttuu. Siirrytään etusivulle.");
      window.location.href = "index.html";
      return;
    }

  } catch (err) {
    // Jos JSON-parsinta epäonnistuu, ilmoitetaan virhe ja ohjataan pois
    alert("Kirjautumistiedot ovat virheelliset. Siirrytään etusivulle.");
    localStorage.removeItem("user");
    window.location.href = "index.html";
    return;
  }

  // Jos kaikki ok, käynnistetään päiväkirjan logiikka tokenilla
  initDiary(token);
});

// Päiväkirjalomakkeen käsittely ja lähetys palvelimelle
function initDiary(token) {
  // Haetaan päiväkirjalomake
  const diaryForm = document.getElementById('diaryForm');

  // Haetaan lomakkeen lähetyspainike
  const submitButton = document.querySelector('#submit-button');

  // Määritetään backendin API-osoite merkinnän tallentamiseen
  const API_URL = 'http://localhost:3000/api/entries/insert';

  // Näytetään käyttäjälle viimeisimmät HRV-arvot
  fetchAndDisplayHrvData(token);

  // Kun käyttäjä lähettää lomakkeen
  diaryForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Estetään sivun uudelleenlataus

    submitButton.disabled = true; // Estetään tuplanapautukset
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Tallennetaan...'; // Näytetään tallennustila

    // Poimitaan lomakkeen valinnat
    const timeCheckboxes = document.querySelectorAll('input[name="time"]:checked');
    const time_of_day = timeCheckboxes.length ? timeCheckboxes[0].value : "";

    // HRV-arvot lomakkeelta (näkyvät arvot)
    const heart_rate = document.getElementById('hrv-syke').textContent.trim();
    const rmssd = document.getElementById('hrv-rmssd').textContent.trim();
    const mean_rr = document.getElementById('hrv-meanrr').textContent.trim();
    const sdnn = document.getElementById('hrv-sdnn').textContent.trim();
    const pns_index = document.getElementById('hrv-pns').textContent.trim();
    const sns_index = document.getElementById('hrv-sns').textContent.trim();

    // Uni ja mieliala valinnat
    const sleep_duration = document.querySelector('input[name="sleep"]:checked')?.value || "";
    const current_mood = document.querySelector('input[name="mood"]:checked')?.value || "";

    // Lisätiedot ja aktiivisuus – otetaan ensimmäinen ja toinen textarea
    const sleep_notes = document.querySelectorAll('textarea')[0]?.value || "";
    const activity = document.querySelectorAll('textarea')[1]?.value || "";

    // Päivämäärä (esim. "2025-04-06")
    const entry_date = new Date().toISOString().split('T')[0];

    // Kootaan kaikki tiedot yhteen objektiin
    const entryData = {
      entry_date,
      time_of_day,
      heart_rate,
      rmssd,
      mean_rr,
      sdnn,
      pns_index,
      sns_index,
      sleep_duration,
      sleep_notes,
      current_mood,
      activity
    };

    try {
      // Lähetetään tiedot palvelimelle (POST-pyyntö)
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Vahvistetaan kuka käyttäjä on
        },
        body: JSON.stringify(entryData) // Muutetaan objekti tekstiksi
      });

      const result = await response.json(); // Otetaan vastaus talteen

      if (!response.ok) {
        // Jos vastaus ei ollut onnistunut, näytetään virhe
        alert("Tallennus epäonnistui: " + (result.message || "Tuntematon virhe"));
      } else {
        // Onnistui – näytetään viesti ja tyhjennetään lomake
        alert("Päiväkirjamerkintä tallennettu!");
        diaryForm.reset(); // Tyhjentää valinnat
        fetchAndDisplayHrvData(token); // Haetaan HRV-arvot uudestaan
      }

    } catch (error) {
      // Jos jotain meni pahasti pieleen
      alert("Palvelinvirhe. Yritä myöhemmin uudelleen.");
      console.error("Yhteysvirhe:", error);
    }

    // Palautetaan painike normaalitilaan
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  });
}

// Haetaan HRV-tiedot käyttäjälle palvelimelta
async function fetchAndDisplayHrvData(token) {
  const today = new Date().toISOString().split('T')[0]; // Haetaan tämän päivän päivämäärä

  try {
    // Kysytään tämän päivän HRV-arvot palvelimelta
    const response = await fetch(`http://localhost:3000/api/entries/hrv/${today}`, {
      headers: {
        'Authorization': `Bearer ${token}` // Käytetään tokenia tunnistukseen
      }
    });

    if (!response.ok) {
      console.warn('HRV-tietojen haku epäonnistui:', response.status);
      return;
    }

    const hrv = await response.json(); // Puretaan vastaus JSON-muotoon

    // Näytetään arvot HTML:ssä (tai "-" jos tyhjää)
    document.getElementById('hrv-syke').textContent = hrv.heart_rate || '-';
    document.getElementById('hrv-rmssd').textContent = hrv.rmssd || '-';
    document.getElementById('hrv-meanrr').textContent = hrv.mean_rr || '-';
    document.getElementById('hrv-sdnn').textContent = hrv.sdnn || '-';
    document.getElementById('hrv-pns').textContent = hrv.pns_index || '-';
    document.getElementById('hrv-sns').textContent = hrv.sns_index || '-';

  } catch (err) {
    // Jos virhe yhteydessä
    console.error('Virhe HRV-arvojen haussa:', err);
  }
}

