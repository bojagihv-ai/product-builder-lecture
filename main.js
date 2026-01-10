const numbersContainer = document.querySelector('.numbers');
const generateButton = document.getElementById('generate');
const themeToggle = document.getElementById('theme-toggle');
const storageKey = 'preferred-theme';
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
    for (const number of numbers) {
        const numberDiv = document.createElement('div');
        numberDiv.className = 'number';
        numberDiv.textContent = number;
        numbersContainer.appendChild(numberDiv);
    }
}

function handleGenerateClick() {
    const numbers = generateLottoNumbers();
    displayNumbers(numbers);
}

generateButton.addEventListener('click', handleGenerateClick);
themeToggle.addEventListener('click', toggleTheme);

// Initial generation
setTheme(getInitialTheme());
handleGenerateClick();
