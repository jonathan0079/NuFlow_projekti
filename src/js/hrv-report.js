// Updated hrv-report.js - PDF Report Generation
window.generateHrvPdfReport = generateHrvPdfReport;
window.HRV_THRESHOLDS = {
  '18-25': { rmssd: { min: 25, max: 100 }, sdnn: { min: 50, max: 150 } },
  '26-35': { rmssd: { min: 20, max: 90 }, sdnn: { min: 40, max: 130 } },
  '36-45': { rmssd: { min: 15, max: 80 }, sdnn: { min: 30, max: 110 } },
  '46-56': { rmssd: { min: 10, max: 60 }, sdnn: { min: 20, max: 80 } }
};

// Function to show messages to the user
function showMessage(message, type = 'info') {
  // Create message element if it doesn't exist
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

  // Set message content and style
  messageElement.textContent = message;
  
  // Set color based on message type
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

  // Show the message
  messageElement.style.display = 'block';

  // Hide after 3 seconds
  setTimeout(() => {
    messageElement.style.display = 'none';
  }, 3000);
}

// Helper function to standardize date format
function formatDateToYYYYMMDD(dateInput) {
  // Handle different input types
  let dateObj;

  if (typeof dateInput === 'string') {
    // Remove any time portion if present and standardize format
    if (dateInput.includes('T')) {
      dateInput = dateInput.split('T')[0];
    }
    
    // If it's already in YYYY-MM-DD format, return it
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return dateInput;
    }
    
    // Try to parse the date string
    dateObj = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    dateObj = dateInput;
  } else {
    console.error("Invalid date input:", dateInput);
    return null;
  }

  // Ensure valid date
  if (isNaN(dateObj.getTime())) {
    console.error("Invalid date:", dateInput);
    return null;
  }

  // Format to YYYY-MM-DD
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// Helper function to get form data values (when the report is generated right after entry)
function getFormData() {
  // Alkuperäinen toteutus, mutta muutettu vain konsolilokitukset
  const diaryForm = document.getElementById('diaryForm');
  if (!diaryForm) return null;

  // Get radio value for time of day
  const getRadioValue = (name) => {
    return document.querySelector(`input[name="${name}"]:checked`)?.value || "";
  };

  // Get textarea values - TÄYSIN SAMA KUIN ALKUPERÄINEN
  const textareas = document.querySelectorAll('textarea');
  const sleepNotes = textareas[0]?.value || '';
  const activityNotes = textareas[1]?.value || '';

  // Get slider values
  const sleepSlider = document.getElementById('sleepRange');
  const moodSlider = document.getElementById('moodRange');
  
  // Luodaan objekti - täysin sama kuin alkuperäinen
  const data = {
    entry_date: new Date().toISOString().split('T')[0], // Today's date
    time_of_day: getRadioValue('time'),
    sleep_duration: sleepSlider ? parseFloat(sleepSlider.value) : 3,
    current_mood: moodSlider ? parseFloat(moodSlider.value) : 3,
    sleep_notes: sleepNotes,
    activity: activityNotes
  };
  
  // Ainoa muutos: konsolitulostus
  console.log("GetFormData palauttaa:", data);
  return data;
}

// Global variables for HRV report generation
let currentDayHasAbnormalHrv = false;
let currentSelectedDate = null;

