const numbersContainer = document.querySelector('.numbers');
const generateButton = document.getElementById('generate');
const themeToggle = document.getElementById('theme-toggle');
const bgUpload = document.getElementById('bg-upload');
const storageKey = 'preferred-theme';
const backgroundKey = 'background-image';
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

// Initial generation
setTheme(getInitialTheme());
const savedBackground = localStorage.getItem(backgroundKey);
if (savedBackground) {
    root.style.setProperty('--bg-image', `url("${savedBackground}")`);
}
handleGenerateClick();
