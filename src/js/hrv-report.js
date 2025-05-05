// Updated hrv-report.js - PDF Report Generation with better data handling
window.generateHrvPdfReport = generateHrvPdfReport;
window.HRV_THRESHOLDS = {
  '18-25': { rmssd: { min: 25, max: 100 }, sdnn: { min: 50, max: 150 } },
  '26-35': { rmssd: { min: 20, max: 90 }, sdnn: { min: 40, max: 130 } },
  '36-45': { rmssd: { min: 15, max: 80 }, sdnn: { min: 30, max: 110 } },
  '46-56': { rmssd: { min: 10, max: 60 }, sdnn: { min: 20, max: 80 } }
};

// Function to show messages to the user
function showMessage(message, type = 'info') {
  let messageElement = document.getElementById('status-message');
  if (!messageElement) {
    messageElement = document.createElement('div');
    messageElement.id = 'status-message';
    messageElement.style.position = 'fixed';
    messageElement.style.top = '20px';
    messageElement.style.right = '20px';
    messageElement.style.padding = '10px 20px';
    messageElement.style.borderRadius = '5px';
    messageElement.style.zIndex = '1000';
    messageElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    document.body.appendChild(messageElement);
  }

  messageElement.textContent = message;
  
  if (type === 'error') {
    messageElement.style.backgroundColor = '#f44336';
    messageElement.style.color = 'white';
  } else if (type === 'success') {
    messageElement.style.backgroundColor = '#4CAF50';
    messageElement.style.color = 'white';
  } else {
    messageElement.style.backgroundColor = '#2196F3';
    messageElement.style.color = 'white';
  }

  messageElement.style.display = 'block';
  setTimeout(() => {
    messageElement.style.display = 'none';
  }, 3000);
}

// Helper function to standardize date format
function formatDateToYYYYMMDD(dateInput) {
  let dateObj;

  if (typeof dateInput === 'string') {
    if (dateInput.includes('T')) {
      dateInput = dateInput.split('T')[0];
    }
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return dateInput;
    }
    
    dateObj = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    dateObj = dateInput;
  } else {
    console.error("Invalid date input:", dateInput);
    return null;
  }

  if (isNaN(dateObj.getTime())) {
    console.error("Invalid date:", dateInput);
    return null;
  }

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// Helper function to fetch HRV data from API
async function fetchHrvDataForReport(days) {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.token) {
      throw new Error('User token not found');
    }

    const url = `http://localhost:5000/api/kubios/hrv/last-${days > 7 ? '30' : '7'}-measurements`;
    console.log(`Fetching HRV data from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Fetched ${days} days data:`, data);
    return data;
  } catch (error) {
    console.error(`Error fetching ${days} days data:`, error);
    return [];
  }
}

// Helper function to get form data values
function getFormData() {
  const diaryForm = document.getElementById('diaryForm');
  if (!diaryForm) return null;

  const getRadioValue = (name) => {
    return document.querySelector(`input[name="${name}"]:checked`)?.value || "";
  };

  const textareas = document.querySelectorAll('textarea');
  const sleepNotes = textareas[0]?.value || '';
  const activityNotes = textareas[1]?.value || '';

  const sleepSlider = document.getElementById('sleepRange');
  const moodSlider = document.getElementById('moodRange');
  
  const data = {
    entry_date: new Date().toISOString().split('T')[0],
    time_of_day: getRadioValue('time'),
    sleep_duration: sleepSlider ? parseFloat(sleepSlider.value) : 3,
    current_mood: moodSlider ? parseFloat(moodSlider.value) : 3,
    sleep_notes: sleepNotes,
    activity: activityNotes
  };
  
  console.log("GetFormData returns:", data);
  return data;
}

// Global variables
let currentDayHasAbnormalHrv = false;
let currentSelectedDate = null;

// Add event listeners when document is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("HRV-report script loaded");
  
  const reportButton = document.getElementById('generateHrvReportBtn');
  
  if (reportButton) {
    console.log("PDF report button found");
    reportButton.addEventListener('click', generateHrvPdfReport);
  }
  
  window.addEventListener('selectedDateChanged', function(event) {
    console.log("Date selection event received:", event.detail);
    const { date, hrvData } = event.detail;
    currentSelectedDate = date;
    
    if (hrvData && (hrvData.isAbnormal || hrvData.rmssdAbnormal || hrvData.sdnnAbnormal)) {
      currentDayHasAbnormalHrv = true;
      showReportButton();
      console.log("Showing report button - abnormal HRV found");
    } else {
      currentDayHasAbnormalHrv = false;
      hideReportButton();
      console.log("Hiding report button - no abnormal HRV");
    }
  });
});

