// Kalenterin toiminnallisuus - käyttää olemassa olevia backend-reittejä
document.addEventListener('DOMContentLoaded', function() {
    // Luodaan kalenteri oikealle puolelle
    createCalendar();
    
    // Alustetaan kalenteri nykyiselle kuukaudelle
    const today = new Date();
    updateCalendar(today.getFullYear(), today.getMonth());
});

/**
 * Luo kalenterielementin lomakkeen oikealle puolelle
 */
function createCalendar() {
    // Haetaan main-elementti
    const mainElement = document.querySelector('main');
    if (!mainElement) return;
    
    // Luodaan kalenterielementti
    const calendarContainer = document.createElement('div');
    calendarContainer.id = 'calendar-container';
    calendarContainer.className = 'calendar-container';
    
    // Lisätään kalenteri main-elementin loppuun
    mainElement.appendChild(calendarContainer);
    
    // Luodaan kalenterin sisältö
    calendarContainer.innerHTML = `
        <div class="calendar-header">
            <button id="prev-month" class="month-nav-button">←</button>
            <h2 id="month-year">Huhtikuu 2025</h2>
            <button id="next-month" class="month-nav-button">→</button>
        </div>
        <div id="calendar-grid" class="calendar-grid">
            <div class="calendar-day-header">Ma</div>
            <div class="calendar-day-header">Ti</div>
            <div class="calendar-day-header">Ke</div>
            <div class="calendar-day-header">To</div>
            <div class="calendar-day-header">Pe</div>
            <div class="calendar-day-header">La</div>
            <div class="calendar-day-header">Su</div>
            ${Array(42).fill('<div class="calendar-day"></div>').join('')}
        </div>
        <div class="calendar-legend">
            <div class="legend-item">
                <span class="legend-indicator morning-indicator"></span>
                <span>Aamu</span>
            </div>
            <div class="legend-item">
                <span class="legend-indicator evening-indicator"></span>
                <span>Ilta</span>
            </div>
        </div>
        <div id="calendar-notification" style="text-align: center; margin-top: 10px; color: #666; font-size: 0.9em;"></div>
    `;
    
    // Lisätään tapahtumankäsittelijät
    document.getElementById('prev-month').addEventListener('click', function() {
        const [year, month] = getCurrentYearMonth();
        const newDate = new Date(year, month - 1, 1);
        updateCalendar(newDate.getFullYear(), newDate.getMonth());
    });
    
    document.getElementById('next-month').addEventListener('click', function() {
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
    // Asetetaan kuukauden ja vuoden näyttö
    const monthNames = [
        'Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu', 'Toukokuu', 'Kesäkuu', 
        'Heinäkuu', 'Elokuu', 'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu'
    ];
    document.getElementById('month-year').textContent = `${monthNames[month]} ${year}`;
    
    // Tallennetaan nykyinen vuosi ja kuukausi data-attribuutteihin
    const calendarContainer = document.getElementById('calendar-container');
    calendarContainer.dataset.year = year;
    calendarContainer.dataset.month = month;
    
    // Haetaan kuukauden ensimmäinen ja viimeinen päivä
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    
    // Haetaan kaikki päiväelementit kalenterissa (ohitetaan viikonpäivien otsikot)
    const dayElements = document.querySelectorAll('.calendar-day');
    
    // Tyhjennetään aiemmat päivät
    dayElements.forEach(day => {
        day.textContent = '';
        day.style.backgroundColor = '';
        day.classList.remove('current-month', 'today', 'selected');
        day.removeAttribute('data-date');
        // Poistetaan kaikki lapsielementit (kuten merkinnät)
        while (day.firstChild) {
            day.removeChild(day.firstChild);
        }
    });
    
    // Lasketaan ensimmäisen päivän indeksi (0 = maanantai, 6 = sunnuntai ruudukossamme)
    // JavaScriptin getDay() palauttaa 0 sunnuntaille, joten säädämme sen
    let firstDayIndex = firstDay.getDay() - 1;
    if (firstDayIndex < 0) firstDayIndex = 6; // Jos on sunnuntai (0 - 1 = -1), asetetaan 6
    
    // Täytetään kalenteri oikeilla päivillä
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    
    for (let i = 0; i < totalDays; i++) {
        const dayElement = dayElements[firstDayIndex + i];
        const dayNumber = i + 1;
        
        // Luodaan päivänumeron näyttävä span
        const dayNumberSpan = document.createElement('span');
        dayNumberSpan.textContent = dayNumber;
        dayElement.appendChild(dayNumberSpan);
        
        dayElement.classList.add('current-month');
        
        // Muotoillaan päivämäärä muotoon YYYY-MM-DD
        const monthStr = (month + 1).toString().padStart(2, '0');
        const dayStr = dayNumber.toString().padStart(2, '0');
        const dateStr = `${year}-${monthStr}-${dayStr}`;
        dayElement.dataset.date = dateStr;
        
        // Korostetaan nykyinen päivä
        if (isCurrentMonth && today.getDate() === dayNumber) {
            dayElement.classList.add('today');
        }
        
        // Asetetaan klikkauskäsittelijä päivän valitsemiseksi
        dayElement.addEventListener('click', function() {
            selectDate(this);
        });
    }
    
    // Haetaan kirjaukset tälle kuukaudelle, käyttäen käyttäjän ID:tä
    fetchUserEntries();
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

/**
 * Valitsee päivämäärän kalenterissa ja hakee sen päivän kirjaukset
 * @param {HTMLElement} dayElement - Klikattu päiväelementti
 */
function selectDate(dayElement) {
    // Poistetaan aiempi valinta
    document.querySelectorAll('.calendar-day.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Merkitään uusi valinta
    dayElement.classList.add('selected');
    
    // Näytetään ilmoitus, että haetaan tietoja
    showCalendarNotification('Haetaan päivän tietoja...');
    
    // Haetaan valitun päivän kirjaukset
    const selectedDate = dayElement.dataset.date;
    
    // Käyttäjän kirjaukset on jo haettu fetchUserEntries-funktiossa
    // Suodatetaan valitun päivän kirjaukset ja täytetään lomake
    const userEntries = window.userEntries || [];
    const dayEntries = userEntries.filter(entry => entry.entry_date === selectedDate);
    
    // Lähetetään tapahtuma diary.js-tiedostolle
    const selectedDateEvent = new CustomEvent('selectedDateChanged', {
        detail: {
            date: selectedDate,
            entries: dayEntries
        }
    });
    window.dispatchEvent(selectedDateEvent);
    
    if (dayEntries && dayEntries.length > 0) {
        showCalendarNotification(`Päivän ${selectedDate} kirjaukset ladattu`, 'success');
    } else {
        showCalendarNotification(`Ei kirjauksia päivälle ${selectedDate}`, 'info');
    }
}

/**
 * Näyttää ilmoituksen kalenterissa
 * @param {string} message - Ilmoitusteksti
 * @param {string} type - Ilmoituksen tyyppi (info, success, error)
 */
function showCalendarNotification(message, type = 'info') {
    const notification = document.getElementById('calendar-notification');
    if (!notification) return;
    
    notification.textContent = message;
    
    // Asetetaan väri tyypin mukaan
    if (type === 'error') {
        notification.style.color = '#e53935';
    } else if (type === 'success') {
        notification.style.color = '#43a047';
    } else {
        notification.style.color = '#666';
    }
    
    // Tyhjennetään ilmoitus automaattisesti 3 sekunnin kuluttua
    setTimeout(() => {
        if (notification.textContent === message) {
            notification.textContent = '';
        }
    }, 3000);
}

/**
 * Hakee kirjautuneen käyttäjän kaikki kirjaukset
 * (Käyttää olemassa olevaa backend-reittiä: /api/entries/user/:id)
 */
function fetchUserEntries() {
    // Tarkistetaan, onko käyttäjä kirjautunut
    const userJson = localStorage.getItem('user');
    if (!userJson) {
        showCalendarNotification('Kirjaudu ensin sisään nähdäksesi kirjaukset', 'error');
        return;
    }
    
    const user = JSON.parse(userJson);
    if (!user || !user.token) {
        showCalendarNotification('Kirjautumistiedot puuttuvat', 'error');
        return;
    }
    
    // Haetaan käyttäjän ID lokaalista varastosta - muokattu tämä rivi
    const userId = user.user_id || user.id || user.userId;
    if (!userId) {
        showCalendarNotification('Käyttäjätunnus puuttuu', 'error');
        return;
    }
    
    console.log(`Haetaan käyttäjän ${userId} kirjaukset`);
    
    // Käytetään olemassa olevaa backend-reittiä kaikille käyttäjän kirjauksille
    fetch(`/api/entries/user/${userId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Kirjausten hakeminen epäonnistui');
        }
        return response.json();
    })
    .then(entries => {
        console.log('Käyttäjän kirjaukset:', entries);
        
        // Tallennetaan kirjaukset ikkunaobjektiin myöhempää käyttöä varten
        window.userEntries = entries;
        
        // Merkitään kalenteriin päivät, joilla on kirjauksia
        markDaysWithEntries(entries);
    })
    .catch(error => {
        console.error('Virhe kirjausten hakemisessa:', error);
        showCalendarNotification('Kirjausten hakeminen epäonnistui', 'error');
    });
}

/**
 * Merkitsee kalenteriin päivät, joilla on kirjauksia
 * @param {Array} entries - Kirjaukset
 */
function markDaysWithEntries(entries) {
    if (!entries || entries.length === 0) return;
    
    // Käydään läpi kalenterin päivät
    const dayElements = document.querySelectorAll('.calendar-day[data-date]');
    
    dayElements.forEach(dayElement => {
        const dateStr = dayElement.dataset.date;
        
        // Suodatetaan kirjaukset tälle päivälle
        const dayEntries = entries.filter(entry => entry.entry_date === dateStr);
        
        if (dayEntries.length > 0) {
            // Luodaan merkintäkontaineri
            const indicatorsContainer = document.createElement('div');
            indicatorsContainer.style.display = 'flex';
            indicatorsContainer.style.justifyContent = 'center';
            indicatorsContainer.style.gap = '3px';
            indicatorsContainer.style.marginTop = '3px';
            
            // Tarkistetaan, onko aamukirjauksia
            const hasMorningEntry = dayEntries.some(entry => entry.time_of_day === 'morning');
            if (hasMorningEntry) {
                const morningIndicator = document.createElement('img');
                morningIndicator.src = '/src/img/morning_icon.png'; // Oletettu polku aamukuvakkeelle
                morningIndicator.alt = 'Aamu';
                morningIndicator.style.width = '12px';
                morningIndicator.style.height = '12px';
                morningIndicator.onerror = function() {
                    // Jos kuvaa ei löydy, näytetään väripallo sen sijaan
                    this.onerror = null;
                    this.remove();
                    const fallbackIndicator = document.createElement('span');
                    fallbackIndicator.style.display = 'inline-block';
                    fallbackIndicator.style.width = '8px';
                    fallbackIndicator.style.height = '8px';
                    fallbackIndicator.style.backgroundColor = '#F9A825'; // Keltainen väri aamulle
                    fallbackIndicator.style.borderRadius = '50%';
                    indicatorsContainer.appendChild(fallbackIndicator);
                };
                indicatorsContainer.appendChild(morningIndicator);
            }
            
            // Tarkistetaan, onko iltakirjauksia
            const hasEveningEntry = dayEntries.some(entry => entry.time_of_day === 'evening');
            if (hasEveningEntry) {
                const eveningIndicator = document.createElement('img');
                eveningIndicator.src = '/src/img/evening_icon.png'; // Oletettu polku iltakuvakkeelle
                eveningIndicator.alt = 'Ilta';
                eveningIndicator.style.width = '12px';
                eveningIndicator.style.height = '12px';
                eveningIndicator.onerror = function() {
                    // Jos kuvaa ei löydy, näytetään väripallo sen sijaan
                    this.onerror = null;
                    this.remove();
                    const fallbackIndicator = document.createElement('span');
                    fallbackIndicator.style.display = 'inline-block';
                    fallbackIndicator.style.width = '8px';
                    fallbackIndicator.style.height = '8px';
                    fallbackIndicator.style.backgroundColor = '#7E57C2'; // Violetti väri illalle
                    fallbackIndicator.style.borderRadius = '50%';
                    indicatorsContainer.appendChild(fallbackIndicator);
                };
                indicatorsContainer.appendChild(eveningIndicator);
            }
            
            dayElement.appendChild(indicatorsContainer);
        }
    });
}