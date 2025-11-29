document.addEventListener('DOMContentLoaded', () => {
    let puzzleData = null;
    let selectedCell = null;
    let userAnswers = {};
    let lastClickedCell = null;
    let isSolutionCorrect = false;
    let currentHighlightedWord = null;

    // Disable submit button initially
    const submitButton = document.getElementById('submit-button');
    submitButton.disabled = true;

    // Load saved state from localStorage with error handling
    try {
        const savedState = localStorage.getItem('puzzleState');
        if (savedState) {
            userAnswers = JSON.parse(savedState);
        }
    } catch (e) {
        // Clear corrupted state
        localStorage.removeItem('puzzleState');
        userAnswers = {};
    }

    // Fetch puzzle data (static deployment path)
    fetch('../data/puzzle2024.json')
        .then(response => response.json())
        .then(data => {
            // Transform coordinates from bottom-left to top-left
            data.cells = data.cells.map(cell => ({
                ...cell,
                x: cell.x,
                y: 11 - cell.y // Transform Y coordinate
            }));
            data.words = data.words.map(word => ({
                ...word,
                startX: word.startX,
                startY: 11 - word.startY, // Transform Y coordinate for words too
                direction: word.direction.toLowerCase() // Ensure consistent case
            }));
            puzzleData = data;
            initializePuzzle();
        })
        .catch(error => {
            document.getElementById('crossword-grid').innerHTML = 
                '<p style="color:red;padding:20px;">Virhe ristikon latauksessa. Lataa sivu uudelleen.</p>';
        });

    // Solution word coordinates (obfuscated for security)
    const SOLUTION_COORDS = [
        {x: 7, y: 0},
        {x: 3, y: 2},
        {x: 8, y: 2},
        {x: 4, y: 5},
        {x: 6, y: 6},
        {x: 0, y: 8},
        {x: 9, y: 11}
    ];
    // Obfuscated solution (base64 encoded, reversed)
    const _s = atob('SVBQQU5JUw==').split('').reverse().join('');

    function initializePuzzle() {
        const grid = document.getElementById('crossword-grid');
        if (!grid) {
            return;
        }
        grid.innerHTML = '';
        
        // Create cells
        puzzleData.cells.forEach(cell => {
            const cellElement = createCell(cell);
            grid.appendChild(cellElement);
        });
    }

    function createCell(cell) {
        const cellElement = document.createElement('div');
        cellElement.className = 'cell';
        cellElement.dataset.x = cell.x;
        cellElement.dataset.y = cell.y;
        
        if (!cell.isBlocked && cell.letter.trim() !== '') {
            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = 1;
            input.autocomplete = 'off';
            input.spellcheck = false;
            input.setAttribute('inputmode', 'text');
            input.setAttribute('pattern', '[A-Za-z]');
            input.style.caretColor = 'transparent';
            
            // Load saved answer if exists
            const key = `${cell.x},${cell.y}`;
            if (userAnswers[key]) {
                input.value = userAnswers[key];
            }
            
            // Handle character input first
            input.addEventListener('beforeinput', function(event) {
                if (event.data && !/^[A-Za-z]$/.test(event.data)) {
                    event.preventDefault();
                }
            });
            
            input.addEventListener('input', function(event) {
                if (event.target.value) {
                    const value = event.target.value.toUpperCase();
                    event.target.value = value;
                    userAnswers[key] = value;
                    localStorage.setItem('puzzleState', JSON.stringify(userAnswers));
                    
                    // Wait for the value to be set before moving
                    requestAnimationFrame(() => {
                        const nextCell = findNextCell(cell);
                        if (nextCell) {
                            const nextInput = nextCell.querySelector('input');
                            if (nextInput) nextInput.focus();
                        }
                    });
                } else {
                    delete userAnswers[key];
                    localStorage.setItem('puzzleState', JSON.stringify(userAnswers));
                }
            });
            
            // Handle navigation after input is processed
            input.addEventListener('keydown', function(event) {
                if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || 
                    (event.key === 'Backspace' && !event.target.value)) {
                    handleKeyNavigation(event, cell);
                }
            });
            
            cellElement.appendChild(input);
            
            // Add click handler to cell
            cellElement.addEventListener('click', (event) => {
                handleCellClick(event, cell);
                input.focus();
            });
        }
        
        if (cell.isBlocked) {
            cellElement.classList.add('blocked');
        }
        
        cellElement.style.left = `${cell.x * 10}%`;  // Each cell is 10% wide
        cellElement.style.top = `${cell.y * 8.33}%`;  // Each cell is 1/12 of height

        return cellElement;
    }

    function handleCellClick(event, cell) {
        const x = cell.x;
        const y = cell.y;

        // Clear previous highlights
        document.querySelectorAll('.cell').forEach(cellEl => {
            cellEl.classList.remove('word-highlight');
            cellEl.classList.remove('selected');
        });

        // Add selected class to clicked cell
        const clickedCellElement = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
        if (clickedCellElement) {
            clickedCellElement.classList.add('selected');
        }

        // Find words that contain this cell
        const wordsAtPoint = puzzleData.words.filter(word => {
            if (word.direction === 'across') {
                return y === word.startY && x >= word.startX && x < (word.startX + word.length);
            } else { // down
                return x === word.startX && y >= word.startY && y < (word.startY + word.length);
            }
        });

        if (wordsAtPoint.length === 0) return;

        // If there's only one word or if this is a different cell, highlight first word
        if (!lastClickedCell || wordsAtPoint.length === 1 || 
            lastClickedCell.x !== x || lastClickedCell.y !== y) {
            currentHighlightedWord = wordsAtPoint[0];
        } else {
            // Toggle between words at the same cell
            const currentIndex = wordsAtPoint.findIndex(w => w.wordindex === currentHighlightedWord.wordindex);
            currentHighlightedWord = wordsAtPoint[(currentIndex + 1) % wordsAtPoint.length];
        }

        // Highlight the current word
        if (currentHighlightedWord.direction === 'across') {
            for (let i = 0; i < currentHighlightedWord.length; i++) {
                const cellToHighlight = document.querySelector(
                    `.cell[data-x="${currentHighlightedWord.startX + i}"][data-y="${currentHighlightedWord.startY}"]`
                );
                if (cellToHighlight && cellToHighlight !== clickedCellElement) {
                    cellToHighlight.classList.add('word-highlight');
                }
            }
        } else { // down
            for (let i = 0; i < currentHighlightedWord.length; i++) {
                const cellToHighlight = document.querySelector(
                    `.cell[data-x="${currentHighlightedWord.startX}"][data-y="${currentHighlightedWord.startY + i}"]`
                );
                if (cellToHighlight && cellToHighlight !== clickedCellElement) {
                    cellToHighlight.classList.add('word-highlight');
                }
            }
        }

        lastClickedCell = { x, y };
    }

    function findNextCell(currentCell) {
        if (!currentHighlightedWord) return null;

        const currentX = parseInt(currentCell.x);
        const currentY = parseInt(currentCell.y);
        
        if (currentHighlightedWord.direction === 'across') {
            // Check if we're at the end of the word
            if (currentX >= currentHighlightedWord.startX + currentHighlightedWord.length - 1) {
                return null;
            }
            return document.querySelector(`.cell[data-x="${currentX + 1}"][data-y="${currentY}"]`);
        } else {
            // Check if we're at the end of the word
            if (currentY >= currentHighlightedWord.startY + currentHighlightedWord.length - 1) {
                return null;
            }
            return document.querySelector(`.cell[data-x="${currentX}"][data-y="${currentY + 1}"]`);
        }
    }

    function findPrevCell(currentCell) {
        if (!currentHighlightedWord) return null;

        const currentX = parseInt(currentCell.x);
        const currentY = parseInt(currentCell.y);
        
        if (currentHighlightedWord.direction === 'across') {
            // Check if we're at the start of the word
            if (currentX <= currentHighlightedWord.startX) {
                return null;
            }
            return document.querySelector(`.cell[data-x="${currentX - 1}"][data-y="${currentY}"]`);
        } else {
            // Check if we're at the start of the word
            if (currentY <= currentHighlightedWord.startY) {
                return null;
            }
            return document.querySelector(`.cell[data-x="${currentX}"][data-y="${currentY - 1}"]`);
        }
    }

    function handleKeyNavigation(event, cell) {
        if (event.key === 'Backspace' && !event.target.value) {
            event.preventDefault();
            const prevCell = findPrevCell(cell);
            if (prevCell) {
                const input = prevCell.querySelector('input');
                if (input) {
                    input.focus();
                }
            }
        } else if (event.key === 'ArrowLeft') {
            const prevCell = findPrevCell(cell);
            if (prevCell) {
                const input = prevCell.querySelector('input');
                if (input) input.focus();
            }
        } else if (event.key === 'ArrowRight') {
            const nextCell = findNextCell(cell);
            if (nextCell) {
                const input = nextCell.querySelector('input');
                if (input) input.focus();
            }
        }
    }

    function isPointInWord(x, y, word) {
        if (word.direction === 'across') {
            return x >= word.startX && x < word.startX + word.length && y === word.startY;
        } else {
            return x === word.startX && y >= word.startY && y < word.startY + word.length;
        }
    }

    // Helper function to calculate total non-blocked cells
    function getTotalCells() {
        return puzzleData.cells.filter(c => !c.isBlocked && c.letter.trim() !== '').length;
    }

    // Button event listeners
    document.getElementById('check-button').addEventListener('click', () => {
        // Calculate percentage of correct letters
        let correctCount = 0;
        const totalCells = getTotalCells();

        puzzleData.cells.forEach(cell => {
            if (!cell.isBlocked) {
                const userAnswer = userAnswers[`${cell.x},${cell.y}`]?.toUpperCase() || '';
                if (userAnswer === cell.letter.toUpperCase()) {
                    correctCount++;
                }
            }
        });

        const percentage = Math.round((correctCount / totalCells) * 100);
        const solutionWordCorrect = checkSolutionWord();

        // Enable submit button if solution is correct
        submitButton.disabled = !solutionWordCorrect;

        // Show answer
        alert(
            `Ratkaisusana on ${solutionWordCorrect ? 'oikein' : 'väärin'}.\n` +
            `Ristikko on ${percentage} % oikein.`
        );
    });

    document.getElementById('check-solution-button').addEventListener('click', () => {
        // Get the current solution attempt
        let solutionAttempt = '';
        for (let i = 0; i < SOLUTION_COORDS.length; i++) {
            const coord = SOLUTION_COORDS[i];
            const key = `${coord.x},${coord.y}`;
            const value = userAnswers[key];
            solutionAttempt += (value || ' ');
        }
        
        const solutionWordCorrect = solutionAttempt.toUpperCase() === _s;
        
        if (solutionWordCorrect) {
            alert('Ratkaisusana on oikein!');
            submitButton.disabled = false;
            isSolutionCorrect = true;
        } else {
            alert('Ratkaisusana on väärin, tarkista ristikko');
        }
    });

    document.getElementById('clear-button').addEventListener('click', () => {
        if (confirm('Haluatko varmasti tyhjentää ristikon?')) {
            userAnswers = {};
            localStorage.removeItem('puzzleState');
            document.querySelectorAll('.cell input').forEach(input => {
                input.value = '';
            });
            document.querySelectorAll('.cell').forEach(cell => {
                cell.classList.remove('correct', 'incorrect', 'word-highlight');
            });
            if (selectedCell) {
                selectedCell.classList.remove('selected');
                selectedCell = null;
            }
            // Reset solution check state
            submitButton.disabled = true;
            isSolutionCorrect = false;
        }
    });

    function checkSolutionWord() {
        // Get the letters from the specific coordinates
        const letters = SOLUTION_COORDS.map(coord => {
            return userAnswers[`${coord.x},${coord.y}`] || '';
        }).join('');
        
        return letters.toUpperCase() === _s;
    }

    document.getElementById('submit-button').addEventListener('click', () => {
        // Check if solution word is correct
        if (!checkSolutionWord()) {
            alert('Tarkista ratkaisusana');
            return;
        }

        // Create form for user details
        const form = document.createElement('form');
        form.innerHTML = `
            <div style="margin: 10px 0;">
                <label for="name">Nimi:</label><br>
                <input type="text" id="name" required>
            </div>
            <div style="margin: 10px 0;">
                <label for="email">Sähköposti:</label><br>
                <input type="email" id="email" required>
            </div>
            <div style="margin: 10px 0;">
                <label for="phone">Puhelin:</label><br>
                <input type="tel" id="phone" required>
            </div>
            <div style="margin: 10px 0;">
                <label for="organization">Yritys/Organisaatio:</label><br>
                <input type="text" id="organization">
            </div>
        `;

        // Show form in modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
            z-index: 1000;
        `;

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 999;
        `;

        const submitModalButton = document.createElement('button');
        submitModalButton.textContent = 'Lähetä';
        submitModalButton.style.cssText = 'margin-top: 10px;';

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Peruuta';
        cancelButton.style.cssText = 'margin: 10px 0 0 10px;';

        modal.appendChild(form);
        modal.appendChild(submitModalButton);
        modal.appendChild(cancelButton);
        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        cancelButton.onclick = () => {
            document.body.removeChild(modal);
            document.body.removeChild(overlay);
        };

        submitModalButton.onclick = async () => {
            const name = form.querySelector('#name').value;
            const email = form.querySelector('#email').value;
            const phone = form.querySelector('#phone').value;
            const organization = form.querySelector('#organization').value;

            if (!name || !email || !phone) {
                alert('Täytä kaikki pakolliset kentät!');
                return;
            }

            // Calculate percentage of correct letters
            let correctCount = 0;
            const totalCells = getTotalCells();

            puzzleData.cells.forEach(cell => {
                if (!cell.isBlocked && cell.letter.trim() !== '') {
                    const userAnswer = userAnswers[`${cell.x},${cell.y}`]?.toUpperCase() || '';
                    if (userAnswer === cell.letter.toUpperCase()) {
                        correctCount++;
                    }
                }
            });

            const percentage = Math.round((correctCount / totalCells) * 100);

            // Prepare submission data
            // NOTE: Webhook URL is exposed in client-side code. For production,
            // consider using a backend proxy to hide the actual endpoint.
            const submissionData = {
                userDetails: {
                    name,
                    email,
                    phone,
                    organization
                },
                correctPercentage: percentage,
                solutionWord: SOLUTION_COORDS.map(coord => 
                    userAnswers[`${coord.x},${coord.y}`] || ' '
                ).join(''),
                submissionTime: new Date().toISOString()
            };

            try {
                const response = await fetch('https://hook.eu1.make.com/j6i1llfwbqy4euobx94y2e22gy1wjlau', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(submissionData)
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                // Close modal
                document.body.removeChild(modal);
                document.body.removeChild(overlay);
                
                alert('Kiitos vastauksesta. Menestyksekästä vuotta 2025!');
            } catch (error) {
                alert('Virhe vastauksen lähetyksessä. Yritä uudelleen.');
            }
        };
    });

    document.getElementById('instructions-button').addEventListener('click', () => {
        alert(
            'Ristikon täyttöohjeet:\n\n' +
            '1. Täytä ristikkoa klikkaamalla ruutuja ja kirjoittamalla kirjaimia.\n' +
            '2. Voit vaihtaa sanan suuntaa klikkaamalla samaa ruutua uudelleen.\n' +
            '3. Kun olet valmis, voit tarkistaa vastauksesi "Tarkista ristikko" -painikkeella.\n' +
            '4. Osallistuaksesi arvontaan, täytä yhteystietosi ja lähetä vastauksesi.'
        );
    });
});