function showReportButton() {
  const reportButton = document.getElementById('generateHrvReportBtn');
  if (reportButton) {
    reportButton.classList.remove('hidden');
  }
}

function hideReportButton() {
  const reportButton = document.getElementById('generateHrvReportBtn');
  if (reportButton) {
    reportButton.classList.add('hidden');
  }
}

// Main function to generate the PDF report
async function generateHrvPdfReport() {
  console.log("PDF generation started");
  const today = new Date().toISOString().split('T')[0];
  const selectedDate = currentSelectedDate || window.currentSelectedDate || today;
  const isAfterSave = (formatDateToYYYYMMDD(selectedDate) === today);

  try {
    const formattedSelectedDate = formatDateToYYYYMMDD(selectedDate);
    console.log("Generating PDF for date:", formattedSelectedDate);
    
    showMessage('Luodaan PDF-raporttia...', 'info');
    
    const dayHrvData = window.hrvData ? window.hrvData[formattedSelectedDate] : null;
    
    if (!dayHrvData) {
      console.error('HRV data not found for the selected date:', formattedSelectedDate);
      showMessage('HRV-tietoja ei löydy valitulle päivälle', 'error');
      return;
    }
    
    const userData = JSON.parse(localStorage.getItem('user'));
    const userName = userData?.user?.given_name || 'Käyttäjä';
    const dateObj = new Date(formattedSelectedDate);
    const formattedDate = dateObj.toLocaleDateString('fi-FI');
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Set up the PDF header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('HRV-raportti', 105, 20, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Potilaan nimi: ${userName}`, 20, 40);
    doc.text(`Raportin päivämäärä: ${formattedDate}`, 20, 50);
    
    doc.setLineWidth(0.5);
    doc.line(20, 55, 190, 55);
    
    // Add the HRV data table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('HRV-arvot päivältä', 20, 70);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const hrvTable = [
      ['Mittaus', 'Arvo', 'Normaali alue', 'Tila'],
      ['Syke', dayHrvData.heart_rate.toFixed(2), '60 - 80 bpm', ''],
      ['RMSSD', dayHrvData.rmssd.toFixed(2), '20 - 90 ms', dayHrvData.rmssdAbnormal ? 'POIKKEAVA' : 'Normaali'],
      ['Mean RR', dayHrvData.mean_rr.toFixed(2), '750 - 1000 ms', ''],
      ['SDNN', dayHrvData.sdnn.toFixed(2), '40 - 130 ms', dayHrvData.sdnnAbnormal ? 'POIKKEAVA' : 'Normaali'],
      ['PNS-indeksi', dayHrvData.pns_index.toFixed(2), '', ''],
      ['SNS-indeksi', dayHrvData.sns_index.toFixed(2), '', '']
    ];
    
    const tableStyles = {
      theme: 'grid',
      headStyles: { fillColor: [71, 118, 104] },
      styles: { overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 30 },
        2: { cellWidth: 50 },
        3: { cellWidth: 40 }
      }
    };
    
    const tableRows = {};
    if (dayHrvData.rmssdAbnormal) {
      tableRows[2] = { fillColor: [255, 200, 200] };
    }
    if (dayHrvData.sdnnAbnormal) {
      tableRows[4] = { fillColor: [255, 200, 200] };
    }
    
    doc.autoTable({
      head: [hrvTable[0]],
      body: hrvTable.slice(1),
      startY: 75,
      ...tableStyles,
      rowStyles: tableRows
    });
    
    // Handle diary entry data
    let latestEntry = null;

    // Check if generating right after saving
    if (isAfterSave) {
      const savedEntryData = localStorage.getItem('lastEntryData');
      if (savedEntryData) {
        latestEntry = JSON.parse(savedEntryData);
        console.log("Using saved form data from localStorage:", latestEntry);
        localStorage.removeItem('lastEntryData');
      } else {
        latestEntry = getFormData();
        console.log("Using form data directly:", latestEntry);
      }
    } else {
      // Find entry from stored data
      const dayElement = document.querySelector(`.calendar-day[data-date="${formattedSelectedDate}"]`);
      if (dayElement && dayElement.dataset.entries) {
        try {
          const entriesFromCalendar = JSON.parse(dayElement.dataset.entries);
          if (entriesFromCalendar && entriesFromCalendar.length > 0) {
            latestEntry = entriesFromCalendar[entriesFromCalendar.length - 1];
            console.log("Found entry from calendar element:", latestEntry);
          }
        } catch (e) {
          console.error("Error parsing entries from calendar:", e);
        }
      }
      
      if (!latestEntry && window.userEntries && Array.isArray(window.userEntries)) {
        const todayEntries = window.userEntries.filter(entry => {
          if (!entry || !entry.entry_date) return false;
          const entryDate = formatDateToYYYYMMDD(entry.entry_date);
          return entryDate === formattedSelectedDate;
        });
        
        if (todayEntries.length > 0) {
          latestEntry = todayEntries[todayEntries.length - 1];
          console.log("Found entry in userEntries:", latestEntry);
        }
      }
    }

    // Add diary entry to PDF if found
    if (latestEntry) {
      let startY = doc.lastAutoTable.finalY + 20;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Päiväkirjamerkintä', 20, startY);
      
      startY += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      
      const timeOfDay = latestEntry.time_of_day === 'morning' ? 'Aamu' : 'Ilta';
      doc.setFont('helvetica', 'bold');
      doc.text('Ajankohta:', 20, startY);
      doc.setFont('helvetica', 'normal');
      doc.text(timeOfDay, 120, startY);
      startY += 10;
      
      let sleepValue = latestEntry.sleep_duration;
      if (typeof sleepValue !== 'number') {
        sleepValue = parseFloat(sleepValue) || 0;
      }

      doc.setFont('helvetica', 'bold');
      doc.text('Unen laatu (1-5):', 20, startY);
      doc.setFont('helvetica', 'normal');
      let displaySleepValue = 'Ei tietoa';
      if (sleepValue !== null && sleepValue !== undefined) {
        displaySleepValue = Number.isInteger(sleepValue) ? 
          String(sleepValue) : 
          sleepValue.toFixed(1);
      }
      doc.text(`${displaySleepValue}/5`, 120, startY);

      if (latestEntry.sleep_notes && latestEntry.sleep_notes.trim() !== '') {
        startY += 10;
        doc.setFont('helvetica', 'bold');
        doc.text('Unen lisätiedot:', 20, startY);
        doc.setFont('helvetica', 'normal');
        
        const splitSleepNotes = doc.splitTextToSize(latestEntry.sleep_notes, 150);
        doc.text(splitSleepNotes, 120, startY);
        startY += splitSleepNotes.length * 7;
      } else {
        startY += 10;
      }
      
      let moodValue = latestEntry.current_mood;
      if (typeof moodValue !== 'number') {
        moodValue = parseFloat(moodValue) || 0;
      }

      doc.setFont('helvetica', 'bold');
      doc.text('Mieliala (1-5):', 20, startY);
      doc.setFont('helvetica', 'normal');
      let displayMoodValue = 'Ei tietoa';
      if (moodValue !== null && moodValue !== undefined) {
        displayMoodValue = Number.isInteger(moodValue) ? 
          String(moodValue) : 
          moodValue.toFixed(1);
      }
      doc.text(`${displayMoodValue}/5`, 120, startY);
      
      if (latestEntry.activity && latestEntry.activity.trim() !== '') {
        startY += 10;
        doc.setFont('helvetica', 'bold');
        doc.text('Mielialan lisätiedot:', 20, startY);
        doc.setFont('helvetica', 'normal');
        
        const splitActivity = doc.splitTextToSize(latestEntry.activity, 150);
        doc.text(splitActivity, 120, startY);
        startY += splitActivity.length * 7;
      } else {
        startY += 10;
      }
      
      startY += 10;
    } else {
      console.log("No entries found for the selected date");
    }
    
    // Add simple HRV charts
    let startY = doc.lastAutoTable.finalY + (latestEntry ? 220 : 20);
    await addSimpleChartsToReport(doc, startY);
    
    // Add a footer with the date and page number
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Sivu ${i} / ${totalPages}`, 20, doc.internal.pageSize.height - 10);
      doc.text(`Luotu: ${new Date().toLocaleString('fi-FI')}`, 
        doc.internal.pageSize.width - 20, 
        doc.internal.pageSize.height - 10, 
        { align: 'right' });
    }
    
    // Save the PDF
    doc.save(`HRV-raportti-${formattedSelectedDate}.pdf`);
    
    showMessage('PDF-raportti luotu onnistuneesti!', 'success');
    
  } catch (error) {
    console.error('Error generating PDF report:', error);
    showMessage('Virhe raportin luonnissa!', 'error');
  }
}

