// Tässä päivitetty diary.js, jossa HRV-tyhjädatan käsittely ja modalin avaus toimii oikein
import './auth.js';
import './diary-calendar.js';

console.log("diary.js ladattu");

function getAuthToken() {
  const user = JSON.parse(localStorage.getItem('user'));
  return user ? user.token : null;
}

document.addEventListener('DOMContentLoaded', () => {
  const token = getAuthToken();
  console.log("Haettu token:", token);
  if (!token) {
    alert("Et ole kirjautunut sisään.");
    window.location.href = "/index.html";
    return;
  }
  initDiary(token);

  //  Päiväkirjamodaalin avaus ja sulku toimii vasta kun DOM ladattu
  const diaryModal = document.getElementById('diaryModal');
  const diaryOpen = document.getElementById('openDiaryBtn');
  const diaryspan = diaryModal?.querySelector('.close');

  if (diaryOpen && diaryModal) {
    diaryOpen.onclick = () => {
      diaryModal.style.display = 'block';
    };
  }

  if (diaryspan) {
    diaryspan.onclick = () => {
      diaryModal.style.display = 'none';
    };
  }

  window.onclick = (e) => {
    if (e.target === diaryModal) {
      diaryModal.style.display = 'none';
    }
  };
});

function initDiary(token) {
  const diaryForm = document.getElementById('diaryForm');
  const submitButton = document.querySelector('#submit-button');
  const API_URL = 'http://localhost:3000/api/entries/insert';

  fetchAndDisplayHrvData(token);

  diaryForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    function showSuccessFeedback(button) {
      button.classList.add('success');
      setTimeout(() => button.classList.remove('success'), 2000);
    }

    toggleSubmitButton(submitButton, true);

    if (!getRadioValue('time')) {
      alert("Valitse kirjauksen ajankohta (Aamu/Ilta)");
      toggleSubmitButton(submitButton, false);
      return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user.user_id || user.id || user.user?.id;

    const entryData = {
      user_id: userId,
      entry_date: new Date().toISOString().split('T')[0],
      time_of_day: getRadioValue('time'),
      sleep_duration: parseInt(document.getElementById('sleepRange').value, 10),
      current_mood: parseInt(document.getElementById('moodRange').value, 10),
      sleep_notes: getTextareaValue(0),
      activity: getTextareaValue(1),
    };

    console.log("Lähetetään lomake:", entryData);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(entryData)
      });

      const result = await response.json();
      const saveContainer = document.getElementById('saveMessageContainer');
      const saveResponse = document.getElementById('saveResponse');

      if (!response.ok) {
        saveResponse.textContent = 'Tallennus epäonnistui: ' + (result.message || 'Tuntematon virhe');
        saveContainer.className = 'error show';
        console.error("Palvelimen vastaus:", result);
        setTimeout(() => {
          saveContainer.className = '';
          saveResponse.textContent = '';
        }, 3000);
      } else {
        saveResponse.textContent = 'Päiväkirjamerkintä tallennettu!';
        saveContainer.className = 'success show';
        resetDiaryForm();
        resetHrvDisplay();
        fetchAndDisplayHrvData(token);
        showSuccessFeedback(submitButton);
        setTimeout(() => {
          saveContainer.className = '';
          saveResponse.textContent = '';
        }, 3000);
      }
    } catch (error) {
      alert("Palvelinvirhe. Yritä myöhemmin.");
      console.error("[TALLENNUS VIRHE]", error);
    }

    toggleSubmitButton(submitButton, false);
  });

  autoLoadTodayData();
}

function getRadioValue(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || "";
}

function getTextareaValue(index) {
  return document.querySelectorAll('textarea')[index]?.value || "";
}

function toggleSubmitButton(button, loading) {
  button.disabled = loading;
  button.textContent = loading ? 'Tallennetaan...' : 'Tallenna';
}

function resetDiaryForm() {
  document.querySelectorAll('input[name="time"]').forEach(r => r.checked = false);
  const sleepSlider = document.getElementById('sleepRange');
  const moodSlider = document.getElementById('moodRange');
  if (sleepSlider) { sleepSlider.value = 3; updateThumbColor(sleepSlider); }
  if (moodSlider) { moodSlider.value = 3; updateThumbColor(moodSlider); }
  document.querySelectorAll('textarea').forEach(t => t.value = '');
  resetHrvDisplay();
}

function updateThumbColor(slider) {
  const value = parseInt(slider.value, 10);
  let color = "#477668";
  if (value === 1) color = "red";
  else if (value === 2) color = "coral";
  else if (value === 3) color = "orange";
  else if (value === 4) color = "lightgreen";
  else if (value === 5) color = "green";
  slider.style.setProperty('--thumb-color', color);
}

function resetHrvDisplay() {
  ['hrv-syke', 'hrv-rmssd', 'hrv-meanrr', 'hrv-sdnn', 'hrv-pns', 'hrv-sns']
    .forEach(id => setText(id, '-'));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? '-';
}

function fetchAndDisplayHrvData(token) {
  const date = new Date().toISOString().split('T')[0];
  console.log("📡 Haetaan HRV päivälle:", date);
  fetch(`http://localhost:3000/api/kubios/hrv/by-date/${date}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(res => res.json())
    .then(data => {
      if (!data.results || data.results.length === 0) {
        console.log('HRV-dataa ei saatavilla tälle päivälle.');
        resetHrvDisplay();
        return;
      }
      const hrv = data.results?.[0];
      setText('hrv-syke', hrv.heart_rate.toFixed(2));
      setText('hrv-rmssd', hrv.rmssd.toFixed(2));
      setText('hrv-meanrr', hrv.mean_rr.toFixed(2));
      setText('hrv-sdnn', hrv.sdnn.toFixed(2));
      setText('hrv-pns', hrv.pns_index.toFixed(2));
      setText('hrv-sns', hrv.sns_index.toFixed(2));
    }).catch(err => console.error('[HRV VIRHE]', err));
}

function autoLoadTodayData() {
  const today = new Date().toISOString().split('T')[0];
  const userEntries = window.userEntries || [];
  const todayEntries = userEntries.filter(entry => entry.entry_date === today);
  const todayDateEvent = new CustomEvent('selectedDateChanged', {
    detail: { date: today, entries: todayEntries }
  });
  window.dispatchEvent(todayDateEvent);
};

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
}

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
  