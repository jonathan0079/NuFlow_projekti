import './auth.js';
import './diary-calendar.js';

console.log("diary.js ladattu");

// Hakee autentikaatio tokenin local storagesta
function getAuthToken() {
  const user = JSON.parse(localStorage.getItem('user'));
  return user ? user.token : null;
}

// Global-muuttujat
let pieChart = null;
let fullRawData = [];

// HRV-raja-arvot ikäryhmittäin
const HRV_THRESHOLDS = {
  '18-25': { rmssd: { min: 25, max: 100 }, sdnn: { min: 50, max: 150 } },
  '26-35': { rmssd: { min: 20, max: 90 }, sdnn: { min: 40, max: 130 } },
  '36-45': { rmssd: { min: 15, max: 80 }, sdnn: { min: 30, max: 110 } },
  '46-56': { rmssd: { min: 10, max: 60 }, sdnn: { min: 20, max: 80 } }
};

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
  setupModalFunctionality();
  
  // Lisää HRV-selite kalenteriin
  addHrvLegend();
});

// Lisää selitteen kalenteriin poikkeavista HRV-arvoista
function addHrvLegend() {
  const calendarContainer = document.getElementById('calendar-container');
  if (!calendarContainer) return;
  
  // Tarkista onko selite jo olemassa
  if (document.querySelector('.calendar-legend')) return;
  
// Lisää selite (legend)
const legend = document.createElement('div');
legend.classList.add('calendar-legend');
  
// Lisää selitteet
const legendItems = [
  { icon: '/src/img/sun.png', text: 'Aamu-merkintä', alt: 'Aurinko' },
  { icon: '/src/img/moon.png', text: 'Ilta-merkintä', alt: 'Kuu' },
  { class: 'abnormal-hrv', text: 'Poikkeava HRV', type: 'box' }
];
  
legendItems.forEach(item => {
  const legendItem = document.createElement('div');
  legendItem.classList.add('legend-item');
  
  if (item.type === 'box') {
    // Laatikkotyylinen selite (poikkeava HRV)
    const indicator = document.createElement('span');
    indicator.style.width = '15px';
    indicator.style.height = '15px';
    indicator.style.backgroundColor = '#ffcdd2';
    indicator.style.border = '1px solid #e57373';
    legendItem.appendChild(indicator);
  } else {
    // Ikoni-selite (aamu/ilta)
    const icon = document.createElement('img');
    icon.src = item.icon;
    icon.alt = item.alt;
    icon.style.width = '16px';
    icon.style.height = '16px';
    legendItem.appendChild(icon);
  }
  
  const text = document.createElement('span');
  text.textContent = item.text;
  
  legendItem.appendChild(text);
  legend.appendChild(legendItem);
});
  
  // Lisää selite kalenterin loppuun
  calendarContainer.appendChild(legend);
}