// Function to add simple charts to report
async function addSimpleChartsToReport(doc, startY) {
  try {
    let currentY = startY;
    
    // Try to get data from different sources
    let rawData7 = [];
    let rawData30 = [];
    
    // First try to get from global/window variables
    if (typeof fullRawData !== 'undefined' && fullRawData) {
      rawData7 = fullRawData.slice(-7);
      rawData30 = fullRawData;
    } else if (typeof window.fullRawData !== 'undefined' && window.fullRawData) {
      rawData7 = window.fullRawData.slice(-7);
      rawData30 = window.fullRawData;
    }
    
    // If no data available, fetch from API
    if ((!rawData7.length && !rawData30.length)) {
      console.log("No data available in variables, fetching from API...");
      rawData7 = await fetchHrvDataForReport(7);
      rawData30 = await fetchHrvDataForReport(30);
    }
    
    if (!rawData7.length && !rawData30.length) {
      console.log("No HRV data available for charts");
      return;
    }
    
    // Lista kaavioista
    const chartTypes = [
      { key: 'heart_rate', label: 'Syke', color: '#c62828' },
      { key: 'rmssd', label: 'RMSSD', color: '#2e7d32' },
      { key: 'sdnn', label: 'SDNN', color: '#1976d2' },
      { key: 'pns_index', label: 'PNS-indeksi', color: '#6a1b9a' },
      { key: 'sns_index', label: 'SNS-indeksi', color: '#c2185b' }
    ];
    
    // Luo kaaviot 7 ja 30 päivää
    const periods = [
      { days: 7, data: rawData7 },
      { days: 30, data: rawData30 }
    ];
    
    for (const period of periods) {
      if (!period.data.length) continue;
      
      if (currentY > 240) { // Back to original threshold
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(`HRV-arvot (viimeiset ${period.days} päivää)`, 20, currentY);
      currentY += 10;
      
      for (const chart of chartTypes) {
        if (currentY > 230) { // Back to original threshold
          doc.addPage();
          currentY = 20;
        }
        
        const chartUrl = await createSingleHrvChart(period.data, period.days, chart);
        
        if (chartUrl) {
          // No text label since chart already has title
          doc.addImage(chartUrl, 'PNG', 20, currentY, 120, 40); // Reduced width, original height
          currentY += 50; // More space for original height
        }
      }
      
      currentY += 10;
    }
    
  } catch (error) {
    console.error('Error adding charts to report:', error);
  }
}

// Function to create single HRV chart
async function createSingleHrvChart(rawData, days, chartConfig) {
  try {
    const chartContainer = document.createElement('div');
    chartContainer.style.width = '600px';
    chartContainer.style.height = '200px'; // Back to original height
    chartContainer.style.position = 'fixed';
    chartContainer.style.top = '-9999px';
    
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 200; // Back to original height
    chartContainer.appendChild(canvas);
    
    document.body.appendChild(chartContainer);
    
    // Process the data
    const lastData = rawData.slice(-days);
    lastData.sort((a, b) => {
      const dateA = a.daily_result ? new Date(a.daily_result) : new Date();
      const dateB = b.daily_result ? new Date(b.daily_result) : new Date();
      return dateA - dateB;
    });
    
    const labels = lastData.map(r => {
      if (r.daily_result) {
        const date = new Date(r.daily_result);
        return date.toLocaleDateString('fi-FI');
      }
      return '';
    });
    
    const datasets = [{
      label: chartConfig.label,
      data: lastData.map(d => d[chartConfig.key]),
      borderColor: chartConfig.color,
      backgroundColor: 'transparent',
      borderWidth: 2,
      fill: false,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 5
    }];
    
    // Remove threshold lines - they're no longer needed
    
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          title: {
            display: true,
            text: chartConfig.label,
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          legend: {
            display: false
          },
          tooltip: {
            enabled: false
          }
        },
        scales: {
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              callback: function(val, index) {
                return index % (days > 15 ? 3 : 1) === 0 ? this.getLabelForValue(val) : '';
              }
            }
          },
          y: {
            type: 'linear',
            display: true,
            beginAtZero: false,
            ticks: {
              font: {
                size: 10
              }
            }
          }
        }
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const imageUrl = canvas.toDataURL('image/png', 0.95);
    document.body.removeChild(chartContainer);
    
    return imageUrl;
  } catch (error) {
    console.error(`Error generating ${chartConfig.key} chart:`, error);
    return null;
  }
}