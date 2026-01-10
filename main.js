const numbersContainer = document.querySelector('.numbers');
const generateButton = document.getElementById('generate');
const themeToggle = document.getElementById('theme-toggle');
const bgUpload = document.getElementById('bg-upload');
const weatherEl = document.getElementById('weather');
const storageKey = 'preferred-theme';
const backgroundKey = 'background-image';
const defaultLocation = {
    name: 'Seoul',
    latitude: 37.5665,
    longitude: 126.9780,
};
const weatherRefreshMs = 10 * 60 * 1000;
const root = document.documentElement;

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
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature&timezone=auto`;
    return fetch(url)
        .then((response) => response.json())
        .then((data) => {
            const temp = data?.current?.temperature_2m;
            const humidity = data?.current?.relative_humidity_2m;
            const feelsLike = data?.current?.apparent_temperature;
            const unit = data?.current_units?.temperature_2m || '°C';
            if (typeof temp !== 'number' || typeof humidity !== 'number' || typeof feelsLike !== 'number') {
                throw new Error('Temperature not available');
            }
            return {
                temp: `${temp}${unit}`,
                humidity: `${humidity}%`,
                feelsLike: `${feelsLike}${unit}`,
            };
        });
}

function renderWeather(locationName, weather) {
    updateWeatherStatus(
        `${locationName}: ${weather.temp} (Feels like ${weather.feelsLike}) · Humidity ${weather.humidity}`
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

function loadTemperature() {
    if (!navigator.geolocation) {
        loadTemperatureWithCoords(
            defaultLocation.latitude,
            defaultLocation.longitude,
            defaultLocation.name
        );
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            loadTemperatureWithCoords(latitude, longitude, 'Your location');
        },
        () => {
            loadTemperatureWithCoords(
                defaultLocation.latitude,
                defaultLocation.longitude,
                defaultLocation.name
            );
        },
        { timeout: 10000 }
    );
}

// Initial generation
setTheme(getInitialTheme());
const savedBackground = localStorage.getItem(backgroundKey);
if (savedBackground) {
    root.style.setProperty('--bg-image', `url("${savedBackground}")`);
}
loadTemperature();
setInterval(loadTemperature, weatherRefreshMs);
handleGenerateClick();
