document.addEventListener('DOMContentLoaded', () => {
    let puzzleData = null;
    let selectedCell = null;
    let userAnswers = {};
    let lastClickedCell = null;
    let lastDirection = null;
    let isSolutionCorrect = false;
    let currentHighlightedWord = null;

    // Disable submit button initially
    const submitButton = document.getElementById('submit-button');
    submitButton.disabled = true;

    // Load saved state from localStorage
    const savedState = localStorage.getItem('puzzleState');
    if (savedState) {
        userAnswers = JSON.parse(savedState);
    }

    // Clear any old puzzle state
    localStorage.removeItem('puzzleState');

    // Fetch puzzle data
    fetch('/api/puzzle')
        .then(response => response.json())
        .then(data => {
            console.log('Raw puzzle data:', data);
            // Transform coordinates from bottom-left to top-left
            data.cells = data.cells.map(cell => ({
                ...cell,
                x: cell.x,
                y: 11 - cell.y // Transform Y coordinate
            }));
            data.words = data.words.map(word => ({
                ...word,
                startX: word.startX,
                startY: 11 - word.startY // Transform Y coordinate for words too
            }));
            console.log('First cell after transform:', data.cells[0]);
            console.log('First word after transform:', data.words[0]);
            puzzleData = data;
            initializePuzzle();
        })
        .catch(error => {
            console.error('Error loading puzzle:', error);
        });

    // Solution word coordinates
    const SOLUTION_COORDS = [
        {x: 7, y: 0},   // S
        {x: 3, y: 2},   // I
        {x: 8, y: 2},   // N
        {x: 4, y: 5},   // A
        {x: 6, y: 6},   // P
        {x: 0, y: 8},   // P
        {x: 9, y: 11}   // I
    ];
    const SOLUTION_WORD = "SINAPPI";

    function initializePuzzle() {
        const grid = document.getElementById('crossword-grid');
        grid.innerHTML = ''; // Clear existing grid
        
        // Debug: Log the dimensions of the grid
        const maxX = Math.max(...puzzleData.cells.map(c => c.x));
        const maxY = Math.max(...puzzleData.cells.map(c => c.y));
        console.log(`Grid dimensions: ${maxX + 1}x${maxY + 1}`);
        
        // Create cells
        puzzleData.cells.forEach((cell, index) => {
            console.log(`Creating cell ${index}:`, cell);
            const cellElement = createCell(cell);
            grid.appendChild(cellElement);
        });

        console.log('Grid initialized with', puzzleData.cells.length, 'cells'); // Debug log
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
            
            // Load saved answer if exists
            const key = `${cell.x},${cell.y}`;
            if (userAnswers[key]) {
                input.value = userAnswers[key];
            }
            
            input.addEventListener('input', (event) => handleInput(event, cell));
            input.addEventListener('keydown', (event) => handleKeyNavigation(event, cell));
            cellElement.appendChild(input);
            
            // Add click handler to cell
            cellElement.addEventListener('click', (event) => {
                handleCellClick(event, cell);
                // Focus the input after handling the click
                input.focus();
            });
        }
        
        if (cell.isBlocked) {
            cellElement.classList.add('blocked');
        }
        
        cellElement.style.left = `${cell.x * 90.4}px`;
        cellElement.style.top = `${cell.y * 92.3}px`;

        return cellElement;
    }

    function handleCellClick(event, cell) {
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);

        // Find words that contain this cell
        const wordsAtPoint = puzzleData.words.filter(word => 
            word.coordinates.some(coord => coord.x === x && coord.y === y)
        );

        if (wordsAtPoint.length === 0) return;

        // Clear previous highlights
        document.querySelectorAll('.cell.word-highlight').forEach(cell => {
            cell.classList.remove('word-highlight');
        });

        // If there's only one word or if this is a different cell, highlight first word
        if (wordsAtPoint.length === 1 || (lastClickedCell.x !== x || lastClickedCell.y !== y)) {
            currentHighlightedWord = wordsAtPoint[0];
        } else {
            // Toggle between words at the same cell
            const currentIndex = wordsAtPoint.findIndex(w => 
                w.coordinates.every((coord, i) => 
                    currentHighlightedWord && i < currentHighlightedWord.coordinates.length && 
                    coord.x === currentHighlightedWord.coordinates[i].x && 
                    coord.y === currentHighlightedWord.coordinates[i].y
                )
            );
            currentHighlightedWord = wordsAtPoint[(currentIndex + 1) % wordsAtPoint.length];
        }

        // Highlight the current word
        currentHighlightedWord.coordinates.forEach(coord => {
            const cell = document.querySelector(`.cell[data-x="${coord.x}"][data-y="${coord.y}"]`);
            if (cell) cell.classList.add('word-highlight');
        });

        lastClickedCell = { x, y };
    }

    function findNextCell(currentCell) {
        if (!currentHighlightedWord) return null;

        const currentX = parseInt(currentCell.x);
        const currentY = parseInt(currentCell.y);
        
        // Get current position in the word
        const currentIndex = currentHighlightedWord.coordinates.findIndex(coord => 
            coord.x === currentX && coord.y === currentY
        );
        
        if (currentIndex === -1 || currentIndex === currentHighlightedWord.coordinates.length - 1) {
            return null;
        }
        
        // Move to next cell
        const nextCoord = currentHighlightedWord.coordinates[currentIndex + 1];
        return document.querySelector(`.cell[data-x="${nextCoord.x}"][data-y="${nextCoord.y}"]`);
    }

    function findPrevCell(currentCell) {
        if (!currentHighlightedWord) return null;

        const currentX = parseInt(currentCell.x);
        const currentY = parseInt(currentCell.y);
        
        // Get current position in the word
        const currentIndex = currentHighlightedWord.coordinates.findIndex(coord => 
            coord.x === currentX && coord.y === currentY
        );
        
        if (currentIndex <= 0) {
            return null;
        }
        
        // Move to previous cell
        const prevCoord = currentHighlightedWord.coordinates[currentIndex - 1];
        return document.querySelector(`.cell[data-x="${prevCoord.x}"][data-y="${prevCoord.y}"]`);
    }

    function handleInput(event, cell) {
        const value = event.target.value.toUpperCase();
        event.target.value = value;
        
        const key = `${cell.x},${cell.y}`;
        if (value.length > 0) {
            userAnswers[key] = value[0];
            console.log(`Stored answer at ${key}:`, {
                value: value[0],
                cell: cell,
                allAnswers: userAnswers
            });
            
            // Move to next cell if there's input
            const nextCell = findNextCell(cell);
            if (nextCell) {
                const input = nextCell.querySelector('input');
                if (input) {
                    input.focus();
                }
            }
        } else {
            delete userAnswers[key];
            console.log(`Cleared answer at ${key}`);
        }
        
        localStorage.setItem('puzzleState', JSON.stringify(userAnswers));
    }

    function handleKeyNavigation(event, cell) {
        if (event.key === 'Backspace' && !event.target.value) {
            event.preventDefault();
            const prevCell = findPrevCell(cell);
            if (prevCell) {
                const input = prevCell.querySelector('input');
                if (input) {
                    input.focus();
                    input.value = '';
                    userAnswers[`${cell.x},${cell.y}`] = '';
                    localStorage.setItem('puzzleState', JSON.stringify(userAnswers));
                }
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

    // Button event listeners
    document.getElementById('check-button').addEventListener('click', () => {
        // Calculate percentage of correct letters
        let correctCount = 0;
        const totalCells = 106; // Total non-blocked cells in the puzzle

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

        // Always show answer
        alert(
            `Ratkaisusana on ${solutionWordCorrect ? 'oikein' : 'väärin'}.\n` +
            `Ristikko on ${percentage} % oikein.`
        );
    });

    document.getElementById('check-solution-button').addEventListener('click', () => {
        console.log('Checking solution word...');
        console.log('Current userAnswers:', userAnswers);
        console.log('Solution coordinates:', SOLUTION_COORDS);
        
        // Get the current solution attempt
        let solutionAttempt = '';
        for (let i = 0; i < SOLUTION_COORDS.length; i++) {
            const coord = SOLUTION_COORDS[i];
            const key = `${coord.x},${coord.y}`;
            const value = userAnswers[key];
            console.log(`Checking coordinate ${i + 1}:`, {
                x: coord.x,
                y: coord.y,
                key: key,
                value: value,
                allAnswers: userAnswers
            });
            solutionAttempt += (value || ' ');
        }
        
        console.log('Final solution attempt:', solutionAttempt);
        console.log('Expected solution:', SOLUTION_WORD);
        
        const solutionWordCorrect = solutionAttempt.toUpperCase() === SOLUTION_WORD;
        
        if (solutionWordCorrect) {
            alert('Ratkaisusana on oikein eli SINAPPI');
            submitButton.disabled = false;
            isSolutionCorrect = true;
        } else {
            alert(`Ratkaisusana on väärin, tarkista ristikko\nArvaus: ${solutionAttempt}`);
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
            const letter = userAnswers[`${coord.x},${coord.y}`] || '';
            console.log(`Checking coord (${coord.x},${coord.y}): ${letter}`); // Debug log
            return letter;
        }).join('');
        
        console.log('Current solution word:', letters); // Debug log
        console.log('Expected solution word:', SOLUTION_WORD); // Debug log
        return letters.toUpperCase() === SOLUTION_WORD;
    }

    document.getElementById('submit-button').addEventListener('click', () => {
        // Always check solution word first
        const solutionAttempt = SOLUTION_COORDS.map(coord => 
            userAnswers[`${coord.x},${coord.y}`] || ' '
        ).join('');
        
        if (solutionAttempt.toUpperCase() !== SOLUTION_WORD) {
            alert('Ratkaisusana pitää olla oikein ratkaistu');
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

        submitModalButton.onclick = () => {
            const name = form.querySelector('#name').value;
            const email = form.querySelector('#email').value;
            const phone = form.querySelector('#phone').value;

            if (!name || !email || !phone) {
                alert('Täytä kaikki kentät!');
                return;
            }

            // Prepare submission data
            const submissionData = {
                userDetails: {
                    name,
                    email,
                    phone
                },
                puzzleState: userAnswers
            };

            // TODO: Send data to backend
            console.log('Submission data:', submissionData);
            
            // Close modal
            document.body.removeChild(modal);
            document.body.removeChild(overlay);
            
            alert('Kiitos vastauksesta. Menestyksekästä vuotta 2024!');
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