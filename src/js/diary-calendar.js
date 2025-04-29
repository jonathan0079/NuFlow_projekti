document.addEventListener('DOMContentLoaded', function() {
    initializeCalendar();
    const today = new Date();
    updateCalendar(today.getFullYear(), today.getMonth());
    
    // Haetaan käyttäjän merkinnät heti aluksi
    fetchUserEntries();
});

/**
 * Alustaa kalenterin ja luo HTML-elementit
 */
function initializeCalendar() {
    const mainElement = document.querySelector('main');
    if (!mainElement) return;

    // Kalenterin säilö
    const calendarContainer = document.createElement('div');
    calendarContainer.id = 'calendar-container';
    calendarContainer.className = 'calendar-container';
    mainElement.appendChild(calendarContainer);
    mainElement.insertBefore(calendarContainer, document.getElementById('openDiaryBtn, openChartBtn'));


    // Lisää kalenterin otsikko (header) ja navigointipainikkeet
    const calendarHeader = document.createElement('div');
    calendarHeader.classList.add('calendar-header');
    const prevButton = document.createElement('button');
    prevButton.id = 'prev-month';
    prevButton.classList.add('month-nav-button');
    prevButton.textContent = '←';
    const monthYearTitle = document.createElement('h2');
    monthYearTitle.id = 'month-year';
    const nextButton = document.createElement('button');
    nextButton.id = 'next-month';
    nextButton.classList.add('month-nav-button');
    nextButton.textContent = '→';

    calendarHeader.appendChild(prevButton);
    calendarHeader.appendChild(monthYearTitle);
    calendarHeader.appendChild(nextButton);
    calendarContainer.appendChild(calendarHeader);

    // Lisää kalenterin ruudukko (grid)
    const calendarGrid = document.createElement('div');
    calendarGrid.id = 'calendar-grid';
    calendarGrid.classList.add('calendar-grid');
    
    // Päivien otsikot (Ma, Ti, Ke, ...)
    const daysOfWeek = ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'];
    daysOfWeek.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.classList.add('calendar-day-header');
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });

    // Lisää tyhjät kalenteripäiväelementit
    for (let i = 0; i < 42; i++) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day');
        calendarGrid.appendChild(dayElement);
    }

    calendarContainer.appendChild(calendarGrid);

 
    // Lisää tapahtumakäsittelijät
    prevButton.addEventListener('click', function() {
        const [year, month] = getCurrentYearMonth();
        const newDate = new Date(year, month - 1, 1);
        updateCalendar(newDate.getFullYear(), newDate.getMonth());
    });

    nextButton.addEventListener('click', function() {
        const [year, month] = getCurrentYearMonth();
        const newDate = new Date(year, month + 1, 1);
        updateCalendar(newDate.getFullYear(), newDate.getMonth());
    });
}

/**
 * Päivittää kalenterin tietyn vuoden ja kuukauden mukaan
 * @param {number} year - Vuosi
 * @param {number} month - Kuukausi (0-11)
 */
