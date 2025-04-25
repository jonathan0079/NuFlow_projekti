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
        day.classList.remove('current-month', 'today', 'selected');
        day.removeAttribute('data-date'); // Poista vanha päivämäärä
        day.removeAttribute('data-entries'); // Poista vanhat merkinnät
        
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
            const dayEntries = window.userEntries.filter(entry => entry.entry_date === dateStr);
            
            if (dayEntries.length > 0) {
                // Tallenna merkinnät data-attribuuttiin
                dayElement.dataset.entries = JSON.stringify(dayEntries);
                
                // Lisää merkintäindikaattorit
                const indicatorsContainer = document.createElement('div');
                indicatorsContainer.style.display = 'flex';
                indicatorsContainer.style.justifyContent = 'center';
                indicatorsContainer.style.gap = '2px';
                indicatorsContainer.style.marginTop = '2px';
                
                // Tarkista onko aamumerkintä
                if (dayEntries.some(entry => entry.time_of_day === 'morning')) {
                    const morningDot = document.createElement('span');
                    morningDot.classList.add('morning-indicator');
                    morningDot.style.width = '5px';
                    morningDot.style.height = '5px';
                    morningDot.style.borderRadius = '50%';
                    morningDot.style.display = 'inline-block';
                    indicatorsContainer.appendChild(morningDot);
                }
                
                // Tarkista onko iltamerkintä
                if (dayEntries.some(entry => entry.time_of_day === 'evening')) {
                    const eveningDot = document.createElement('span');
                    eveningDot.classList.add('evening-indicator');
                    eveningDot.style.width = '5px';
                    eveningDot.style.height = '5px';
                    eveningDot.style.borderRadius = '50%';
                    eveningDot.style.display = 'inline-block';
                    indicatorsContainer.appendChild(eveningDot);
                }
                
                dayElement.appendChild(indicatorsContainer);
            }
        }

        // Lisää tapahtumakäsittelijä päivälle
        dayElement.addEventListener('click', function() {
            selectDate(this);
        });
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
            return;
        }
        
        const user = JSON.parse(userData);
        const token = user.token;
        
        if (!token) {
            console.error('Token puuttuu käyttäjätiedoista');
            return;
        }
        
        // Haetaan käyttäjän merkinnät
        const response = await fetch('http://localhost:5000/api/entries/user/' + user.userId, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Merkintöjen haku epäonnistui: ' + response.status);
        }
        
        const entries = await response.json();
        console.log('Käyttäjän merkinnät haettu:', entries);
        
        // Tallennetaan merkinnät globaaliin muuttujaan, jotta ne ovat saatavilla kalenterille
        window.userEntries = entries;
        
        // Päivitä kalenteri näyttämään merkinnät
        const [year, month] = getCurrentYearMonth();
        updateCalendar(year, month);
        
    } catch (error) {
        console.error('Virhe merkintöjen haussa:', error);
        document.getElementById('calendar-notification').textContent = 'Merkintöjen haku epäonnistui';
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
    
    // Lähetä päivämäärän valinnan tapahtuma
    const dateChangedEvent = new CustomEvent('selectedDateChanged', {
        detail: {
            date: selectedDate,
            entries: entries
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
    return [
        parseInt(calendarContainer.dataset.year),
        parseInt(calendarContainer.dataset.month)
    ];
}