// Asettaa modaalien toiminnallisuuden
function setupModalFunctionality() {
  // HRV-kaavio modaali
  const chartModal = document.getElementById('chartModal'); // Modaali-ikkuna, jossa kaaviot näkyvät
  const chartOpen = document.getElementById('openChartBtn'); // Nappi: Näytä HRV-kaaviot
  const chartspan = document.querySelector('#chartModal .close-modal'); // Sulje-nappi (rasti oikeassa yläkulmassa)
  const btn7 = document.getElementById('btn7days'); // Nappi: Viimeiset 7 päivää
  const btn30 = document.getElementById('btn30days'); // Nappi: Viimeiset 30 päivää
  const pieCanvas = document.getElementById('hrvPieChart'); // Canvas-elementti polar-kaaviolle
  const chartGrid = document.getElementById('lineChartGrid'); // Grid, johon viivakaaviot piirretään
  const title = document.querySelector('#chartHeaderTitle'); // Otsikko modalin yläosassa
  
  // Päiväkirja modaali
  const diaryModal = document.getElementById('diaryModal'); // Modaali-ikkuna, jossa päiväkirjalomake
  const diaryOpen = document.getElementById('openDiaryBtn'); // Nappi: Lisää päiväkirjamerkintä
  const diaryspan = document.querySelector('#diaryModal .close-modal'); // Sulje-nappi (rasti oikeassa yläkulmassa)

  // Lisää modaaleille overlay-elementit, jos ne puuttuvat
  addModalOverlay(chartModal, 'chart-modal-overlay');
  addModalOverlay(diaryModal, 'diary-modal-overlay');

  // Avataan HRV-kaavio modal
  if (chartOpen) {
    chartOpen.addEventListener('click', async () => {
      chartModal.style.display = 'block';
      document.getElementById('chart-modal-overlay').style.display = 'block';
      
      title.textContent = 'HRV-arvot (uusin päivä)';
      pieCanvas.style.display = 'block';
      
      if (chartGrid) {
        chartGrid.innerHTML = '';
      }

      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const res = await fetch('http://localhost:3000/api/kubios/hrv/last-30-measurements', {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch HRV data');
        }
        
        fullRawData = await res.json(); // Tallennetaan koko 30 päivän data
        
        if (!fullRawData || fullRawData.length === 0) {
          console.warn('No HRV data available');
          return;
        }
        
        const latest = fullRawData[fullRawData.length - 1];
        drawPieChart(latest); // Piirretään polar-kaavio
        
        // Käsitellään data kalenteria varten poikkeavien arvojen tarkistamiseksi
        processHrvDataForCalendar(fullRawData);
      } catch (err) {
        console.error("Data loading error:", err);
        // Näytä käyttäjälle viesti, ettei dataa ole saatavilla
        alert('Ei HRV-dataa saatavilla');
      }
    });
  }
  
  // Avataan päiväkirja modal
  if (diaryOpen) {
    diaryOpen.addEventListener('click', () => {
      diaryModal.style.display = 'block';
      document.getElementById('diary-modal-overlay').style.display = 'block';
    });
  }
  
  // Suljetaan HRV-kaavio modal rasti-painikkeesta
  if (chartspan) {
    chartspan.addEventListener('click', () => {
      chartModal.style.display = 'none';
      document.getElementById('chart-modal-overlay').style.display = 'none';
    });
  }
  
  // Suljetaan päiväkirja modal rasti-painikkeesta
  if (diaryspan) {
    diaryspan.addEventListener('click', () => {
      diaryModal.style.display = 'none';
      document.getElementById('diary-modal-overlay').style.display = 'none';
    });
  }

  // Suljetaan modaalit kun klikataan overlay-elementtiä
  const chartOverlay = document.getElementById('chart-modal-overlay');
  const diaryOverlay = document.getElementById('diary-modal-overlay');
  
  if (chartOverlay) {
    chartOverlay.addEventListener('click', () => {
      chartModal.style.display = 'none';
      chartOverlay.style.display = 'none';
      console.log('Chart modaali suljettu klikkaamalla taustaa');
    });
  }
  
  if (diaryOverlay) {
    diaryOverlay.addEventListener('click', () => {
      diaryModal.style.display = 'none';
      diaryOverlay.style.display = 'none';
      console.log('Diary modaali suljettu klikkaamalla taustaa');
    });
  }

  // Estetään klikkausten kupliminen modaalin sisällöstä
  if (chartModal) {
    const chartContent = chartModal.querySelector('.Chartmodal-content');
    if (chartContent) {
      chartContent.addEventListener('click', function(event) {
        event.stopPropagation(); // Estetään klikkauksen kupliminen ylöspäin
      });
    }
  }

  if (diaryModal) {
    const diaryContent = diaryModal.querySelector('.modal-content');
    if (diaryContent) {
      diaryContent.addEventListener('click', function(event) {
        event.stopPropagation(); // Estetään klikkauksen kupliminen ylöspäin
      });
    }
  }

  // Viimeiset 7 päivää -nappi
  if (btn7) {
    btn7.addEventListener('click', async () => {
      if (pieCanvas) {
        pieCanvas.style.display = 'none';
      }
      
      if (chartGrid) {
        chartGrid.innerHTML = '';
      }
      
      if (title) {
        title.textContent = 'HRV-arvot (viimeiset 7 päivää)';
      }
      
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const res = await fetch('http://localhost:3000/api/kubios/hrv/last-7-measurements', {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch HRV data');
        }
        
        fullRawData = await res.json();
        console.log("7 päivän data:", fullRawData);
        
        if (!fullRawData || fullRawData.length === 0) {
          console.warn('No HRV data available for last 7 days');
          alert('Ei HRV-dataa saatavilla viimeiselle 7 päivälle');
          return;
        }
        
        drawLineCharts(7);
        
        // Käsitellään data kalenteria varten
        processHrvDataForCalendar(fullRawData);
      } catch (err) {
        console.error("Data loading error:", err);
        alert('Ei HRV-dataa saatavilla');
      }
    });
  }
  
  // Viimeiset 30 päivää -nappi
  if (btn30) {
    btn30.addEventListener('click', async () => {
      if (pieCanvas) {
        pieCanvas.style.display = 'none';
      }
      
      if (chartGrid) {
        chartGrid.innerHTML = '';
      }
      
      if (title) {
        title.textContent = 'HRV-arvot (viimeiset 30 päivää)';
      }
      
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const res = await fetch('http://localhost:3000/api/kubios/hrv/last-30-measurements', {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch HRV data');
        }
        
        fullRawData = await res.json();
        console.log("30 päivän data:", fullRawData);
        
        if (!fullRawData || fullRawData.length === 0) {
          console.warn('No HRV data available for last 30 days');
          alert('Ei HRV-dataa saatavilla viimeiselle 30 päivälle');
          return;
        }
        
        drawLineCharts(30);
        
        // Käsitellään data kalenteria varten
        processHrvDataForCalendar(fullRawData);
      } catch (err) {
        console.error("Data loading error:", err);
        alert('Ei HRV-dataa saatavilla');
      }
    });
  }
}

