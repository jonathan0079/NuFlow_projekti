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
    if (hrvData && hrvData.isAbnormal) {
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

// Main function to generate the PDF report
async function generateHrvPdfReport() {
if (!currentDayHasAbnormalHrv || !currentSelectedDate) {
  console.error('No abnormal HRV data available for PDF generation');
  return;
}

try {
  // Format the selected date consistently
  const formattedSelectedDate = formatDateToYYYYMMDD(currentSelectedDate);
  console.log("Formatted selected date:", formattedSelectedDate);
  
  // Show loading message
  showMessage('Luodaan PDF-raporttia...', 'info');
  
  // Get the HRV data for the specific day
  const dayHrvData = window.hrvData ? window.hrvData[formattedSelectedDate] : null;
  
  if (!dayHrvData) {
    console.error('HRV data not found for the selected date');
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
  doc.text('HRV-arvot päivämäärältä', 20, 70);
  
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
  
  // Add extensive debugging
  console.log("===== ENTRY FINDING DEBUGGING =====");
  console.log(`Looking for entries on date: ${formattedSelectedDate}`);
  console.log(`Total entries available: ${window.userEntries ? window.userEntries.length : 'None'}`);
  
  // IMPROVED VERSION: Find matching entries for the selected date
  const todayEntries = [];
  
  // Ensure userEntries exists
  if (!window.userEntries || !Array.isArray(window.userEntries)) {
    console.error("userEntries is missing or not an array!");
    window.userEntries = []; // Initialize to empty array to prevent errors
  }
  
  // First try to check if there are any entries using the standardized date format
  window.userEntries.forEach((entry, index) => {
    if (!entry || !entry.entry_date) {
      console.log(`Entry ${index} has no entry_date property`);
      return; // Skip this entry
    }
    
    // Format the entry date consistently using our helper function
    const entryDateFormatted = formatDateToYYYYMMDD(entry.entry_date);
    
    console.log(`Entry ${index} date: ${entry.entry_date} → formatted: ${entryDateFormatted}`);
    
    // Compare formatted dates as strings
    if (entryDateFormatted === formattedSelectedDate) {
      console.log(`MATCH FOUND: Entry ${index}`);
      todayEntries.push(entry);
    }
  });
  
  console.log(`Found ${todayEntries.length} entries for ${formattedSelectedDate}`);
  
  // If we still didn't find any entries, try a more flexible approach
  if (todayEntries.length === 0) {
    console.log("No entries found with exact date match, trying alternative approach...");
    
    // Try a more flexible comparison
    window.userEntries.forEach((entry, index) => {
      if (!entry || !entry.entry_date) return; // Skip invalid entries
      
      const entryDate = new Date(entry.entry_date);
      const selectedDateObj = new Date(formattedSelectedDate);
      
      // Compare year, month, and day directly
      if (entryDate.getFullYear() === selectedDateObj.getFullYear() &&
          entryDate.getMonth() === selectedDateObj.getMonth() &&
          entryDate.getDate() === selectedDateObj.getDate()) {
        
        console.log(`MATCH FOUND with direct date comparison: Entry ${index}`);
        todayEntries.push(entry);
      }
    });
    
    console.log(`Found ${todayEntries.length} entries with alternative approach`);
  }
  
  // Get the latest entry for the selected date (if any)
  const latestEntry = todayEntries.length > 0 ? todayEntries[todayEntries.length - 1] : null;
  
  // If an entry is found, add it to the report
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
    
    // Format sleep_duration as integer
    let sleepValue = latestEntry.sleep_duration;
    // Make sure to display as integer rather than decimal
    if (typeof sleepValue === 'number') {
      sleepValue = Math.round(sleepValue);
    }
    
    // Sleep quality
    doc.setFont('helvetica', 'bold');
    doc.text('Unen laatu (1-5):', 20, startY);
    doc.setFont('helvetica', 'normal');
    // Ensure sleepValue is displayed as an integer
    let displaySleepValue = 'Ei tietoa';
    if (sleepValue !== null && sleepValue !== undefined) {
      // Force to integer by using parseInt or Math.round and ensure it's a string
      displaySleepValue = String(Math.round(sleepValue));
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
    
    // Format current_mood as integer
    let moodValue = latestEntry.current_mood;
    // Make sure to display as integer rather than decimal
    if (typeof moodValue === 'number') {
      moodValue = Math.round(moodValue);
    }
    
    // Mood
    doc.setFont('helvetica', 'bold');
    doc.text('Mieliala (1-5):', 20, startY);
    doc.setFont('helvetica', 'normal');
    // Ensure moodValue is displayed as an integer
    let displayMoodValue = 'Ei tietoa';
    if (moodValue !== null && moodValue !== undefined) {
      // Force to integer by using parseInt or Math.round and ensure it's a string
      displayMoodValue = String(Math.round(moodValue));
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
    
    // Continue with charts
    let lastWeekChartUrl = await getLastWeekChartImageUrl();
    
    if (lastWeekChartUrl) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Viimeiset 7 päivää', 20, startY);
      doc.addImage(lastWeekChartUrl, 'PNG', 20, startY + 5, 170, 80);
      startY += 90;
    }
    
    // Last 30 days chart
    let lastMonthChartUrl = await getLastMonthChartImageUrl();
    if (lastMonthChartUrl) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Viimeiset 30 päivää', 20, startY);
      doc.addImage(lastMonthChartUrl, 'PNG', 20, startY + 5, 170, 80);
    }
  } else {
    console.log("No entries found for the selected date");
    // If no entry is found, just continue with charts
    let startY = doc.lastAutoTable.finalY + 20;
    
    // Last 7 days chart
    let lastWeekChartUrl = await getLastWeekChartImageUrl();
    
    if (lastWeekChartUrl) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Viimeiset 7 päivää', 20, startY);
      doc.addImage(lastWeekChartUrl, 'PNG', 20, startY + 5, 170, 80);
      startY += 90;
    }
    
    // Last 30 days chart
    let lastMonthChartUrl = await getLastMonthChartImageUrl();
    if (lastMonthChartUrl) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Viimeiset 30 päivää', 20, startY);
      doc.addImage(lastMonthChartUrl, 'PNG', 20, startY + 5, 170, 80);
    }
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
      
      // Käytetään globaalia fullRawData muuttujaa, tai fallback tyhjään taulukkoon
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
      
      // Käytetään HRV_THRESHOLDS tietoja joko globaalista muuttujasta tai hardcoded fallback
      let thresholds;
      if (typeof HRV_THRESHOLDS !== 'undefined') {
        thresholds = HRV_THRESHOLDS[ageGroup];
      } else if (typeof window.HRV_THRESHOLDS !== 'undefined') {
        thresholds = window.HRV_THRESHOLDS[ageGroup];
      } else {
        // Fallback-arvot jos HRV_THRESHOLDS ei ole saatavilla
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
      
      // Käytetään globaalia fullRawData muuttujaa, tai fallback tyhjään taulukkoon
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
      
      // Create labels for the chart (show every 5th day for clarity)
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
      
      // Käytetään HRV_THRESHOLDS tietoja joko globaalista muuttujasta tai hardcoded fallback
      let thresholds;
      if (typeof HRV_THRESHOLDS !== 'undefined') {
        thresholds = HRV_THRESHOLDS[ageGroup];
      } else if (typeof window.HRV_THRESHOLDS !== 'undefined') {
        thresholds = window.HRV_THRESHOLDS[ageGroup];
      } else {
        // Fallback-arvot jos HRV_THRESHOLDS ei ole saatavilla
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