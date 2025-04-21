import '../css/style.css';
import '../css/snackbar.css';
import  './auth.js'; // Tuodaan auth.js tiedosto, jotta saadaan token käyttöön



console.log("diary.js ladattu");

// Hakee autentikaatio tokenin local storagesta

function getAuthToken() {
const user = JSON.parse(localStorage.getItem('user'));
console.log(`Käyttäjän nimi on: ${user.user.given_name}`);
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
  const API_URL = 'http://localhost:3000/api/entries/insert'; // Backend-osoite merkintöjen lisäykseen

  fetchAndDisplayHrvData(token); // Ladataan HRV-arvot automaattisesti heti sivun alussa
 
  //  Kun lomake lähetetään
  diaryForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Estetään oletustoiminto (sivun uudelleenlataus)

    toggleSubmitButton(submitButton, true); // Näytetään, että tallennus on käynnissä

    //  Kerätään kaikki tiedot lomakkeesta objektiin
    const entryData = {
      entry_date: new Date().toISOString().split('T')[0], // Päivämäärä (esim. "2025-04-08")
      time_of_day: getRadioValue('time'), // Aamu / Ilta valinta
      heart_rate: getText('hrv-syke'), // HRV: syke
      rmssd: getText('hrv-rmssd'),
      mean_rr: getText('hrv-meanrr'),
      sdnn: getText('hrv-sdnn'),
      pns_index: getText('hrv-pns'),
      sns_index: getText('hrv-sns'),
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
  const today = new Date().toISOString().split('T')[0]; // Tänään (esim. "2025-04-08")
  console.log("📡 Haetaan HRV päivälle:", today);

  try {
    fetch(`http://localhost:3000/api/kubios/hrv/by-date/${today}`, {
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

    const hrv = await response.json(); // Luetaan HRV-arvot

    //  Asetetaan arvot HTML:ään
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

//chart.js
//  OLETUS: sinulla on mockdata.json polussa /public/
//  Chart.js on asennettu ja ladattu
import Chart from 'chart.js/auto'; // Ladataan Chart.js

const modal = document.getElementById('chartModal'); // Modaali-ikkuna, jossa kaaviot näkyvät
const btnOpen = document.getElementById('openChartBtn'); // Nappi: Näytä HRV-kaaviot
const span = modal.querySelector('.close'); // Sulje-nappi (rasti oikeassa yläkulmassa)
const btn7 = document.getElementById('btn7days'); // Nappi: Viimeiset 7 päivää
const btn30 = document.getElementById('btn30days'); // Nappi: Viimeiset 30 päivää
const pieCanvas = document.getElementById('hrvPieChart'); // Canvas-elementti polar-kaaviolle
const chartGrid = document.querySelector('.chart-grid'); // Grid, johon viivakaaviot piirretään
const title = document.querySelector('#chartHeaderTitle'); // Otsikko modalin yläosassa

let rawData = []; // Tänne tallennetaan mockdata.json tiedot
let pieChart = null; // Tänne tallennetaan piirrettävä polar-kaavio

btnOpen.onclick = async () => {
  modal.style.display = 'block'; // Näytetään modaali
  title.textContent = 'HRV-arvot (uusin päivä)'; // Päivitetään otsikko
  pieCanvas.style.display = 'block'; // Näytetään polar-kaavio
  chartGrid.innerHTML = ''; // Tyhjennetään viivakaaviot

  try {
    const res = await fetch('/mockdata.json'); // Haetaan tiedot mockdata.json-tiedostosta
    const data = await res.json(); // Muutetaan JSONiksi
    rawData = data.results;
     // Käytetään backendin dataa, jos se on saatavilla
    //const res = await fetch('http://localhost:3000/api/kubios/user-data', {
    // headers: {
    //   Authorization: `Bearer ${localStorage.getItem('token')}`
      //}
    //});
    //const data = await res.json();
    //rawData = data.results;
    const latest = rawData[rawData.length - 1]; // Otetaan uusin päivä
    drawPieChart(latest); // Piirretään polar-kaavio
  } catch (err) {
    console.error("Data loading error:", err); // Näytetään virhe konsoliin
  }
};

//Modaali sulkeutuu kun klikataan rasti tai modaali-alueen ulkopuolelle
span.onclick = () => modal.style.display = 'none';
window.onclick = (e) => {
  if (e.target == modal) modal.style.display = 'none';
};

btn7.onclick = () => {
  chartGrid.innerHTML = ''; // Tyhjennetään kaaviot
  pieCanvas.style.display = 'none'; // Piilotetaan polar-kaavio
  title.textContent = 'HRV-arvot (viimeiset 7 päivää)'; // Otsikko
  drawLineCharts(7); // Piirretään 7 päivän viivakaaviot
};

btn30.onclick = () => {
  chartGrid.innerHTML = '';
  pieCanvas.style.display = 'none';
  title.textContent = 'HRV-arvot (viimeiset 30 päivää)';
  drawLineCharts(30);
};

//Polar-kaavion piirtäminen yhdelle päivälle
function drawPieChart(day) {
  if (!pieCanvas) return;

  const values = [
    day.result.rmssd,
    day.result.sdnn,
    day.result.mean_rr,
    day.result.bpm,
    day.result.pns_index,
    day.result.sns_index
  ];

  const maxValue = Math.max(...values);// Normalisointia varten
  const normalized = values.map(v => (v / maxValue) * 100);// Skalaus
  const labels = ['RMSSD', 'SDNN', 'Mean RR', 'BPM', 'PNS Index', 'SNS Index'];
  const colors = ['green', 'purple', 'orange', 'red', 'blue', 'brown'];

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

  const sliced = rawData.slice(-days);// Viimeiset N päivää
  const labels = sliced.map(r => new Date(r.daily_result).toLocaleDateString('fi-FI'));// Päivämäärät

  const fields = [
    { key: 'rmssd', label: 'RMSSD', color: 'green' },
    { key: 'sdnn', label: 'SDNN', color: 'purple' },
    { key: 'mean_rr', label: 'Mean RR', color: 'orange' },
    { key: 'bpm', label: 'BPM', color: 'red' },
    { key: 'pns_index', label: 'PNS Index', color: 'blue' },
    { key: 'sns_index', label: 'SNS Index', color: 'brown' },
  ];

  fields.forEach(field => {
    const container = document.createElement('div');
    container.classList.add('chart-card');

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    container.appendChild(canvas);

    chartGrid.appendChild(container);
    const chart = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: field.label,
          data: sliced.map(d => d.result[field.key]),
          borderColor: field.color,
          backgroundColor: field.color,
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
          },
          legend: {
            display: true
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        },
        animation: {
          duration: 2000,
          easing: 'easeOutQuart'
        },
        animations: {
          tension: {
            duration: 2000,
            easing: 'linear',
            from: 1,
            to: 0,
            loop: true
          }
        }
      }        
    });

    // Animaation jatkuva päivitys
    setInterval(() => chart.update(), 2000);
  });
}