/**
 * Käsittelee HRV-datan kalenteria varten ja merkitsee poikkeavat arvot
 * @param {Array} hrvData - HRV-mittausten tiedot
 */
function processHrvDataForCalendar(hrvData) {
  if (!hrvData || !hrvData.length) return;
  
  // Haetaan käyttäjän ikä
  let ageGroup = '26-35'; // Oletusikäryhmä
  
  try {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData && userData.user && userData.user.birthdate) {
      const birthDate = new Date(userData.user.birthdate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      
      // Tarkistetaan onko syntymäpäivä jo ollut tänä vuonna
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      // Määritetään ikäryhmä
      if (age >= 18 && age <= 25) {
        ageGroup = '18-25';
      } else if (age >= 26 && age <= 35) {
        ageGroup = '26-35';
      } else if (age >= 36 && age <= 45) {
        ageGroup = '36-45';
      } else if (age >= 46 && age <= 56) {
        ageGroup = '46-56';
      }
    }
  } catch (e) {
    console.error('Virhe käyttäjän iän laskemisessa:', e);
  }
  
  console.log('Käytetään ikäryhmää:', ageGroup);
  
  // Käytetään oikeita raja-arvoja ikäryhmän mukaan
  const thresholds = HRV_THRESHOLDS[ageGroup];
  
  // Tallennetaan käsitelty data globaaliin muuttujaan
  window.hrvData = {};
  
  // Käydään läpi kaikki mittaukset
  hrvData.forEach(item => {
    if (!item.daily_result) return;
    
    // Muunnetaan date-string muotoon YYYY-MM-DD
    const dateStr = new Date(item.daily_result).toISOString().split('T')[0];
    
    // Tarkistetaan raja-arvot
    const isRmssdAbnormal = item.rmssd < thresholds.rmssd.min || item.rmssd > thresholds.rmssd.max;
    const isSdnnAbnormal = item.sdnn < thresholds.sdnn.min || item.sdnn > thresholds.sdnn.max;
    const isAbnormal = isRmssdAbnormal || isSdnnAbnormal;
    
    // Tallennetaan mittauksen tiedot
    window.hrvData[dateStr] = {
      rmssd: item.rmssd,
      sdnn: item.sdnn,
      heart_rate: item.heart_rate,
      mean_rr: item.mean_rr,
      pns_index: item.pns_index,
      sns_index: item.sns_index,
      isAbnormal: isAbnormal,
      rmssdAbnormal: isRmssdAbnormal,
      sdnnAbnormal: isSdnnAbnormal
    };
    
    // Jos päivä on kalenterissa näkyvissä, lisätään sille luokka
    const dayElement = document.querySelector(`.calendar-day[data-date="${dateStr}"]`);
    if (dayElement && isAbnormal) {
      dayElement.classList.add('abnormal-hrv');
      
      // Lisätään data-attribuutti arvoja varten
      dayElement.dataset.hrv = JSON.stringify(window.hrvData[dateStr]);
      
      console.log(`Merkitty päivä ${dateStr} poikkeavaksi HRV-arvoksi. RMSSD: ${item.rmssd}, SDNN: ${item.sdnn}`);
    }
  });
  
  console.log('HRV-data käsitelty kalenteria varten:', window.hrvData);
}

// Luo modalille overlay-elementin
function addModalOverlay(modalElement, overlayId) {
  if (!modalElement || document.getElementById(overlayId)) return;
  
  const overlay = document.createElement('div');
  overlay.id = overlayId;
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
  overlay.style.zIndex = '999';
  overlay.style.display = 'none';
  
  document.body.appendChild(overlay);
}

