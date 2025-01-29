
// Ottimizzazione del codice JavaScript
const weatherCache = new Map();

document.addEventListener("DOMContentLoaded", () => {
    // Mostra l'ora corrente
    const currentTimeElement = document.getElementById("current-time");
    setInterval(() => {
        const now = new Date();
        currentTimeElement.textContent = now.toLocaleTimeString("it-IT", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    }, 1000);
});

async function getWeather() {
    const city = document.getElementById("city").value.trim().toLowerCase();
    if (!city) {
        alert("Inserisci un nome di città valido!");
        return;
    }

    const forecastContainers = document.getElementById("forecast-containers");
    forecastContainers.classList.add("d-none"); // Nascondi i container inizialmente

    if (weatherCache.has(city)) {
        displayForecast(weatherCache.get(city));
        return;
    }

    try {
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`);
        const geoData = await geoResponse.json();

        if (!geoData.results || !geoData.results.length) {
            alert("Città non trovata. Riprova con un altro nome.");
            return;
        }

        const { latitude, longitude } = geoData.results[0];
        const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation,weathercode&daily=temperature_2m_min,temperature_2m_max,weathercode&timezone=auto`;
        const response = await fetch(API_URL);
        const data = await response.json();

        weatherCache.set(city, data);
        displayForecast(data);
    } catch (error) {
        console.error("Errore durante la richiesta:", error);
        alert("Si è verificato un errore. Riprova più tardi.");
    }
}

function displayForecast(data) {
    const forecastContainers = document.getElementById("forecast-containers");
    forecastContainers.classList.remove("d-none"); // Mostra i container

    displayTodayForecast(data.hourly);
    displayWeeklyForecast(data.daily);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
}

function displayTodayForecast(hourlyData) {
    const todayDiv = document.getElementById("today-forecast");
    todayDiv.innerHTML = "";

    if (!hourlyData || !hourlyData.time || !hourlyData.temperature_2m) {
        todayDiv.innerHTML = "<p>Nessuna previsione disponibile per oggi.</p>";
        return;
    }

    const today = new Date();
    const todayData = hourlyData.time.map((time, index) => {
        const date = new Date(time);
        if (date.getDate() === today.getDate() && date.getMonth() === today.getMonth()) {
            return {
                time: date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
                temperature: hourlyData.temperature_2m[index],
                weatherCode: hourlyData.weathercode[index]
            };
        }
    }).filter(Boolean);

    const timeline = todayData.map(entry => `
        <div class='hour-item'>
            <p class='hour-time'>${entry.time}</p>
            <p class='hour-weather'>${entry.temperature}°C</p>
        </div>`).join('');

    todayDiv.innerHTML = `
        <h2>Meteo di Oggi</h2>
        <div class='timeline-container'>
            <div class='timeline'>
                ${timeline}
            </div>
        </div>`;
}

function displayWeeklyForecast(dailyData) {
    const weeklyDiv = document.getElementById("weekly-forecast");
    weeklyDiv.innerHTML = "";

    if (!dailyData || !dailyData.time || !dailyData.temperature_2m_min || !dailyData.temperature_2m_max) {
        weeklyDiv.innerHTML = "<p>Nessuna previsione settimanale disponibile.</p>";
        return;
    }

    const weekDays = dailyData.time.map((time, index) => {
        return {
            day: formatDate(time),
            minTemp: dailyData.temperature_2m_min[index],
            maxTemp: dailyData.temperature_2m_max[index],
            weatherCode: dailyData.weathercode[index]
        };
    });

    const weekCards = weekDays.map(day => `
        <div class='day-card'>
            <h3 style='color: #007bff;'>${day.day}</h3>
            <p>Min: ${day.minTemp}°C</p>
            <p>Max: ${day.maxTemp}°C</p>
        </div>`).join('');

    weeklyDiv.innerHTML = `
        <h2>Previsioni Settimanali</h2>
        <div class='week-grid'>
            ${weekCards}
        </div>`;
}