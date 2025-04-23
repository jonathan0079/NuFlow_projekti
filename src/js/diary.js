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

    // Tarkistetaan että aika on valittu
    if (!getRadioValue('time')) {
      alert("Valitse kirjauksen ajankohta (Aamu/Ilta)");
      toggleSubmitButton(submitButton, false);
      return;
    }

    //  Kerätään kaikki tiedot lomakkeesta objektiin
    const entryData = {
      entry_date: new Date().toISOString().split('T')[0], // Päivämäärä (esim. "2025-04-08")
      time_of_day: getRadioValue('time'), // Aamu / Ilta valinta
      sleep_duration: parseInt(document.getElementById('sleepRange').value, 10), // Uni-laatu (slider)
      current_mood: parseInt(document.getElementById('moodRange').value, 10), // Mieliala (slider)
      sleep_notes: getTextareaValue(0), // Ensimmäinen tekstialue (uni)
      activity: getTextareaValue(1), // Toinen tekstialue (muistiinpanot)
    };

    console.log("Lähetetään lomake:", entryData); // Tarkistus konsoliin

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
        console.error("Palvelimen vastaus:", result);
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

function updateThumbColor(slider) {
  const value = parseInt(slider.value, 10);
  let color = "#477668";

  // Päivitä väri sliderin mukaan
  if (slider.id === "sleepRange" || slider.id === "moodRange") {
    if (value === 1) {
      color = "red";
    } else if (value === 2) {
      color = "orange";
    } else if (value === 3) {
      color = "yellow";
    } else if (value === 4) {
      color = "lightgreen";
    } else if (value === 5) {
      color = "green";
    }
  }

  // Asetetaan väri dynaamisesti sliderin juureen
  slider.style.setProperty('--thumb-color', color);
}

// Hae kaikki sliderit ja lisää tapahtumankuuntelijat
const sliders = document.querySelectorAll(".slider");

sliders.forEach(slider => {
  slider.addEventListener("input", () => updateThumbColor(slider));
  updateThumbColor(slider); // Aseta väri heti myös alussa
});
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
  if (!token) {
    alert("Et ole kirjautunut sisään.");
    window.location.href = "/index.html";
    return;
  }

  // Käynnistetään päiväkirjan päätoiminnallisuus
  initDiary(token);
});