// Päätoiminnallisuus: lomakkeen käsittely ja HRV-datan nouto
function initDiary(token) {
  const diaryForm = document.getElementById('diaryForm'); // Lomake-elementti
  const submitButton = document.querySelector('#submit-button'); // Tallennusnappi
  const API_URL = 'http://localhost:3000/api/entries/insert'; // Backend-osoite merkintöjen lisäykseen

  fetchAndDisplayHrvData(token); // Ladataan HRV-arvot automaattisesti heti sivun alussa

  // Kun lomake lähetetään
  if (diaryForm) {
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

      localStorage.setItem('lastEntryData', JSON.stringify(entryData)); // Tallennetaan viimeisin merkintä local storageen
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
          }, 2000);
        
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
            // Avaa HRV-kaaviomodaali onnistuneen tallennuksen jälkeen
            setTimeout(() => {
              openHrvChartWithWarning();
            }, 500);
          }, 1500);
        }

      } catch (error) {
        alert("Palvelinvirhe. Yritä myöhemmin."); // Virhe esim. yhteydessä
        console.error("[TALLENNUS VIRHE]", error);
      }

      toggleSubmitButton(submitButton, false); // Palautetaan nappi normaaliksi
      
    });
  }

  // Kuuntelee kalenterista tulevaa päivämäärätapahtumaa
  window.addEventListener('selectedDateChanged', async (event) => {
    const { date, entries, hrvData } = event.detail;
    
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user.user_id || user.id || user.userId;
    const token = user.token;
    
    if (entries && entries.length > 0) {
      // Täytä päiväkirjalomake valitun päivän tiedoilla
      populateDiaryForm(entries[entries.length - 1]);
      
      // Jos HRV-data tuli kalenterista
      if (hrvData) {
        displayHrvData(hrvData);
      } else {
        // Hae HRV-data valitulle päivämäärälle
        try {
          await fetchHrvDataForSelectedDate(token, date);
        } catch (error) {
          console.error('HRV-datan haku epäonnistui:', error);
        }
      }
    } else {
      // Tyhjennä lomake ja HRV-arvot jos ei kirjauksia
      resetDiaryForm();
      
      // Jos HRV-data tuli kalenterista
      if (hrvData) {
        displayHrvData(hrvData);
      } else {
        // Yritä hakea HRV-data silti, koska käyttäjällä voi olla kirjaus päivältä
        try {
          await fetchHrvDataForSelectedDate(token, date);
        } catch (error) {
          console.error('HRV-datan haku epäonnistui tyhjälle päivälle:', error);
        }
      }
    }
  });

  autoLoadTodayData();
}

/**
 * Näyttää HRV-datan käyttöliittymässä
 * @param {Object} hrvData - HRV-arvot objektina 
 */
function displayHrvData(hrvData) {
  if (!hrvData) return;
  
  setText('hrv-syke', hrvData.heart_rate?.toFixed(2) || '-');
  setText('hrv-rmssd', hrvData.rmssd?.toFixed(2) || '-');
  setText('hrv-meanrr', hrvData.mean_rr?.toFixed(2) || '-');
  setText('hrv-sdnn', hrvData.sdnn?.toFixed(2) || '-');
  setText('hrv-pns', hrvData.pns_index?.toFixed(2) || '-');
  setText('hrv-sns', hrvData.sns_index?.toFixed(2) || '-');
  
  // Korosta poikkeavat arvot
  const rmssdElement = document.getElementById('hrv-rmssd');
  const sdnnElement = document.getElementById('hrv-sdnn');
  
  if (rmssdElement) {
    rmssdElement.style.backgroundColor = hrvData.rmssdAbnormal ? '#ffcdd2' : '#bebebe';
  }
  
  if (sdnnElement) {
    sdnnElement.style.backgroundColor = hrvData.sdnnAbnormal ? '#ffcdd2' : '#bebebe';
  }
}

