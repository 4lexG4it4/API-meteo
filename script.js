async function getWeather() {
    const city = document.getElementById("city").value;
    if (!city) {
        alert("Inserisci un nome di città valido!");
        return;
    }

    try {
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            alert("Città non trovata. Riprova con un altro nome.");
            return;
        }

        const { latitude, longitude } = geoData.results[0];
        const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation,weathercode&timezone=auto`;
        const response = await fetch(API_URL);
        const data = await response.json();

        displayForecast(data.hourly);
    } catch (error) {
        console.error("Errore durante la richiesta:", error);
        alert("Si è verificato un errore. Riprova più tardi.");
    }
}

function displayForecast(hourlyData) {
    const forecastDiv = document.getElementById("forecast");
    forecastDiv.innerHTML = "";

    if (!hourlyData || !hourlyData.time || !hourlyData.temperature_2m || !hourlyData.precipitation || !hourlyData.weathercode) {
        forecastDiv.innerHTML = "<p class='text-center'>Nessuna previsione disponibile.</p>";
        return;
    }

    const hours = hourlyData.time;
    const temperatures = hourlyData.temperature_2m;
    const precipitations = hourlyData.precipitation;
    const weatherCodes = hourlyData.weathercode;

    const weatherDescriptions = {
        0: "Soleggiato",
        1: "Prevalentemente soleggiato",
        2: "Parzialmente nuvoloso",
        3: "Nuvoloso",
        45: "Nebbia leggera",
        48: "Nebbia",
        51: "Pioviggine leggera",
        53: "Pioviggine moderata",
        55: "Pioviggine intensa",
        61: "Pioggia leggera",
        63: "Pioggia moderata",
        65: "Pioggia intensa",
        71: "Neve leggera",
        73: "Neve moderata",
        75: "Neve intensa",
        95: "Temporale",
        96: "Temporale con grandine"
    };

    const groupedByWeek = {};
    const today = new Date();

    for (let i = 0; i < hours.length; i++) {
        const date = new Date(hours[i]);
        if (!hours[i] || !temperatures[i] || !precipitations[i] || weatherCodes[i] === undefined) continue;

        const weekDay = date.toLocaleDateString("it-IT", { weekday: "long" });
        const isToday = date.getDate() === today.getDate() &&
                        date.getMonth() === today.getMonth() &&
                        date.getFullYear() === today.getFullYear();

        const groupKey = isToday ? "Oggi" : capitalizeFirstLetter(weekDay);

        if (!groupedByWeek[groupKey]) groupedByWeek[groupKey] = [];

        groupedByWeek[groupKey].push({
            time: date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
            temperature: temperatures[i],
            precipitation: precipitations[i],
            weatherDescription: weatherDescriptions[weatherCodes[i]] || "Condizioni sconosciute"
        });
    }

    if (Object.keys(groupedByWeek).length === 0) {
        forecastDiv.innerHTML = "<p class='text-center'>Nessuna previsione disponibile.</p>";
        return;
    }

    for (const [weekDay, data] of Object.entries(groupedByWeek)) {
        const dayDiv = document.createElement("div");
        dayDiv.classList.add("mb-4");

        dayDiv.innerHTML = `
            <h3>${weekDay}</h3>
            <table class="table table-striped table-bordered">
                <thead>
                    <tr>
                        <th>Ora</th>
                        <th>Temperatura (°C)</th>
                        <th>Precipitazioni (mm)</th>
                        <th>Condizioni Meteo</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(row => `
                        <tr>
                            <td>${row.time}</td>
                            <td>${row.temperature}</td>
                            <td>${row.precipitation}</td>
                            <td>${row.weatherDescription}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        forecastDiv.appendChild(dayDiv);
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}
