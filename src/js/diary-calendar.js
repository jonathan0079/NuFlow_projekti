document.addEventListener('DOMContentLoaded', function() {
    initializeCalendar();
    const today = new Date();
    updateCalendar(today.getFullYear(), today.getMonth());
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

    // Oletetaan, että kalenterissa on seuraavat osat jo olemassa:
    // - header
    // - grid
    // - legend
    // - notification

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

    // Lisää kalenterin legenda
    const calendarLegend = document.createElement('div');
    calendarLegend.classList.add('calendar-legend');
    
    const morningLegend = document.createElement('div');
    morningLegend.classList.add('legend-item');
    const morningIndicator = document.createElement('span');
    morningIndicator.classList.add('legend-indicator', 'morning-indicator');
    morningLegend.appendChild(morningIndicator);
    morningLegend.appendChild(document.createTextNode('Aamu'));

    const eveningLegend = document.createElement('div');
    eveningLegend.classList.add('legend-item');
    const eveningIndicator = document.createElement('span');
    eveningIndicator.classList.add('legend-indicator', 'evening-indicator');
    eveningLegend.appendChild(eveningIndicator);
    eveningLegend.appendChild(document.createTextNode('Ilta'));

    calendarLegend.appendChild(morningLegend);
    calendarLegend.appendChild(eveningLegend);
    calendarContainer.appendChild(calendarLegend);

    // Lisää ilmoitusalue
    const notification = document.createElement('div');
    notification.id = 'calendar-notification';
    notification.style.textAlign = 'center';
    notification.style.marginTop = '10px';
    notification.style.color = '#666';
    notification.style.fontSize = '0.9em';
    calendarContainer.appendChild(notification);

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
        while (day.firstChild) {
            day.removeChild(day.firstChild);
        }
    });

    let firstDayIndex = firstDay.getDay() - 1;
    if (firstDayIndex < 0) firstDayIndex = 6;

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    for (let i = 0; i < totalDays; i++) {
        const dayElement = dayElements[firstDayIndex + i];
        const dayNumber = i + 1;

        const dayNumberSpan = document.createElement('span');
        dayNumberSpan.textContent = dayNumber;
        dayElement.appendChild(dayNumberSpan);

        dayElement.classList.add('current-month');

        const monthStr = (month + 1).toString().padStart(2, '0');
        const dayStr = dayNumber.toString().padStart(2, '0');
        const dateStr = `${year}-${monthStr}-${dayStr}`;
        dayElement.dataset.date = dateStr;

        if (isCurrentMonth && today.getDate() === dayNumber) {
            dayElement.classList.add('today');
        }

        dayElement.addEventListener('click', function() {
            selectDate(this);
        });
    }

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