// Näyttää vihreän onnistumisefektin napissa
function showSuccessFeedback(button) {
  if (!button) return;
  
  button.classList.add('success');
  setTimeout(() => button.classList.remove('success'), 2000); // Palauttaa normaaliksi 2s jälkeen
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

//  HRV-arvojen nouto backendiltä ja näyttö sivulla
async function fetchAndDisplayHrvData(token) {
  const staticDate = new Date().toISOString().split('T')[0]; // Tämän hetkinen päivämäärä
  console.log("📡 Haetaan HRV päivälle:", staticDate);

  try {
    const response = await fetch(`http://localhost:3000/api/kubios/hrv/by-date/${staticDate}`, {
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
    data.results.sort((a, b) => new Date(b.create_timestamp) - new Date(a.create_timestamp));
    const hrv = data.results[0];  // Oletetaan, että aina tulee vain yksi tulos kyseiseltä päivältä

    if (!hrv) {
      console.warn('No HRV data found for today');
      return;
    }

    // Asetetaan arvot HTML:ään
    setText('hrv-syke', hrv.heart_rate.toFixed(2));
    setText('hrv-rmssd', hrv.rmssd.toFixed(2));
    setText('hrv-meanrr', hrv.mean_rr.toFixed(2));
    setText('hrv-sdnn', hrv.sdnn.toFixed(2));
    setText('hrv-pns', hrv.pns_index.toFixed(2));
    setText('hrv-sns', hrv.sns_index.toFixed(2));
    
    // Haetaan kuukauden HRV-data kalenteria varten
    await fetchMonthHrvData(token);

  } catch (err) {
    console.error('[HRV VIRHE]', err.message); // Virhe yhteydessä
  }
}

/**
 * Hakee kuukauden HRV-tiedot ja käsittelee ne kalenteria varten
 * @param {string} token - Käyttäjän token
 */
async function fetchMonthHrvData(token) {
  try {
    const response = await fetch('http://localhost:3000/api/kubios/hrv/last-30-measurements', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.warn('[HRV kuukausihaku]', response.status);
      return;
    }
    
    const data = await response.json();
    
    // Käsitellään data kalenteria varten
    processHrvDataForCalendar(data);
    
  } catch (err) {
    console.error('[HRV kuukausihaku virhe]', err.message);
  }
}


    async function fetchHrvDataForSelectedDate(token, date) {
      console.log("📡 Haetaan HRV päivälle:", date);
      
      try {
        const response = await fetch(`http://localhost:3000/api/kubios/hrv/by-date/${date}`, {
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
    
        if (!data.results || !data.results[0]) {
          console.warn('No HRV data found for the selected date');
          resetHrvDisplay();
          return;
        }
    
        // Haetaan 'results' taulukosta ensimmäinen objekti
        const hrv = data.results[0];
        
        // Tarkistetaan raja-arvot
        const userData = JSON.parse(localStorage.getItem('user'));
        let ageGroup = '26-35'; // Oletusarvo
        
        if (userData && userData.user && userData.user.birthdate) {
          const birthDate = new Date(userData.user.birthdate);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          
          // Tarkistetaan onko syntymäpäivä jo ollut tänä vuonna
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          
          // Määritetään ikäryhmä
          if (age >= 18 && age <= 25) {
            ageGroup = '18-25';
          } else if (age >= 26 && age <= 35) {
            ageGroup = '26-35';
          } else if (age >= 36 && age <= 45) {
            ageGroup = '36-45';
          } else if (age >= 46 && age <= 56) {
            ageGroup = '46-56';
          }
        }
        
        // Käytetään oikeita raja-arvoja ikäryhmän mukaan
        const thresholds = HRV_THRESHOLDS[ageGroup];
        
        // Tarkistetaan raja-arvot
        const isRmssdAbnormal = hrv.rmssd < thresholds.rmssd.min || hrv.rmssd > thresholds.rmssd.max;
        const isSdnnAbnormal = hrv.sdnn < thresholds.sdnn.min || hrv.sdnn > thresholds.sdnn.max;
        
        // Luodaan HR-data objekti
        const hrvData = {
          heart_rate: hrv.heart_rate,
          rmssd: hrv.rmssd,
          mean_rr: hrv.mean_rr,
          sdnn: hrv.sdnn,
          pns_index: hrv.pns_index,
          sns_index: hrv.sns_index,
          isAbnormal: isRmssdAbnormal || isSdnnAbnormal,
          rmssdAbnormal: isRmssdAbnormal,
          sdnnAbnormal: isSdnnAbnormal
        };
        
        // Näytetään data
        displayHrvData(hrvData);
        
        // Tallennetaan päivän data arvot myös globaaliin muuttujaan
        if (!window.hrvData) window.hrvData = {};
        window.hrvData[date] = hrvData;
        
        // Päivitetään kalenterin päivän ulkoasu
        const dayElement = document.querySelector(`.calendar-day[data-date="${date}"]`);
        if (dayElement) {
          if (hrvData.isAbnormal) {
            dayElement.classList.add('abnormal-hrv');
          } else {
            dayElement.classList.remove('abnormal-hrv');
          }
          dayElement.dataset.hrv = JSON.stringify(hrvData);
        }
    
      } catch (err) {
        console.error('[HRV VIRHE]', err.message);
        resetHrvDisplay();
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
      // Ensin palautetaan alkuperäiset taustavärit
      const rmssdElement = document.getElementById('hrv-rmssd');
      const sdnnElement = document.getElementById('hrv-sdnn');
      
      if (rmssdElement) rmssdElement.style.backgroundColor = '#bebebe';
      if (sdnnElement) sdnnElement.style.backgroundColor = '#bebebe';
    
      // Asetetaan arvot tyhjiksi
      ['hrv-syke', 'hrv-rmssd', 'hrv-meanrr', 'hrv-sdnn', 'hrv-pns', 'hrv-sns'].forEach(id => setText(id, '-'));
    }
    
    // Muuttaa tallennusnapin tilaa (lataus päällä tai ei)
    function toggleSubmitButton(button, loading) {
      if (!button) return;
      
      button.disabled = loading;
      button.textContent = loading ? 'Tallennetaan...' : 'Tallenna';
    }
    
    // Päivittää sliderin värin
    function updateThumbColor(slider) {
      if (!slider) return;
      
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
    
    // Polar-kaavion piirtäminen yhdelle päivälle
    function drawPieChart(day) {
      const pieCanvas = document.getElementById('hrvPieChart');
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
      const chartGrid = document.getElementById('lineChartGrid');
      if (!chartGrid || !fullRawData) return;
    
      console.log(`Drawing line charts for ${days} days with data:`, fullRawData);
      
      // Tyhjennä aiemmat kaaviot
      chartGrid.innerHTML = '';
    
      const sliced = fullRawData.slice(-days);
      const labels = sliced.map(r => {
        if (r.daily_result) {
          const date = new Date(r.daily_result);
          return date.toLocaleDateString('fi-FI');
        }
        return 'Tuntematon päivä';
      });
    
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
        
        // Hae käyttäjän ikäryhmä
        let ageGroup = '26-35'; // Oletusarvo
        const userData = JSON.parse(localStorage.getItem('user'));
        
        if (userData && userData.user && userData.user.birthdate) {
          const birthDate = new Date(userData.user.birthdate);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          
          // Tarkistetaan onko syntymäpäivä jo ollut tänä vuonna
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          
          // Määritetään ikäryhmä
          if (age >= 18 && age <= 25) {
            ageGroup = '18-25';
          } else if (age >= 26 && age <= 35) {
            ageGroup = '26-35';
          } else if (age >= 36 && age <= 45) {
            ageGroup = '36-45';
          } else if (age >= 46 && age <= 56) {
            ageGroup = '46-56';
          }
        }
        
        // Hae raja-arvot
        const thresholds = HRV_THRESHOLDS[ageGroup];
        
        // Lisää raja-arvot viiva-kaavioihin (RMSSD ja SDNN)
        let limitLines = [];
        if (field.key === 'rmssd') {
          limitLines = [
            { value: thresholds.rmssd.min, label: 'Min', color: 'red' },
            { value: thresholds.rmssd.max, label: 'Max', color: 'red' }
          ];
        } else if (field.key === 'sdnn') {
          limitLines = [
            { value: thresholds.sdnn.min, label: 'Min', color: 'red' },
            { value: thresholds.sdnn.max, label: 'Max', color: 'red' }
          ];
        }
        
        new Chart(canvas.getContext('2d'), {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: field.label,
              data: sliced.map(d => d[field.key]),
              borderColor: field.color,
              backgroundColor: 'transparent', 
              tension: 0.4,
              fill: false,
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
                beginAtZero: false,
                // Lisää raja-arvot skaalaan
                afterDataLimits: (scale) => {
                  if (limitLines.length > 0) {
                    const min = Math.min(scale.min, thresholds[field.key]?.min || scale.min);
                    const max = Math.max(scale.max, thresholds[field.key]?.max || scale.max);
                    scale.min = min - (max - min) * 0.1; // Lisää hieman marginaalia
                    scale.max = max + (max - min) * 0.1;
                  }
                }
              }
            },
            // Lisää raja-arvoviivat kaavioon
            plugins: [{
              afterDraw: (chart) => {
                if (limitLines.length > 0) {
                  const ctx = chart.ctx;
                  const yAxis = chart.scales.y;
                  
                  limitLines.forEach(line => {
                    const yPos = yAxis.getPixelForValue(line.value);
                    
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(chart.chartArea.left, yPos);
                    ctx.lineTo(chart.chartArea.right, yPos);
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = line.color;
                    ctx.setLineDash([5, 5]); // Katkoviiva
                    ctx.stroke();
                    
                    // Tekstin lisäys viivalle
                    ctx.fillStyle = line.color;
                    ctx.font = '12px Arial';
                    ctx.fillText(line.label, chart.chartArea.left + 5, yPos - 5);
                    ctx.restore();
                  });
                }
              }
            }]
          }
        });
      });
    }
    function openHrvChartWithWarning() {
      console.log("Avataan HRV-kaaviomodaali");
      
      // Sulje ensin päiväkirjamodaali, jos se on auki
      const diaryModal = document.getElementById('diaryModal');
      if (diaryModal) {
        diaryModal.style.display = 'none';
        
        // Sulje myös overlay
        const diaryOverlay = document.getElementById('diary-modal-overlay');
        if (diaryOverlay) {
          diaryOverlay.style.display = 'none';
        }
        console.log("Päiväkirjamodaali suljettu");
      }
      
      // Pieni viive ennen uuden modaalin avaamista
      setTimeout(() => {
        // Avaa kaaviomodaali
        const chartModal = document.getElementById('chartModal');
        if (!chartModal) {
          console.error("chartModal elementtiä ei löydy");
          return;
        }
        
        chartModal.style.display = 'block';
        
        const chartOverlay = document.getElementById('chart-modal-overlay');
        if (chartOverlay) {
          chartOverlay.style.display = 'block';
        } else {
          console.error("chart-modal-overlay elementtiä ei löydy");
        }
        
        // Tarkista onko tämän päivän HRV-arvoissa poikkeamia
        const today = new Date().toISOString().split('T')[0];
        const dayHrvData = window.hrvData ? window.hrvData[today] : null;
        
        // Asetetaan HRV visualisoinnin lähtökohdat
        const title = document.querySelector('#chartHeaderTitle');
        if (title) {
          title.textContent = 'HRV-arvot (uusin päivä)';
        }
        
        const pieCanvas = document.getElementById('hrvPieChart');
        if (pieCanvas) {
          pieCanvas.style.display = 'block';
        }
        
        const chartGrid = document.getElementById('lineChartGrid');
        if (chartGrid) {
          chartGrid.innerHTML = ''; // Tyhjennä aiemmat kaaviot
        }
        
        // Poista aiempi varoitus, jos sellainen on
        const existingWarning = document.getElementById('hrv-warning');
        if (existingWarning) {
          existingWarning.remove();
        }
        
        // Jos tämän päivän HRV-data on saatavilla ja siinä on poikkeavia arvoja
        if (dayHrvData && (dayHrvData.isAbnormal || dayHrvData.rmssdAbnormal || dayHrvData.sdnnAbnormal)) {
          console.log("Poikkeavia HRV-arvoja havaittu, näytetään varoitus");
          
          // Luo varoituselementti
          const warningElement = document.createElement('div');
          warningElement.id = 'hrv-warning';
          warningElement.style.backgroundColor = '#FFA500'; // Oranssi tausta
          warningElement.style.color = '#000'; // Musta teksti
          warningElement.style.padding = '10px';
          warningElement.style.marginBottom = '15px';
          warningElement.style.borderRadius = '5px';
          warningElement.style.textAlign = 'center';
          warningElement.style.fontWeight = 'bold';
          
          // Lisää varoitusteksti
          warningElement.textContent = 'Poikkeavia arvoja mittauksessa. Suosittelemme tekemään raportin tästä.';
          
          // Luo nappi raportin tekemiseen
          const createReportButton = document.createElement('button');
          createReportButton.textContent = 'Luo HRV-raportti ammattilaiselle';
          createReportButton.style.marginTop = '10px';
          createReportButton.style.padding = '8px 15px';
          createReportButton.style.backgroundColor = '#f44336';
          createReportButton.style.color = 'white';
          createReportButton.style.border = 'none';
          createReportButton.style.borderRadius = '4px';
          createReportButton.style.cursor = 'pointer';
          
          // Lisää tapahtumankäsittelijä napille
          if (typeof generateHrvPdfReport === 'function') {
            createReportButton.addEventListener('click', generateHrvPdfReport);
          } else {
            console.error("generateHrvPdfReport-funktiota ei löydy");
          }
          
          // Lisää nappi varoituselementtiin
          warningElement.appendChild(document.createElement('br'));
          warningElement.appendChild(createReportButton);
          
          // Lisää varoitus modalin alkuun
          const modalContent = document.querySelector('.Chartmodal-content');
          if (modalContent) {
            modalContent.insertBefore(warningElement, modalContent.firstChild);
          } else {
            console.error("Modal content -elementtiä ei löydy");
          }
          
          // Aseta tieto, että nykyisellä päivällä on poikkeavia arvoja
          if (typeof window.currentDayHasAbnormalHrv !== 'undefined') {
            window.currentDayHasAbnormalHrv = true;
            window.currentSelectedDate = today;
          }
        }
        
        // Piirrä kaavio, jos kaavio-funktiot ovat käytettävissä
        if (dayHrvData && typeof drawPieChart === 'function') {
          // Muunna HRV-data oikeaan muotoon kaaviota varten
          const latestData = {
            heart_rate: dayHrvData.heart_rate,
            rmssd: dayHrvData.rmssd,
            mean_rr: dayHrvData.mean_rr,
            sdnn: dayHrvData.sdnn,
            pns_index: dayHrvData.pns_index,
            sns_index: dayHrvData.sns_index
          };
          
          drawPieChart(latestData);
        }
        
        console.log("HRV-kaaviomodaali avattu");
      }, 300); // Pieni viive modalien välillä
    }
    
    // Hae kaikki sliderit ja lisää tapahtumankuuntelijat
    document.addEventListener('DOMContentLoaded', () => {
      const sliders = document.querySelectorAll(".slider");
      
      sliders.forEach(slider => {
        slider.addEventListener("input", () => updateThumbColor(slider));
        updateThumbColor(slider); // Aseta väri heti myös alussa
      });
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
              entries: todayEntries,
              hrvData: window.hrvData ? window.hrvData[today] : null
          }
      });
      window.dispatchEvent(todayDateEvent);
    }
    function updateDayDetailsPanel(date, data) {
      const panel = document.getElementById('day-details-panel');
      const noEntryText = document.getElementById('no-entry-text');
      const hrvDetails = document.getElementById('hrv-details');
      const diaryDetails = document.getElementById('diary-entry-details');
      
      // Piilota kaikki osiot aluksi
      noEntryText.classList.add('hidden');
      hrvDetails.classList.add('hidden');
      diaryDetails.classList.add('hidden');
      
      // Yksityiskohtapaneelin otsikko
      const formattedDate = new Date(date).toLocaleDateString('fi-FI');
      document.querySelector('.day-details-panel h3').textContent = 
        `Päiväkirja - ${formattedDate}`;
      
      if (!data || (!data.entries && !data.hrvData)) {
        noEntryText.textContent = 'Ei merkintöjä tälle päivälle';
        noEntryText.classList.remove('hidden');
        return;
      }
      
      // HRV-tietojen näyttö
      if (data.hrvData) {
        document.getElementById('detail-heart-rate').textContent = 
          data.hrvData.heart_rate ? data.hrvData.heart_rate.toFixed(1) : '-';
        document.getElementById('detail-rmssd').textContent = 
          data.hrvData.rmssd ? data.hrvData.rmssd.toFixed(1) : '-';
        document.getElementById('detail-sdnn').textContent = 
          data.hrvData.sdnn ? data.hrvData.sdnn.toFixed(1) : '-';
        hrvDetails.classList.remove('hidden');
      }
      
      // Päiväkirjamerkinnän tiedot
      if (data.entries && data.entries.length > 0) {
        const entry = data.entries[0];
        
        // Ajankohta (aamu/ilta)
        const timeIcon = document.querySelector('.time-icon');
        const timeText = document.querySelector('.detail-time');
        
        if (entry.time_of_day === 'morning') {
          timeIcon.style.backgroundImage = 'url("../img/sun.png")';
          timeText.textContent = 'Aamu';
        } else {
          timeIcon.style.backgroundImage = 'url("../img/moon.png")';
          timeText.textContent = 'Ilta';
        }
        
        // Uni ja mieliala
        const sleepValue = entry.sleep_duration || 0;
        const moodValue = entry.current_mood || 0;
        
        document.getElementById('detail-sleep').textContent = `${Math.round(sleepValue)}/5`;
        document.getElementById('detail-mood').textContent = `${Math.round(moodValue)}/5`;
        
        // Unen muistiinpanot
        const sleepNotes = document.getElementById('sleep-notes-detail');
        sleepNotes.textContent = entry.sleep_notes || '';
        
        // Mielialan muistiinpanot
        const activityNotes = document.getElementById('activity-notes-detail');
        activityNotes.textContent = entry.activity || '';
          
        diaryDetails.classList.remove('hidden');
      }
    }
    
    // Päivitä selectedDateChanged tapahtumakäsittelijä diary.js tiedostossa
    window.addEventListener('selectedDateChanged', function(event) {
      const { date, entries, hrvData } = event.detail;
      
      // Päivitä uusi yksityiskohtapaneeli
      updateDayDetailsPanel(date, { entries, hrvData });
      
      // Muut olemassa olevat toiminnot pysyvät samana...
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user.user_id || user.id || user.userId;
      const token = user.token;
      
      if (entries && entries.length > 0) {
        // Täytä päiväkirjalomake valitun päivän tiedoilla
        populateDiaryForm(entries[entries.length - 1]);
        
        // Jos HRV-data tuli kalenterista
        if (hrvData) {
          displayHrvData(hrvData);
        } else {
          // Hae HRV-data valitulle päivämäärälle
          try {
            fetchHrvDataForSelectedDate(token, date);
          } catch (error) {
            console.error('HRV-datan haku epäonnistui:', error);
          }
        }
      } else {
        // Tyhjennä lomake ja HRV-arvot jos ei kirjauksia
        resetDiaryForm();
        
        // Jos HRV-data tuli kalenterista
        if (hrvData) {
          displayHrvData(hrvData);
        } else {
          // Yritä hakea HRV-data silti, koska käyttäjällä voi olla kirjaus päivältä
          try {
            fetchHrvDataForSelectedDate(token, date);
          } catch (error) {
            console.error('HRV-datan haku epäonnistui tyhjälle päivälle:', error);
          }
        }
      }
    });

    //Opastus
    document.addEventListener("DOMContentLoaded", () => {
      //  Etsitään tarvittavat elementit
      const btn = document.getElementById("diaryInfoButton"); // i-nappi
      const modal = document.getElementById("diaryInfoModal"); // taustamodaali
      const closeBtn = document.getElementById("closeDiaryModal"); // Sulje-painike
    
      //  Avaa modaalin
      if (btn && modal) {
        btn.addEventListener("click", () => {
          modal.classList.add("show"); // näkyviin
        });
      }
    
      //  Sulje-napin toiminto
      if (closeBtn && modal) {
        closeBtn.addEventListener("click", () => {
          modal.classList.remove("show"); // piiloon
        });
      }
    
      //  Sulje klikkaamalla taustaa
      window.addEventListener("click", function (e) {
        const modal = document.getElementById("diaryInfoModal");
        if (e.target === modal) {
          modal.classList.remove("show");
        }
      });
    });
    