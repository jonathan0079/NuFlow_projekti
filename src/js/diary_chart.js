import './diary.js';
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