// Add event listeners when document is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("HRV-report script loaded");
  
  // Get the report button
  const reportButton = document.getElementById('generateHrvReportBtn');
  
  if (reportButton) {
    console.log("PDF report button found");
    reportButton.addEventListener('click', generateHrvPdfReport);
  } else {
    console.error("PDF report button not found");
  }
  
  // Listen for date selection events in the calendar
  window.addEventListener('selectedDateChanged', function(event) {
    console.log("Date selection event received:", event.detail);
    const { date, hrvData } = event.detail;
    currentSelectedDate = date;
    
    // Check if the selected date has abnormal HRV
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

// Function to show the report button
function showReportButton() {
  const reportButton = document.getElementById('generateHrvReportBtn');
  if (reportButton) {
    reportButton.classList.remove('hidden');
  }
}

// Function to hide the report button
function hideReportButton() {
  const reportButton = document.getElementById('generateHrvReportBtn');
  if (reportButton) {
    reportButton.classList.add('hidden');
  }
}

// Main function to generate the PDF report - UPDATED VERSION
async function generateHrvPdfReport() {
  console.log("PDF generation started");
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Use either the selected date or today's date
  const selectedDate = currentSelectedDate || window.currentSelectedDate || today;
  
  // Check if we're generating right after saving
  const isAfterSave = (formatDateToYYYYMMDD(selectedDate) === today);

  try {
    // Format the selected date consistently
    const formattedSelectedDate = formatDateToYYYYMMDD(selectedDate);
    console.log("Generating PDF for date:", formattedSelectedDate);
    
    // Show loading message
    showMessage('Luodaan PDF-raporttia...', 'info');
    
    // Get the HRV data for the specific day
    const dayHrvData = window.hrvData ? window.hrvData[formattedSelectedDate] : null;
    
    if (!dayHrvData) {
      console.error('HRV data not found for the selected date:', formattedSelectedDate);
      showMessage('HRV-tietoja ei löydy valitulle päivälle', 'error');
      return;
    }
    
    // Get user data to include in the report
    const userData = JSON.parse(localStorage.getItem('user'));
    const userName = userData?.user?.given_name || 'Käyttäjä';
    
    // Format the date for display
    const dateObj = new Date(formattedSelectedDate);
    const formattedDate = dateObj.toLocaleDateString('fi-FI');
    
    // Create a new PDF document
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
    
    // Draw a line to separate the header from the content
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
    
    // Highlight abnormal values in the table
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
    
    // Add specific row styling for abnormal values
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
    
    // Log debugging information for entry finding
    console.log(`Looking for entries on date: ${formattedSelectedDate}`);
    console.log(`Total entries available: ${window.userEntries ? window.userEntries.length : 'None'}`);
    
    // Initialize variable for entry data
    let latestEntry = null;

    // IMPORTANT CHANGE: If generating right after saving a new entry, get data directly from form
    if (isAfterSave) {
      // Hae tallennetut lomakkeen tiedot LocalStorage:sta
      const savedEntryData = localStorage.getItem('lastEntryData');
      if (savedEntryData) {
        latestEntry = JSON.parse(savedEntryData);
        console.log("Using saved form data from localStorage:", latestEntry);
        // Puhdistetaan väliaikainen tieto
        localStorage.removeItem('lastEntryData');
      } else {
        // Fallback vanhaan tapaan
        latestEntry = getFormData();
        console.log("Using form data directly:", latestEntry);
      }
    } 
    // Otherwise, try to find from stored entries
    else {
      // Try multiple approaches to find the entry
      
      // First check calendar element for stored entries
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
      
      // If not found in calendar, check userEntries
      if (!latestEntry && window.userEntries && Array.isArray(window.userEntries)) {
        console.log("Searching in userEntries:", window.userEntries);
        
        // Find entries with matching date
        const todayEntries = window.userEntries.filter(entry => {
          if (!entry || !entry.entry_date) return false;
          
          // Try multiple formats for comparison
          const entryDate = formatDateToYYYYMMDD(entry.entry_date);
          return entryDate === formattedSelectedDate;
        });
        
        if (todayEntries.length > 0) {
          latestEntry = todayEntries[todayEntries.length - 1];
          console.log("Found entry in userEntries:", latestEntry);
        }
      }
    }

    // If we found an entry, add it to the report
    if (latestEntry) {
      console.log("Adding entry to PDF:", latestEntry);
      let startY = doc.lastAutoTable.finalY + 20;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Päiväkirjamerkintä', 20, startY);
      
      startY += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      
      // Add time of day (morning/evening)
      const timeOfDay = latestEntry.time_of_day === 'morning' ? 'Aamu' : 'Ilta';
      doc.setFont('helvetica', 'bold');
      doc.text('Ajankohta:', 20, startY);
      doc.setFont('helvetica', 'normal');
      doc.text(timeOfDay, 120, startY);
      startY += 10;
      
      // Format sleep_duration as integer or with one decimal
      let sleepValue = latestEntry.sleep_duration;
      // Convert to number if it's not already
      if (typeof sleepValue !== 'number') {
        sleepValue = parseFloat(sleepValue) || 0;
      }

      // Sleep quality
      doc.setFont('helvetica', 'bold');
      doc.text('Unen laatu (1-5):', 20, startY);
      doc.setFont('helvetica', 'normal');
      // Format with one decimal place if necessary
      let displaySleepValue = 'Ei tietoa';
      if (sleepValue !== null && sleepValue !== undefined) {
        // Format as a string with one decimal if needed
        displaySleepValue = Number.isInteger(sleepValue) ? 
          String(sleepValue) : 
          sleepValue.toFixed(1);
      }
      doc.text(`${displaySleepValue}/5`, 120, startY);

      // Sleep notes
      if (latestEntry.sleep_notes && latestEntry.sleep_notes.trim() !== '') {
        startY += 10;
        doc.setFont('helvetica', 'bold');
        doc.text('Unen lisätiedot:', 20, startY);
        doc.setFont('helvetica', 'normal');
        
        // Handle line breaks for long texts
        const splitSleepNotes = doc.splitTextToSize(latestEntry.sleep_notes, 150);
        doc.text(splitSleepNotes, 120, startY);
        startY += splitSleepNotes.length * 7; // Add space based on number of lines
      } else {
        startY += 10;
      }
      
      // Format current_mood to keep one decimal place if needed
      let moodValue = latestEntry.current_mood;
      // Convert to number if it's not already
      if (typeof moodValue !== 'number') {
        moodValue = parseFloat(moodValue) || 0;
      }

      // Mood
      doc.setFont('helvetica', 'bold');
      doc.text('Mieliala (1-5):', 20, startY);
      doc.setFont('helvetica', 'normal');
      // Format with one decimal place if necessary
      let displayMoodValue = 'Ei tietoa';
      if (moodValue !== null && moodValue !== undefined) {
        // Format as a string with one decimal if needed
        displayMoodValue = Number.isInteger(moodValue) ? 
          String(moodValue) : 
          moodValue.toFixed(1);
      }
      doc.text(`${displayMoodValue}/5`, 120, startY);
      
      // Additional mood notes
      if (latestEntry.activity && latestEntry.activity.trim() !== '') {
        startY += 10;
        doc.setFont('helvetica', 'bold');
        doc.text('Mielialan lisätiedot:', 20, startY);
        doc.setFont('helvetica', 'normal');
        
        // Handle line breaks for long texts
        const splitActivity = doc.splitTextToSize(latestEntry.activity, 150);
        doc.text(splitActivity, 120, startY);
        startY += splitActivity.length * 7; // Add space based on number of lines
      } else {
        startY += 10;
      }
      
      // Move charts start position down
      startY += 10;
    } else {
      console.log("No entries found for the selected date");
      // If no entry is found, start charts after HRV table
      let startY = doc.lastAutoTable.finalY + 20;
    }
    
    // Add charts to the report
    let startY = doc.lastAutoTable.finalY + 20;
    
    // Last 7 days chart
    let lastWeekChartUrl = await getLastWeekChartImageUrl();
    
    if (lastWeekChartUrl) {
      if (startY > 180) {
        doc.addPage();
        startY = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Viimeiset 7 päivää', 20, startY);
      doc.addImage(lastWeekChartUrl, 'PNG', 20, startY + 5, 170, 80);
      startY += 90;
    }
    
    // Last 30 days chart
    let lastMonthChartUrl = await getLastMonthChartImageUrl();
    if (lastMonthChartUrl) {
      if (startY > 180) {
        doc.addPage();
        startY = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Viimeiset 30 päivää', 20, startY);
      doc.addImage(lastMonthChartUrl, 'PNG', 20, startY + 5, 170, 80);
      startY += 90;
    }
    
    doc.addPage();
    startY = 20;

    // Add new detailed multi-chart for last 7 measurements for RMSSD and SDNN
    const multiChartLast7Url = await getDetailedMultiChartUrl(7);
    if (multiChartLast7Url) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Viimeisten 7 mittauksen yksityiskohtaiset HRV-arvot', 20, startY);
      doc.addImage(multiChartLast7Url, 'PNG', 10, startY + 5, 190, 120);
      startY += 130;
    }

    doc.addPage();
    startY = 20;
    
    // Add new detailed multi-chart for last 30 measurements for RMSSD and SDNN
    const multiChartLast30Url = await getDetailedMultiChartUrl(30);
    if (multiChartLast30Url) {
      // Add a new page if there's not enough space
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Viimeisten 30 mittauksen yksityiskohtaiset HRV-arvot', 20, startY);
      doc.addImage(multiChartLast30Url, 'PNG', 10, startY + 5, 190, 120);
    }
    
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
    
    // Show success message
    showMessage('PDF-raportti luotu onnistuneesti!', 'success');
    
  } catch (error) {
    console.error('Error generating PDF report:', error);
    showMessage('Virhe raportin luonnissa!', 'error');
  }
}

// Function to generate an image URL from the last 7 days chart
async function getLastWeekChartImageUrl() {
  try {
    // Create a container for the chart
    const chartContainer = document.createElement('div');
    chartContainer.style.width = '600px';
    chartContainer.style.height = '300px';
    chartContainer.style.position = 'fixed';
    chartContainer.style.top = '-9999px';
    
    // Create a canvas for the chart
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 300;
    chartContainer.appendChild(canvas);
    
    // Add the container to the document
    document.body.appendChild(chartContainer);
    
    // Get the raw data for the chart (using either global or window scope)
    let rawData = [];
    if (typeof fullRawData !== 'undefined') {
      rawData = fullRawData;
    } else if (typeof window.fullRawData !== 'undefined') {
      rawData = window.fullRawData;
    }
    
    // Get the last 7 days of data
    const lastWeekData = rawData.slice(-7);
    
    if (!lastWeekData || lastWeekData.length === 0) {
      return null;
    }
    
    // Create labels for the chart
    const labels = lastWeekData.map(r => {
      if (r.daily_result) {
        const date = new Date(r.daily_result);
        return date.toLocaleDateString('fi-FI');
      }
      return 'Tuntematon päivä';
    });
    
    // Create datasets for RMSSD and SDNN
    const rmssdData = lastWeekData.map(d => d.rmssd);
    const sdnnData = lastWeekData.map(d => d.sdnn);
    
    // Get user age group for thresholds
    let ageGroup = '26-35'; // Default
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData && userData.user && userData.user.birthdate) {
      const birthDate = new Date(userData.user.birthdate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
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
    
    // Get thresholds (from global or window scope)
    let thresholds;
    if (typeof HRV_THRESHOLDS !== 'undefined') {
      thresholds = HRV_THRESHOLDS[ageGroup];
    } else if (typeof window.HRV_THRESHOLDS !== 'undefined') {
      thresholds = window.HRV_THRESHOLDS[ageGroup];
    } else {
      // Fallback values if HRV_THRESHOLDS is not available
      thresholds = {
        rmssd: { min: 20, max: 90 },
        sdnn: { min: 40, max: 130 }
      };
    }
    
    // Create the chart
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'RMSSD',
            data: rmssdData,
            borderColor: 'blue',
            fill: false,
            tension: 0.4
          },
          {
            label: 'SDNN',
            data: sdnnData,
            borderColor: 'green',
            fill: false,
            tension: 0.4
          },
          {
            label: 'RMSSD Min',
            data: Array(labels.length).fill(thresholds.rmssd.min),
            borderColor: 'red',
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0
          },
          {
            label: 'RMSSD Max',
            data: Array(labels.length).fill(thresholds.rmssd.max),
            borderColor: 'red',
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0
          },
          {
            label: 'SDNN Min',
            data: Array(labels.length).fill(thresholds.sdnn.min),
            borderColor: 'orange',
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0
          },
          {
            label: 'SDNN Max',
            data: Array(labels.length).fill(thresholds.sdnn.max),
            borderColor: 'orange',
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'HRV-arvot (viimeiset 7 päivää)'
          },
          legend: {
            position: 'bottom'
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Arvo (ms)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Päivämäärä'
            }
          }
        }
      }
    });
    
    // Wait for chart rendering to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Convert the chart to an image
    const imageUrl = canvas.toDataURL('image/png');
    
    // Remove the container
    document.body.removeChild(chartContainer);
    
    return imageUrl;
  } catch (error) {
    console.error('Error generating last week chart:', error);
    return null;
  }
}