// Päätoiminnallisuus: lomakkeen käsittely ja HRV-datan nouto
function initDiary(token) {
  const diaryForm = document.getElementById('diaryForm'); // Lomake-elementti
  const submitButton = document.querySelector('#submit-button'); // Tallennusnappi
  const API_URL = 'http://localhost:5000/api/entries/insert'; // Backend-osoite merkintöjen lisäykseen

  fetchAndDisplayHrvData(token); // Ladataan HRV-arvot automaattisesti heti sivun alussa

  // Kun lomake lähetetään
  diaryForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Estetään oletustoiminto (sivun uudelleenlataus)

    // Näyttää vihreän onnistumisefektin napissa
function showSuccessFeedback(button) {
  button.classList.add('success');
  setTimeout(() => button.classList.remove('success'), 2000); // Palauttaa normaaliksi 2s jälkeen
}

    toggleSubmitButton(submitButton, true); // Näytetään, että tallennus on käynnissä

    // Tarkistetaan että aika on valittu
    if (!getRadioValue('time')) {
      alert("Valitse kirjauksen ajankohta (Aamu/Ilta)");
      toggleSubmitButton(submitButton, false);
      return;
    }

    //  Kerätään kaikki tiedot lomakkeesta objektiin
    const entryData = {
      entry_date: new Date().toISOString().split('T')[0], // Päivämäärä (esim. "2025-04-08")
      time_of_day: getRadioValue('time'), // Aamu / Ilta valinta
      sleep_duration: parseInt(document.getElementById('sleepRange').value, 10), // Uni-laatu (slider)
      current_mood: parseInt(document.getElementById('moodRange').value, 10), // Mieliala (slider)
      sleep_notes: getTextareaValue(0), // Ensimmäinen tekstialue (uni)
      activity: getTextareaValue(1), // Toinen tekstialue (muistiinpanot)
    };

    console.log("Lähetetään lomake:", entryData); // Tarkistus konsoliin

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
        console.error("Palvelimen vastaus:", result);
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

  // Kuuntelee kalenterista tulevaa päivämäärätapahtumaa
  window.addEventListener('selectedDateChanged', async (event) => {
    const { date, entries } = event.detail;
    
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user.user_id || user.id || user.userId;
    const token = user.token;
    
    if (entries && entries.length > 0) {
      // Täytä päiväkirjalomake valitun päivän tiedoilla
      populateDiaryForm(entries[entries.length - 1]);
      
      // Hae HRV-data valitulle päivämäärälle
      try {
        await fetchHrvDataForSelectedDate(token, date);
      } catch (error) {
        console.error('HRV-datan haku epäonnistui:', error);
      }
    } else {
      // Tyhjennä lomake ja HRV-arvot jos ei kirjauksia
      resetDiaryForm();
      
      // Yritä hakea HRV-data silti, koska käyttäjällä voi olla kirjaus päivältä
      try {
        await fetchHrvDataForSelectedDate(token, date);
      } catch (error) {
        console.error('HRV-datan haku epäonnistui tyhjälle päivälle:', error);
      }
    }
  });

// Täyttää päiväkirjalomakkeen annetuilla tiedoilla
function populateDiaryForm(entry) {
  // Aseta ajankohta (aamu/ilta)
  const timeRadios = document.querySelectorAll('input[name="time"]');
  timeRadios.forEach(radio => {
    radio.checked = radio.value === (entry.time_of_day === 'morning' ? 'morning' : 'evening');
  });

  // Aseta uni-arvio
  const sleepSlider = document.getElementById('sleepRange');
  if (sleepSlider) {
    sleepSlider.value = entry.sleep_duration || 3;
    updateThumbColor(sleepSlider);
  }

  // Aseta mieliala
  const moodSlider = document.getElementById('moodRange');
  if (moodSlider) {
    moodSlider.value = entry.current_mood || 3;
    updateThumbColor(moodSlider);
  }

  // Aseta tekstialueet
  const textareas = document.querySelectorAll('textarea');
  if (textareas.length >= 1) {
    textareas[0].value = entry.sleep_notes || '';
    if (textareas.length > 1) {
      textareas[1].value = entry.activity || '';
    }
  }
}

//  HRV-arvojen nouto backendiltä ja näyttö sivulla
async function fetchAndDisplayHrvData(token) {
    const staticDate = new Date().toISOString().split('T')[0]; // Tämän hetkinen päivämäärä
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

// Hakee HRV-datan valitulle päivämäärälle
async function fetchHrvDataForSelectedDate(token, date) {
  console.log("📡 Haetaan HRV päivälle:", date);
  
  try {
    const response = await fetch(`http://localhost:5000/api/kubios/hrv/by-date/${date}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Jos käyttäjä ei ole enää kirjautunut
    if (response.status === 401) {
      alert("Istunto vanhentunut. Kirjaudu uudelleen.");
      window.location.href = "/index.html";
      return;
    }

    if (!response.ok) {
      console.warn('[HRV HAKU] status:', response.status);
      resetHrvDisplay();
      return;
    }

    const data = await response.json();
    console.log(data);

    // Haetaan 'results' taulukosta ensimmäinen objekti
    const hrv = data.results[0];

    // Asetetaan arvot HTML:ään
    setText('hrv-syke', hrv.heart_rate);
    setText('hrv-rmssd', hrv.rmssd);
    setText('hrv-meanrr', hrv.mean_rr);
    setText('hrv-sdnn', hrv.sdnn);
    setText('hrv-pns', hrv.pns_index);
    setText('hrv-sns', hrv.sns_index);

  } catch (err) {
    console.error('[HRV VIRHE]', err.message);
    resetHrvDisplay();
  }
}

// Täyttää päiväkirjalomakkeen annetuilla tiedoilla
function populateDiaryForm(entry) {
  // Aseta ajankohta (aamu/ilta)
  const timeRadios = document.querySelectorAll('input[name="time"]');
  timeRadios.forEach(radio => {
    radio.checked = radio.value === (entry.time_of_day === 'morning' ? 'morning' : 'evening');
  });

  // Aseta uni-arvio
  const sleepSlider = document.getElementById('sleepRange');
  if (sleepSlider) {
    sleepSlider.value = entry.sleep_duration || 3;
    updateThumbColor(sleepSlider);
  }

  // Aseta mieliala
  const moodSlider = document.getElementById('moodRange');
  if (moodSlider) {
    moodSlider.value = entry.current_mood || 3;
    updateThumbColor(moodSlider);
  }

  // Aseta tekstialueet
  const textareas = document.querySelectorAll('textarea');
  if (textareas.length >= 1) {
    textareas[0].value = entry.sleep_notes || '';
    if (textareas.length > 1) {
      textareas[1].value = entry.activity || '';
    }
  }
}

// Tyhjentää päiväkirjalomakkeen
function resetDiaryForm() {
  // Nollaa radiot
  const timeRadios = document.querySelectorAll('input[name="time"]');
  timeRadios.forEach(radio => radio.checked = false);

  // Nollaa sliderit
  const sleepSlider = document.getElementById('sleepRange');
  const moodSlider = document.getElementById('moodRange');
  
  if (sleepSlider) {
    sleepSlider.value = 3;
    updateThumbColor(sleepSlider);
  }
  
  if (moodSlider) {
    moodSlider.value = 3;
    updateThumbColor(moodSlider);
  }

  // Tyhjennä tekstialueet
  const textareas = document.querySelectorAll('textarea');
  textareas.forEach(textarea => textarea.value = '');

  // Nollaa HRV-arvot
  resetHrvDisplay();
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

// Päivittää sliderin värin
function updateThumbColor(slider) {
  const value = parseInt(slider.value, 10);
  let color = "#477668";

  // Päivitä väri sliderin mukaan
  if (slider.id === "sleepRange" || slider.id === "moodRange") {
    if (value === 1) {
      color = "red";
    } else if (value === 2) {
      color = "orange";
    } else if (value === 3) {
      color = "yellow";
    } else if (value === 4) {
      color = "lightgreen";
    } else if (value === 5) {
      color = "green";
    }
  }

  // Asetetaan väri dynaamisesti sliderin juureen
  slider.style.setProperty('--thumb-color', color);
}

// Hae kaikki sliderit ja lisää tapahtumankuuntelijat
const sliders = document.querySelectorAll(".slider");

sliders.forEach(slider => {
  slider.addEventListener("input", () => updateThumbColor(slider));
  updateThumbColor(slider); // Aseta väri heti myös alussa
});
function autoLoadTodayData() {
  const today = new Date().toISOString().split('T')[0];
  
  // Käyttäjän kirjaukset on jo haettu fetchUserEntries-funktiossa
  const userEntries = window.userEntries || [];
  const todayEntries = userEntries.filter(entry => entry.entry_date === today);
  
  // Lähetetään tapahtuma
  const todayDateEvent = new CustomEvent('selectedDateChanged', {
      detail: {
          date: today,
          entries: todayEntries
      }
  });
  window.dispatchEvent(todayDateEvent);
}

// Muokkaa initDiary-funktiota
function initDiary(token) {
  // ... (aiempi koodi säilyy ennallaan)

  // Lisää tämä rivin loppuun
  autoLoadTodayData();
}

// Muokkaa fetchAndDisplayHrvData-funktiota
async function fetchAndDisplayHrvData(token) {
  const staticDate = new Date().toISOString().split('T')[0]; // Tämän hetkinen päivämäärä
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
      resetHrvDisplay(); // Nollaa HRV-arvot, jos haku epäonnistuu
      return;
    }

    const data = await response.json(); // Luetaan vastaus
    console.log(data); // Tarkista konsolista, että data on oikein

    // Haetaan 'results' taulukosta ensimmäinen objekti
    if (data.results && data.results.length > 0) {
      const hrv = data.results[0];  // Oletetaan, että aina tulee vain yksi tulos kyseiseltä päivältä

      // Asetetaan arvot HTML:ään
      setText('hrv-syke', hrv.heart_rate);
      setText('hrv-rmssd', hrv.rmssd);
      setText('hrv-meanrr', hrv.mean_rr);
      setText('hrv-sdnn', hrv.sdnn);
      setText('hrv-pns', hrv.pns_index);
      setText('hrv-sns', hrv.sns_index);
    } else {
      resetHrvDisplay(); // Nollaa arvot, jos dataa ei löydy
    }

  } catch (err) {
    console.error('[HRV VIRHE]', err.message); // Virhe yhteydessä
    resetHrvDisplay(); // Nollaa arvot virhetilanteessa
  }
}
}