function updateCalendar(year, month) {
    const monthNames = [
        'Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu', 'Toukokuu', 'Kesäkuu', 
        'Heinäkuu', 'Elokuu', 'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu'
    ];
    document.getElementById('month-year').textContent = `${monthNames[month]} ${year}`;

    const calendarContainer = document.getElementById('calendar-container');
    calendarContainer.dataset.year = year;
    calendarContainer.dataset.month = month;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    const dayElements = document.querySelectorAll('.calendar-day');
    dayElements.forEach(day => {
        day.textContent = '';
        day.style.backgroundColor = '';
        day.classList.remove('current-month', 'today', 'selected', 'abnormal-hrv');
        day.removeAttribute('data-date'); // Poista vanha päivämäärä
        day.removeAttribute('data-entries'); // Poista vanhat merkinnät
        day.removeAttribute('data-hrv'); // Poista vanhat HRV-arvot
        day.style.visibility = 'hidden'; // Piilota kaikki päivät aluksi
        
        // Poista kaikki aiemmat lapsielementit
        while (day.firstChild) {
            day.removeChild(day.firstChild);
        }
    });

    // Määritä ensimmäisen päivän indeksi (0 = maanantai, 6 = sunnuntai)
    let firstDayIndex = firstDay.getDay() - 1;
    if (firstDayIndex < 0) firstDayIndex = 6;

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    for (let i = 0; i < totalDays; i++) {
        const dayElement = dayElements[firstDayIndex + i];
        const dayNumber = i + 1;

        // Tee päivä näkyväksi
        dayElement.style.visibility = 'visible';

        // Lisää päivän numero
        const dayNumberSpan = document.createElement('span');
        dayNumberSpan.textContent = dayNumber;
        dayElement.appendChild(dayNumberSpan);

        dayElement.classList.add('current-month');

        // Muotoile päivämäärä muotoon YYYY-MM-DD
        const monthStr = (month + 1).toString().padStart(2, '0');
        const dayStr = dayNumber.toString().padStart(2, '0');
        const dateStr = `${year}-${monthStr}-${dayStr}`;
        dayElement.dataset.date = dateStr;

        if (isCurrentMonth && today.getDate() === dayNumber) {
            dayElement.classList.add('today');
        }

        // Lisää merkintäindikaattorit, jos kyseisellä päivällä on merkintöjä
        if (window.userEntries) {
            const dayEntries = window.userEntries.filter(entry => {
                // Muunna entry_date kokonaiseksi päivämääräksi
                const entryDate = new Date(entry.entry_date);
                // Muunna vertailtava dateStr päivämääräksi
                const compareDate = new Date(dateStr);
                
                // Vertaa pelkkiä päivämääriä ilman kellonaikaa
                return (
                    entryDate.getFullYear() === compareDate.getFullYear() &&
                    entryDate.getMonth() === compareDate.getMonth() &&
                    entryDate.getDate() === compareDate.getDate()
                );
            });
            
            if (dayEntries.length > 0) {
                // Tallenna merkinnät data-attribuuttiin
                dayElement.dataset.entries = JSON.stringify(dayEntries);
                
                // Lisää merkintäindikaattorit
                const indicatorsContainer = document.createElement('div');
                indicatorsContainer.style.display = 'flex';
                indicatorsContainer.style.justifyContent = 'center';
                indicatorsContainer.style.alignItems = 'center';
                indicatorsContainer.style.gap = '2px';
                indicatorsContainer.style.marginTop = '5px'; // Lisää tilaa päivän numeron alapuolelle
                
                // Tarkista onko aamumerkintä
                if (dayEntries.some(entry => entry.time_of_day === 'morning')) {
                    const morningIcon = document.createElement('img');
                    morningIcon.src = '/src/img/sun.png';
                    morningIcon.alt = 'Aamu-merkintä';
                    morningIcon.style.width = '16px';
                    morningIcon.style.height = '16px';
                    morningIcon.style.zIndex = '10';
                    indicatorsContainer.appendChild(morningIcon);
                }
                
                // Tarkista onko iltamerkintä
                if (dayEntries.some(entry => entry.time_of_day === 'evening')) {
                    const eveningIcon = document.createElement('img');
                    eveningIcon.src = '/src/img/moon.png';
                    eveningIcon.alt = 'Ilta-merkintä';
                    eveningIcon.style.width = '16px';
                    eveningIcon.style.height = '16px';
                    eveningIcon.style.zIndex = '10';
                    indicatorsContainer.appendChild(eveningIcon);
                }
                
                // Lisää ikonit päivän numeron jälkeen
                dayElement.appendChild(indicatorsContainer);
            }
        }

        // Tarkista onko poikkeava HRV-arvo kyseiselle päivälle
        if (window.hrvData && window.hrvData[dateStr]) {
            const hrvValues = window.hrvData[dateStr];
            // Tarkista onko poikkeava arvo
            if (hrvValues.isAbnormal) {
                dayElement.classList.add('abnormal-hrv');
                dayElement.dataset.hrv = JSON.stringify(hrvValues);
            }
        }

        // Lisää tapahtumakäsittelijä päivälle
        dayElement.addEventListener('click', function() {
            selectDate(this);
        });
    }
}

/**
 * Hakee kuukauden HRV-arvot ja tallentaa ne globaaliin muuttujaan
 * @param {string} token - Käyttäjän JWT-token
 */