// Function to generate an image URL from the last 30 days chart
async function getLastMonthChartImageUrl() {
  try {
    // Create a container for the chart
    const chartContainer = document.createElement('div');
    chartContainer.style.width = '600px';
    chartContainer.style.height = '300px';
    chartContainer.style.position = 'fixed';
    chartContainer.style.top = '-9999px';
    
    // Create a canvas for the chart
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 300;
    chartContainer.appendChild(canvas);
    
    // Add the container to the document
    document.body.appendChild(chartContainer);
    
    // Get the raw data for the chart
    let rawData = [];
    if (typeof fullRawData !== 'undefined') {
      rawData = fullRawData;
    } else if (typeof window.fullRawData !== 'undefined') {
      rawData = window.fullRawData;
    }
    
    // Get the last 30 days of data
    const lastMonthData = rawData.slice(-30);
    
    if (!lastMonthData || lastMonthData.length === 0) {
      return null;
    }
    
    // Create labels for the chart
    const labels = lastMonthData.map(r => {
      if (r.daily_result) {
        const date = new Date(r.daily_result);
        return date.toLocaleDateString('fi-FI');
      }
      return 'Tuntematon päivä';
    });
    
    // Create datasets for RMSSD and SDNN
    const rmssdData = lastMonthData.map(d => d.rmssd);
    const sdnnData = lastMonthData.map(d => d.sdnn);
    
    // Get user age group for thresholds
    let ageGroup = '26-35'; // Default
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData && userData.user && userData.user.birthdate) {
      const birthDate = new Date(userData.user.birthdate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
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
    
    // Get thresholds
    let thresholds;
    if (typeof HRV_THRESHOLDS !== 'undefined') {
      thresholds = HRV_THRESHOLDS[ageGroup];
    } else if (typeof window.HRV_THRESHOLDS !== 'undefined') {
      thresholds = window.HRV_THRESHOLDS[ageGroup];
    } else {
      // Fallback values
      thresholds = {
        rmssd: { min: 20, max: 90 },
        sdnn: { min: 40, max: 130 }
      };
    }
    
    // Create the chart
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'RMSSD',
            data: rmssdData,
            borderColor: 'blue',
            fill: false,
            tension: 0.4
          },
          {
            label: 'SDNN',
            data: sdnnData,
            borderColor: 'green',
            fill: false,
            tension: 0.4
          },
          {
            label: 'RMSSD Min',
            data: Array(labels.length).fill(thresholds.rmssd.min),
            borderColor: 'red',
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0
          },
          {
            label: 'RMSSD Max',
            data: Array(labels.length).fill(thresholds.rmssd.max),
            borderColor: 'red',
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0
          },
          {
            label: 'SDNN Min',
            data: Array(labels.length).fill(thresholds.sdnn.min),
            borderColor: 'orange',
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0
          },
          {
            label: 'SDNN Max',
            data: Array(labels.length).fill(thresholds.sdnn.max),
            borderColor: 'orange',
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'HRV-arvot (viimeiset 30 päivää)'
          },
          legend: {
            position: 'bottom'
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Arvo (ms)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Päivämäärä'
            },
            ticks: {
              // Only show every 6th label to avoid overcrowding
              callback: function(val, index) {
                return index % 6 === 0 ? this.getLabelForValue(val) : '';
              }
            }
          }
        }
      }
    });
    
    // Wait for chart rendering to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Convert the chart to an image
    const imageUrl = canvas.toDataURL('image/png');
    
    // Remove the container
    document.body.removeChild(chartContainer);
    
    return imageUrl;
  } catch (error) {
    console.error('Error generating last month chart:', error);
    return null;
  }
}

