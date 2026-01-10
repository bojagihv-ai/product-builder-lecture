const numbersContainer = document.querySelector('.numbers');
const generateButton = document.getElementById('generate');
const themeToggle = document.getElementById('theme-toggle');
const bgUpload = document.getElementById('bg-upload');
const weatherEl = document.getElementById('weather');
const citySelect = document.getElementById('city-select');
const refreshInput = document.getElementById('refresh-interval');
const storageKey = 'preferred-theme';
const backgroundKey = 'background-image';
const weatherRefreshKey = 'weather-refresh-minutes';
const cityKey = 'weather-city';
const defaultLocation = {
    name: 'Seoul',
    latitude: 37.5665,
    longitude: 126.9780,
};
const root = document.documentElement;
let weatherIntervalId = null;

function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
}

function getInitialTheme() {
    const savedTheme = localStorage.getItem(storageKey);
    if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function toggleTheme() {
    const nextTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem(storageKey, nextTheme);
    setTheme(nextTheme);
}

function generateLottoNumbers() {
    const numbers = new Set();
    while (numbers.size < 6) {
        numbers.add(Math.floor(Math.random() * 45) + 1);
    }
    return Array.from(numbers).sort((a, b) => a - b);
}

function displayNumbers(numbers) {
    numbersContainer.innerHTML = '';
    numbers.forEach((number, index) => {
        const numberDiv = document.createElement('div');
        numberDiv.className = 'number';
        numberDiv.textContent = number;
        numberDiv.style.animationDelay = `${index * 120}ms`;
        setTimeout(() => {
            numbersContainer.appendChild(numberDiv);
        }, index * 120);
    });
}

function handleGenerateClick() {
    const numbers = generateLottoNumbers();
    displayNumbers(numbers);
}

generateButton.addEventListener('click', handleGenerateClick);
themeToggle.addEventListener('click', toggleTheme);
bgUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        const dataUrl = reader.result;
        root.style.setProperty('--bg-image', `url("${dataUrl}")`);
        localStorage.setItem(backgroundKey, dataUrl);
    };
    reader.readAsDataURL(file);
});

function updateWeatherStatus(message) {
    weatherEl.textContent = message;
}

function fetchWeather(latitude, longitude) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&timezone=auto`;
    return fetch(url)
        .then((response) => response.json())
        .then((data) => {
            const temp = data?.current?.temperature_2m;
            const humidity = data?.current?.relative_humidity_2m;
            const feelsLike = data?.current?.apparent_temperature;
            const code = data?.current?.weather_code;
            const unit = data?.current_units?.temperature_2m || '°C';
            if (
                typeof temp !== 'number' ||
                typeof humidity !== 'number' ||
                typeof feelsLike !== 'number' ||
                typeof code !== 'number'
            ) {
                throw new Error('Temperature not available');
            }
            return {
                temp: `${temp}${unit}`,
                humidity: `${humidity}%`,
                feelsLike: `${feelsLike}${unit}`,
                code,
            };
        });
}

function weatherIcon(code) {
    if (code === 0) return '☀️';
    if (code === 1 || code === 2) return '🌤️';
    if (code === 3) return '☁️';
    if (code >= 45 && code <= 48) return '🌫️';
    if (code >= 51 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '🌨️';
    if (code >= 80 && code <= 82) return '🌦️';
    if (code >= 85 && code <= 86) return '🌨️';
    if (code >= 95 && code <= 99) return '⛈️';
    return '🌡️';
}

function renderWeather(locationName, weather) {
    const icon = weatherIcon(weather.code);
    updateWeatherStatus(
        `${icon} ${locationName}: ${weather.temp} (Feels like ${weather.feelsLike}) · Humidity ${weather.humidity}`
    );
}

function loadTemperatureWithCoords(latitude, longitude, locationName) {
    updateWeatherStatus('Fetching temperature...');
    fetchWeather(latitude, longitude)
        .then((weather) => {
            renderWeather(locationName, weather);
        })
        .catch(() => {
            updateWeatherStatus('Unable to load temperature.');
        });
}

function parseCityValue(value) {
    const [lat, lon] = value.split(',').map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return null;
    }
    return { latitude: lat, longitude: lon };
}

function loadTemperatureForCity() {
    const selected = citySelect.options[citySelect.selectedIndex];
    const coords = parseCityValue(citySelect.value);
    if (!coords) {
        updateWeatherStatus('Unable to load temperature.');
        return;
    }
    loadTemperatureWithCoords(coords.latitude, coords.longitude, selected.textContent);
}

function setRefreshInterval(minutes) {
    const safeMinutes = Math.min(Math.max(minutes, 1), 120);
    refreshInput.value = String(safeMinutes);
    localStorage.setItem(weatherRefreshKey, String(safeMinutes));
    if (weatherIntervalId) {
        clearInterval(weatherIntervalId);
    }
    weatherIntervalId = setInterval(loadTemperatureForCity, safeMinutes * 60 * 1000);
}

citySelect.addEventListener('change', () => {
    localStorage.setItem(cityKey, citySelect.value);
    loadTemperatureForCity();
});

refreshInput.addEventListener('change', () => {
    const minutes = Number(refreshInput.value);
    if (!Number.isFinite(minutes)) {
        return;
    }
    setRefreshInterval(minutes);
});

// Initial generation
setTheme(getInitialTheme());
const savedBackground = localStorage.getItem(backgroundKey);
if (savedBackground) {
    root.style.setProperty('--bg-image', `url("${savedBackground}")`);
}
const savedCity = localStorage.getItem(cityKey);
if (savedCity) {
    citySelect.value = savedCity;
}
const savedRefresh = Number(localStorage.getItem(weatherRefreshKey));
setRefreshInterval(Number.isFinite(savedRefresh) ? savedRefresh : Number(refreshInput.value));
loadTemperatureForCity();
handleGenerateClick();