async function fetchMonthHrvData(token) {
    try {
        const response = await fetch('http://localhost:5000/api/kubios/hrv/last-30-measurements', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HRV-arvojen haku epäonnistui: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('HRV-arvot haettu:', data);
        
        // Tallennetaan HRV-arvot päiväkohtaisesti
        window.hrvData = {};
        
        data.forEach(item => {
            if (!item.daily_result) return;
            
            const date = new Date(item.daily_result);
            const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
            
            // Tarkista, onko RMSSD tai SDNN poikkeava
            const isRmssdAbnormal = item.rmssd < 20 || item.rmssd > 90;
            const isSdnnAbnormal = item.sdnn < 40 || item.sdnn > 130;
            
            window.hrvData[dateString] = {
                rmssd: item.rmssd,
                sdnn: item.sdnn,
                heart_rate: item.heart_rate,
                mean_rr: item.mean_rr,
                pns_index: item.pns_index,
                sns_index: item.sns_index,
                isAbnormal: isRmssdAbnormal || isSdnnAbnormal,
                rmssdAbnormal: isRmssdAbnormal,
                sdnnAbnormal: isSdnnAbnormal
            };
        });
        
        console.log('HRV-data käsitelty:', window.hrvData);
    } catch (error) {
        console.error('Virhe HRV-datan haussa:', error);
        window.hrvData = {}; // Varmista, että hrvData on aina olemassa
    }
}

/**
 * Hakee käyttäjän merkinnät palvelimelta
 */
async function fetchUserEntries() {
    try {
        // Haetaan kirjautuneen käyttäjän tiedot
        const userData = localStorage.getItem('user');
        if (!userData) {
            console.error('Käyttäjätietoja ei löydy');
            window.userEntries = []; // Alusta tyhjä taulukko
            updateCalendar(new Date().getFullYear(), new Date().getMonth());
            return;
        }
        
        const user = JSON.parse(userData);
        const token = user.token;
        
        if (!token) {
            console.error('Token puuttuu käyttäjätiedoista');
            window.userEntries = []; // Alusta tyhjä taulukko
            updateCalendar(new Date().getFullYear(), new Date().getMonth());
            return;
        }
        
        // Haetaan käyttäjän merkinnät
        const response = await fetch(`http://localhost:5000/api/entries/user`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Merkintöjen haku epäonnistui: ${response.status} ${response.statusText}`);
        }
        
        const entries = await response.json();
        console.log('Käyttäjän merkinnät haettu:', entries);
        
        // Tallennetaan merkinnät globaaliin muuttujaan, jotta ne ovat saatavilla kalenterille
        window.userEntries = entries || [];
        
        // Haetaan myös HRV-arvot kuukaudelle
        await fetchMonthHrvData(token);
        
        // Päivitä kalenteri näyttämään merkinnät
        const [year, month] = getCurrentYearMonth();
        updateCalendar(year, month);
        
    } catch (error) {
        console.error('Virhe merkintöjen haussa:', error);
        
        // Varmista, että calendar-notification elementti on olemassa
        let notificationElement = document.getElementById('calendar-notification');
        if (!notificationElement) {
            notificationElement = document.createElement('div');
            notificationElement.id = 'calendar-notification';
            notificationElement.classList.add('calendar-notification');
            
            // Lisää notification elementti kalenterin yläpuolelle
            const calendarContainer = document.getElementById('calendar-container');
            if (calendarContainer) {
                calendarContainer.parentNode.insertBefore(notificationElement, calendarContainer);
            }
        }
        
        // Päivitä virheilmoitus
        notificationElement.textContent = 'Merkintöjen haku epäonnistui: ' + error.message;
        
        // Alusta tyhjät taulukot varmuuden vuoksi
        window.userEntries = [];
        window.hrvData = {};
        
        // Päivitä kalenteri
        updateCalendar(new Date().getFullYear(), new Date().getMonth());
    }
}

/**
 * Käsittelee päivämäärän valinnan kalenterissa
 * @param {HTMLElement} dayElement - Valittu päiväelementti
 */
function selectDate(dayElement) {
    // Poista aiempi valinta
    document.querySelectorAll('.calendar-day.selected').forEach(day => {
        day.classList.remove('selected');
    });
    
    // Merkitse uusi valinta
    dayElement.classList.add('selected');
    
    // Hae valitun päivän päivämäärä
    const selectedDate = dayElement.dataset.date;
    if (!selectedDate) return;
    
    // Näytä merkinnän tiedot lomakkeessa
    const entriesData = dayElement.dataset.entries;
    const entries = entriesData ? JSON.parse(entriesData) : [];
    
    // Hae HRV-data valitulle päivälle
    const hrvData = dayElement.dataset.hrv ? JSON.parse(dayElement.dataset.hrv) : null;
    
    // Lähetä päivämäärän valinnan tapahtuma
    const dateChangedEvent = new CustomEvent('selectedDateChanged', {
        detail: {
            date: selectedDate,
            entries: entries,
            hrvData: hrvData
        }
    });
    window.dispatchEvent(dateChangedEvent);
}

/**
 * Hakee nykyisen vuoden ja kuukauden kalenterin data-attribuuteista
 * @returns {Array} - [vuosi, kuukausi]
 */
function getCurrentYearMonth() {
    const calendarContainer = document.getElementById('calendar-container');
    const currentYear = calendarContainer ? 
        parseInt(calendarContainer.dataset.year) : 
        new Date().getFullYear();
    
    const currentMonth = calendarContainer ? 
        parseInt(calendarContainer.dataset.month) : 
        new Date().getMonth();
    
    return [currentYear, currentMonth];
}