// NEW FUNCTION: Generate detailed multi-chart with all HRV values for last N measurements
// Muutettu getDetailedMultiChartUrl-funktio, jossa päivämäärät järjestetään vanhimmasta uusimpaan
async function getDetailedMultiChartUrl(days) {
  try {
    // Tavallinen alustus kuten aiemmin...
    const chartContainer = document.createElement('div');
    chartContainer.style.width = '800px';
    chartContainer.style.height = '500px';
    chartContainer.style.position = 'fixed';
    chartContainer.style.top = '-9999px';
    
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    chartContainer.appendChild(canvas);
    
    document.body.appendChild(chartContainer);
    
    // Hae data
    let rawData = [];
    if (typeof fullRawData !== 'undefined') {
      rawData = fullRawData;
    } else if (typeof window.fullRawData !== 'undefined') {
      rawData = window.fullRawData;
    } else {
      // Yritetään hakea API:sta
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.token) {
          const res = await fetch(`http://localhost:5000/api/kubios/hrv/last-${days > 7 ? '30' : '7'}-measurements`, {
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          });
          
          if (res.ok) {
            rawData = await res.json();
          }
        }
      } catch (e) {
        console.error("Error fetching HRV data:", e);
      }
    }
    
    // Jos dataa ei ole, yritetään mock-dataa
    if (!rawData || rawData.length === 0) {
      try {
        const mockRes = await fetch('/public/mockdata.json');
        if (mockRes.ok) {
          const mockData = await mockRes.json();
          rawData = mockData.results || [];
        }
      } catch (e) {
        console.error("Error fetching mock data:", e);
      }
    }
    
    // Jos vieläkään ei ole dataa, palautetaan null
    if (!rawData || rawData.length === 0) {
      document.body.removeChild(chartContainer);
      return null;
    }
    
    // Otetaan viimeiset N päivää datasta
    const lastData = rawData.slice(-days);
    
    // TÄRKEÄ MUUTOS: Järjestä data päivämäärän mukaan vanhimmasta uusimpaan
    lastData.sort((a, b) => {
      const dateA = a.daily_result ? new Date(a.daily_result) : new Date();
      const dateB = b.daily_result ? new Date(b.daily_result) : new Date();
      return dateA - dateB; // Vanhimmasta uusimpaan
    });
    
    // Luo otsikot järjestetyn datan perusteella
    const labels = lastData.map(r => {
      if (r.daily_result) {
        const date = new Date(r.daily_result);
        return date.toLocaleDateString('fi-FI');
      }
      return 'Tuntematon päivä';
    });
    
    // Metriikat
    const metrics = [
      { key: 'rmssd', label: 'RMSSD', color: 'rgba(54, 162, 235, 0.8)' },
      { key: 'sdnn', label: 'SDNN', color: 'rgba(75, 192, 192, 0.8)' },
      { key: 'heart_rate', label: 'Syke', color: 'rgba(255, 99, 132, 0.8)' },
      { key: 'mean_rr', label: 'Mean RR', color: 'rgba(153, 102, 255, 0.8)' },
      { key: 'pns_index', label: 'PNS Index', color: 'rgba(255, 159, 64, 0.8)' },
      { key: 'sns_index', label: 'SNS Index', color: 'rgba(255, 205, 86, 0.8)' }
    ];
    
    // Haetaan ikäryhmä
    let ageGroup = '26-35';
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData && userData.user && userData.user.birthdate) {
      const birthDate = new Date(userData.user.birthdate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
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
    
    // Raja-arvot
    let thresholds = {
      'rmssd': { min: 20, max: 90 },
      'sdnn': { min: 40, max: 130 }
    };
    
    if (typeof HRV_THRESHOLDS !== 'undefined') {
      thresholds = HRV_THRESHOLDS[ageGroup];
    } else if (typeof window.HRV_THRESHOLDS !== 'undefined') {
      thresholds = window.HRV_THRESHOLDS[ageGroup];
    }
    
    // Luo datasetit järjestetyn datan pohjalta
    const datasets = metrics.map(metric => {
      return {
        label: metric.label,
        data: lastData.map(d => d[metric.key]),
        borderColor: metric.color,
        backgroundColor: metric.color.replace('0.8', '0.2'),
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        yAxisID: metric.key === 'mean_rr' ? 'y1' : 'y',
      };
    });
    
    // Lisää raja-arvot viivoina
    if (thresholds.rmssd) {
      datasets.push({
        label: 'RMSSD Min',
        data: Array(labels.length).fill(thresholds.rmssd.min),
        borderColor: 'rgba(255, 0, 0, 0.5)',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        borderWidth: 1,
        yAxisID: 'y'
      });
      
      datasets.push({
        label: 'RMSSD Max',
        data: Array(labels.length).fill(thresholds.rmssd.max),
        borderColor: 'rgba(255, 0, 0, 0.5)',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        borderWidth: 1,
        yAxisID: 'y'
      });
    }
    
    if (thresholds.sdnn) {
      datasets.push({
        label: 'SDNN Min',
        data: Array(labels.length).fill(thresholds.sdnn.min),
        borderColor: 'rgba(255, 165, 0, 0.5)',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        borderWidth: 1,
        yAxisID: 'y'
      });
      
      datasets.push({
        label: 'SDNN Max',
        data: Array(labels.length).fill(thresholds.sdnn.max),
        borderColor: 'rgba(255, 165, 0, 0.5)',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        borderWidth: 1,
        yAxisID: 'y'
      });
    }
    
    // Luo kaavio
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `HRV-mittaushistoria (viimeiset ${days} mittausta)`,
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 15
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Päivämäärä'
            },
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
            position: 'left',
            title: {
              display: true,
              text: 'Arvo (ms / bpm)'
            },
            suggestedMin: 0
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Mean RR (ms)'
            },
            grid: {
              drawOnChartArea: false
            },
            ticks: {
              color: 'rgba(153, 102, 255, 1)'
            }
          }
        }
      }
    });
    
    // Odota kaavion renderöintia
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Muunna kuva URL:ksi
    const imageUrl = canvas.toDataURL('image/png');
    
    // Poista container DOM:sta
    document.body.removeChild(chartContainer);
    
    return imageUrl;
  } catch (error) {
    console.error(`Error generating ${days}-day detailed chart:`, error);
    return null;
  }
}

// Sama periaate myös muihin graafeja luoviin funktioihin
function updateLastWeekAndMonthCharts() {
  // Päivitä getLastWeekChartImageUrl ja getLastMonthChartImageUrl 
  // samalla tavalla järjestämällä data päivämäärän mukaan
  
  // Tämä on vain muistutus - nämä täytyy päivittää samalla tavalla:
  // 1. Järjestä data: lastData.sort((a, b) => {...})
  // 2. Käytä järjestettyä dataa datasettien luomiseen
}