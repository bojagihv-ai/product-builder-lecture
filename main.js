const numbersContainer = document.querySelector('.numbers');
const generateButton = document.getElementById('generate');

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

// Initial generation
handleGenerateClick();