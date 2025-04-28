import './auth.js';
import './diary-calendar.js';

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
      const saveContainer = document.getElementById('saveMessageContainer');
      const saveResponse = document.getElementById('saveResponse');
      
      if (!response.ok) {
        saveResponse.textContent = 'Tallennus epäonnistui: ' + (result.message || 'Tuntematon virhe');
        saveContainer.className = 'error show'; // Näytetään punainen laatikko
        console.error("Palvelimen vastaus:", result);
      
        setTimeout(() => {
          saveContainer.className = ''; // Piilotetaan laatikko
          saveResponse.textContent = '';
        }, 3000);
      
      } else {
        saveResponse.textContent = 'Päiväkirjamerkintä tallennettu!';
        saveContainer.className = 'success show'; // Näytetään vihreä laatikko
      
        resetDiaryForm();
        resetHrvDisplay();
        fetchAndDisplayHrvData(token);
        showSuccessFeedback(submitButton);
      
        setTimeout(() => {
          saveContainer.className = ''; // Piilotetaan laatikko
          saveResponse.textContent = '';
        }, 3000);
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
      setText('hrv-syke',hrv.heart_rate.toFixed(2));
      setText('hrv-rmssd', hrv.rmssd.toFixed(2));
      setText('hrv-meanrr', hrv.mean_rr.toFixed(2));
      setText('hrv-sdnn', hrv.sdnn.toFixed(2));
      setText('hrv-pns', hrv.pns_index.toFixed(2));
      setText('hrv-sns', hrv.sns_index.toFixed(2));
  
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
    setText('hrv-syke',hrv.heart_rate.toFixed(2));
    setText('hrv-rmssd', hrv.rmssd.toFixed(2));
    setText('hrv-meanrr', hrv.mean_rr.toFixed(2));
    setText('hrv-sdnn', hrv.sdnn.toFixed(2));
    setText('hrv-pns', hrv.pns_index.toFixed(2));
    setText('hrv-sns', hrv.sns_index.toFixed(2));

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

// Näyttää vihreän onnistumisefektin napissa
function showSuccessFeedback(button) {
  button.classList.add('success');
  setTimeout(() => button.classList.remove('success'), 2000); // Palauttaa normaaliksi 2s jälkeen
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
      color = "coral";
    } else if (value === 3) {
      color = "orange";
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

  // Lisää tämä rivin loppuun
  autoLoadTodayData();
}
//  OLETUS: sinulla on mockdata.json polussa /public/
//  Chart.js on asennettu ja ladattu



 // HRV-kaavio modaali
 const chartModal = document.getElementById('chartModal'); // Modaali-ikkuna, jossa kaaviot näkyvät
 const chartOpen = document.getElementById('openChartBtn'); // Nappi: Näytä HRV-kaaviot
 const chartspan = chartModal.querySelector('.close'); // Sulje-nappi (rasti oikeassa yläkulmassa)
 const btn7 = document.getElementById('btn7days'); // Nappi: Viimeiset 7 päivää
 const btn30 = document.getElementById('btn30days'); // Nappi: Viimeiset 30 päivää
 const pieCanvas = document.getElementById('hrvPieChart'); // Canvas-elementti polar-kaaviolle
 const chartGrid = document.querySelector('.chart-grid'); // Grid, johon viivakaaviot piirretään
 const title = document.querySelector('#chartHeaderTitle'); // Otsikko modalin yläosassa
 
 // Päiväkirja modaali
 const diaryModal = document.getElementById('diaryModal'); // Modaali-ikkuna, jossa kaaviot näkyvät
 const diaryOpen = document.getElementById('openDiaryBtn'); // Nappi: Lisää päiväkirjamerkintä
 const diaryspan = diaryModal.querySelector('.close'); // Sulje-nappi (rasti oikeassa yläkulmassa)
 
 let rawData = []; // Tänne tallennetaan mockdata.json tiedot
 let pieChart = null; // Tänne tallennetaan piirrettävä polar-kaavio
 let fullRawData = []; // Muuta tämä global-muuttujaksi koko tiedoston alussa

 // Avataan HRV-kaavio modal
 chartOpen.onclick = async () => {
  chartModal.style.display = 'block';
  title.textContent = 'HRV-arvot (uusin päivä)';
  pieCanvas.style.display = 'block';
  chartGrid.innerHTML = '';

  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const res = await fetch('http://localhost:5000/api/kubios/hrv/last-30-measurements', {
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch HRV data');
    }
    
    fullRawData = await res.json(); // Tallennetaan koko 30 päivän data
    
    if (fullRawData.length === 0) {
      console.warn('No HRV data available');
      return;
    }
    
    const latest = fullRawData[fullRawData.length - 1];
    drawPieChart(latest); // Piirretään polar-kaavio
  } catch (err) {
    console.error("Data loading error:", err);
    // Näytä käyttäjälle viesti, ettei dataa ole saatavilla
    alert('Ei HRV-dataa saatavilla');
  }
}
 btn7.onclick = async () => {
   chartGrid.innerHTML = '';
   pieCanvas.style.display = 'none';
   title.textContent = 'HRV-arvot (viimeiset 7 päivää)';
   
   try {
     const user = JSON.parse(localStorage.getItem('user'));
     const res = await fetch('http://localhost:5000/api/kubios/hrv/last-30-measurements', {
       headers: {
         'Authorization': `Bearer ${user.token}`
       }
     });
     
     if (!res.ok) {
       throw new Error('Failed to fetch HRV data');
     }
     
     fullRawData = await res.json();
     
     if (fullRawData.length === 0) {
       console.warn('No HRV data available');
       return;
     }
     
     drawLineCharts(7);
   } catch (err) {
     console.error("Data loading error:", err);
     alert('Ei HRV-dataa saatavilla');
   }
 };
 
 btn30.onclick = async () => {
   chartGrid.innerHTML = '';
   pieCanvas.style.display = 'none';
   title.textContent = 'HRV-arvot (viimeiset 30 päivää)';
   
   try {
     const user = JSON.parse(localStorage.getItem('user'));
     const res = await fetch('http://localhost:5000/api/kubios/hrv/last-30-measurements', {
       headers: {
         'Authorization': `Bearer ${user.token}`
       }
     });
     
     if (!res.ok) {
       throw new Error('Failed to fetch HRV data');
     }
     
     fullRawData = await res.json();
     
     if (fullRawData.length === 0) {
       console.warn('No HRV data available');
       return;
     }
     
     drawLineCharts(30);
   } catch (err) {
     console.error("Data loading error:", err);
     alert('Ei HRV-dataa saatavilla');
   }
 };

 //Polar-kaavion piirtäminen yhdelle päivälle
 function drawPieChart(day) {
  if (!pieCanvas) return;

  const values = [
    day.heart_rate,
    day.rmssd,
    day.mean_rr,
    day.sdnn,
    day.pns_index,
    day.sns_index
  ];

  const maxValue = Math.max(...values);// Normalisointia varten
  const normalized = values.map(v => (v / maxValue) * 100);// Skalaus
  const labels = ['Syke', 'RMSSD', 'Mean RR', 'SDNN', 'PNS Index', 'SNS Index'];
  const colors = ['red', 'green', 'blue', 'purple', 'orange', 'brown'];

  if (pieChart) pieChart.destroy();

  pieChart = new Chart(pieCanvas.getContext('2d'), {
    type: 'polarArea',
    data: {
      labels,
      datasets: [{
        data: normalized,
        backgroundColor: colors,
        borderColor: '#fff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'HRV-arvot (uusin päivä)'
        }
      }
    }
  });
}

//Viivakaavioiden piirtäminen useammalle päivälle
function drawLineCharts(days) {
  if (!chartGrid) return;

  const sliced = fullRawData.slice(-days);
  const labels = sliced.map(r => new Date(r.daily_result).toLocaleDateString('fi-FI'));

  const fields = [
    { key: 'heart_rate', label: 'Syke', color: 'red' },
    { key: 'rmssd', label: 'RMSSD', color: 'green' },
    { key: 'mean_rr', label: 'Mean RR', color: 'blue' },
    { key: 'sdnn', label: 'SDNN', color: 'purple' },
    { key: 'pns_index', label: 'PNS-indeksi', color: 'orange' },
    { key: 'sns_index', label: 'SNS-indeksi', color: 'brown' }
  ];

  fields.forEach(field => {
    const container = document.createElement('div');
    container.classList.add('chart-card');

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    container.appendChild(canvas);

    chartGrid.appendChild(container);
    
    new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: field.label,
          data: sliced.map(d => d[field.key]),
          borderColor: field.color,
          backgroundColor: 'transparent', // Läpinäkyvä täyttö
          tension: 0.4,
          fill: false, // Ei täyttöä viivan alla
          pointRadius: 3,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `${field.label} – Viimeiset ${days} päivää`
          }
        },
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    });
  });
}
 
 // Suljetaan HRV-kaavio modal
 chartspan.onclick = () => chartModal.style.display = 'none';
 window.onclick = (e) => {
   if (e.target == chartModal) chartModal.style.display = 'none';
 };
 
 // Avataan päiväkirja modal
 diaryOpen.onclick = () => {
   diaryModal.style.display = 'block'; // Näytetään päiväkirja modaali
 };
 
 // Suljetaan päiväkirja modal
 diaryspan.onclick = () => diaryModal.style.display = 'none';
 window.onclick = (e) => {
   if (e.target == diaryModal) diaryModal.style.display = 'none';
 };}
