document.addEventListener('DOMContentLoaded', () => {
    let puzzleData = null;
    let userAnswers = {};
    let lastClickedCell = null;
    let isSolutionCorrect = false;
    let currentHighlightedWord = null;

    // Zoom settings
    const MIN_ZOOM = 80;
    const MAX_ZOOM = 150;
    const ZOOM_STEP = 10;
    let currentZoom = parseInt(localStorage.getItem('puzzleZoom')) || 100;

    // Disable submit button initially
    const submitButton = document.getElementById('submit-button');
    submitButton.disabled = true;

    // Initialize zoom
    const puzzleWrapper = document.querySelector('.puzzle-wrapper');
    const zoomLevelDisplay = document.getElementById('zoom-level');
    applyZoom(currentZoom);

    function applyZoom(level) {
        currentZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level));
        puzzleWrapper.style.transform = `scale(${currentZoom / 100})`;
        puzzleWrapper.style.transformOrigin = 'top center';
        zoomLevelDisplay.textContent = `${currentZoom}%`;
        localStorage.setItem('puzzleZoom', currentZoom);
    }

    document.getElementById('zoom-in-button').addEventListener('click', () => {
        applyZoom(currentZoom + ZOOM_STEP);
    });

    document.getElementById('zoom-out-button').addEventListener('click', () => {
        applyZoom(currentZoom - ZOOM_STEP);
    });

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

    // Fetch puzzle data
    // Check if we're on Netlify (static) or Flask (development)
    const isNetlify = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const puzzleUrl = isNetlify ? '/data/puzzle2024.json' : '/api/puzzle';
    
    fetch(puzzleUrl)
        .then(response => response.json())
        .then(data => {
            // Calculate grid height from data (max Y coordinate)
            const maxY = Math.max(...data.cells.map(c => c.y));
            
            // Transform coordinates from bottom-left to top-left
            data.cells = data.cells.map(cell => ({
                ...cell,
                x: cell.x,
                y: maxY - cell.y // Transform Y coordinate
            }));
            data.words = data.words.map(word => ({
                ...word,
                startX: word.startX,
                startY: maxY - word.startY, // Transform Y coordinate for words too
                direction: word.direction.toLowerCase() // Ensure consistent case
            }));
            puzzleData = data;
            
            // Calculate solution coordinates after data is loaded and transformed
            calculateSolutionCoordinates(puzzleData);
            
            initializePuzzle();
        })
        .catch(error => {
            document.getElementById('crossword-grid').innerHTML = 
                '<p style="color:red;padding:20px;">Virhe ristikon latauksessa. Lataa sivu uudelleen.</p>';
        });

    // Dynamic solution coordinates and word
    let SOLUTION_COORDS = [];
    let SOLUTION_WORD = '';
    
    // Calculate solution coordinates from the word marked as ratkaisusana
    function calculateSolutionCoordinates(puzzleData) {
        if (!puzzleData || !puzzleData.words) {
            SOLUTION_COORDS = [];
            SOLUTION_WORD = '';
            return;
        }
        
        // Find the word marked as ratkaisusana
        const solutionWordObj = puzzleData.words.find(word => word.ratkaisusana === true);
        if (!solutionWordObj) {
            SOLUTION_COORDS = [];
            SOLUTION_WORD = '';
            return;
        }
        
        // Calculate coordinates for each letter in the solution word
        SOLUTION_WORD = solutionWordObj.answer;
        SOLUTION_COORDS = [];
        
        for (let i = 0; i < solutionWordObj.length; i++) {
            let x = solutionWordObj.startX;
            let y = solutionWordObj.startY;
            
            // Adjust position based on direction
            if (solutionWordObj.direction === 'down') {
                y = solutionWordObj.startY + i; // Going down in original coordinates (after transform)
            } else {
                x = solutionWordObj.startX + i; // Going across
            }
            
            SOLUTION_COORDS.push({ x, y });
        }
    }
    
    // Get the solution word (for backward compatibility)
    function getSolutionWord() {
        return SOLUTION_WORD;
    }

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
            input.setAttribute('pattern', '[A-Za-zÄÖÅäöå]');
            input.style.caretColor = 'transparent';
            
            // Load saved answer if exists
            const key = `${cell.x},${cell.y}`;
            if (userAnswers[key]) {
                // Ensure saved value is uppercase
                input.value = userAnswers[key].toUpperCase();
            }
            
            // Handle character input first
            input.addEventListener('beforeinput', function(event) {
                // Allow only Finnish letters and basic Latin letters
                if (event.data && !/^[A-Za-zÄÖÅäöå]$/.test(event.data)) {
                    event.preventDefault();
                }
            });
            
            input.addEventListener('input', function(event) {
                if (event.target.value) {
                    // Always convert to uppercase and validate
                    let value = event.target.value.toUpperCase();
                    // Only allow Finnish letters and basic Latin letters
                    value = value.replace(/[^A-ZÄÖÅ]/g, '');
                    // Ensure only one character
                    value = value.slice(0, 1);
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
                    event.key === 'ArrowUp' || event.key === 'ArrowDown' ||
                    (event.key === 'Backspace' && !event.target.value)) {
                    handleKeyNavigation(event, cell);
                }
                
                // If cell already has a value and user types a letter, replace and move
                if (event.target.value && /^[A-Za-zÄÖÅäöå]$/.test(event.key)) {
                    event.preventDefault();
                    const newValue = event.key.toUpperCase();
                    event.target.value = newValue;
                    userAnswers[key] = newValue;
                    localStorage.setItem('puzzleState', JSON.stringify(userAnswers));
                    
                    // Move to next cell
                    requestAnimationFrame(() => {
                        const nextCell = findNextCell(cell);
                        if (nextCell) {
                            const nextInput = nextCell.querySelector('input');
                            if (nextInput) nextInput.focus();
                        }
                    });
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
        
        let nextCell;
        if (currentHighlightedWord.direction === 'across') {
            // Find next cell in horizontal direction (no word boundary check)
            nextCell = document.querySelector(`.cell[data-x="${currentX + 1}"][data-y="${currentY}"]`);
        } else {
            // Find next cell in vertical direction (no word boundary check)
            nextCell = document.querySelector(`.cell[data-x="${currentX}"][data-y="${currentY + 1}"]`);
        }
        
        // Return next cell only if it exists and has an input (is not blocked)
        if (nextCell && nextCell.querySelector('input')) {
            return nextCell;
        }
        return null;
    }

    function findPrevCell(currentCell) {
        if (!currentHighlightedWord) return null;

        const currentX = parseInt(currentCell.x);
        const currentY = parseInt(currentCell.y);
        
        let prevCell;
        if (currentHighlightedWord.direction === 'across') {
            // Find previous cell in horizontal direction (no word boundary check)
            prevCell = document.querySelector(`.cell[data-x="${currentX - 1}"][data-y="${currentY}"]`);
        } else {
            // Find previous cell in vertical direction (no word boundary check)
            prevCell = document.querySelector(`.cell[data-x="${currentX}"][data-y="${currentY - 1}"]`);
        }
        
        // Return previous cell only if it exists and has an input (is not blocked)
        if (prevCell && prevCell.querySelector('input')) {
            return prevCell;
        }
        return null;
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
        } else if ((currentHighlightedWord?.direction === 'across' && event.key === 'ArrowLeft') ||
                   (currentHighlightedWord?.direction === 'down' && event.key === 'ArrowUp')) {
            event.preventDefault();
            const prevCell = findPrevCell(cell);
            if (prevCell) {
                const input = prevCell.querySelector('input');
                if (input) input.focus();
            }
        } else if ((currentHighlightedWord?.direction === 'across' && event.key === 'ArrowRight') ||
                   (currentHighlightedWord?.direction === 'down' && event.key === 'ArrowDown')) {
            event.preventDefault();
            const nextCell = findNextCell(cell);
            if (nextCell) {
                const input = nextCell.querySelector('input');
                if (input) input.focus();
            }
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
            if (!cell.isBlocked && cell.letter.trim() !== '') {
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

    // Remove check-solution-button event listener since button was removed

    document.getElementById('clear-button').addEventListener('click', () => {
        if (confirm('Haluatko varmasti tyhjentää ristikon?')) {
            userAnswers = {};
            localStorage.removeItem('puzzleState');
            document.querySelectorAll('.cell input').forEach(input => {
                input.value = '';
            });
            document.querySelectorAll('.cell').forEach(cellEl => {
                cellEl.classList.remove('correct', 'incorrect', 'word-highlight', 'selected');
            });
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
        
        // Get solution word from the words array
        const solutionWord = getSolutionWord();
        return letters.toUpperCase() === solutionWord.toUpperCase();
    }

    document.getElementById('submit-button').addEventListener('click', () => {
        // Check if solution word is correct
        if (!checkSolutionWord()) {
            showErrorModal('Ratkaisusana on väärin, tarkista ristikko');
            return;
        }

        // Show modern submission modal
        showSubmissionModal();
    });

    function showErrorModal(message) {
        const modal = createModal();
        
        modal.querySelector('.modal-content').innerHTML = `
            <div class="modal-header">
                <h2>Virhe</h2>
            </div>
            <div class="modal-body">
                <div class="error-message show">${message}</div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-cancel" onclick="closeModal()">Sulje</button>
            </div>
        `;
        
        showModal();
    }

    function showSubmissionModal() {
        const modal = createModal();
        
        modal.querySelector('.modal-content').innerHTML = `
            <div class="modal-header">
                <h2>Lähetä vastauksesi</h2>
                <p>Täytä tietosi alla osallistuaksesi arvontaan</p>
            </div>
            <div class="error-message" id="form-error"></div>
            <form id="submission-form">
                <div class="form-group">
                    <label for="name">Nimi *</label>
                    <input type="text" id="name" name="name" required>
                </div>
                <div class="form-group">
                    <label for="email">Sähköposti *</label>
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="phone">Puhelin *</label>
                    <input type="tel" id="phone" name="phone" required>
                </div>
                <div class="form-group">
                    <label for="organization">Yritys/Organisaatio</label>
                    <input type="text" id="organization" name="organization">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-cancel" onclick="closeModal()">Peruuta</button>
                    <button type="submit" class="btn-submit">Lähetä</button>
                </div>
            </form>
        `;
        
        // Add form submit handler
        modal.querySelector('#submission-form').addEventListener('submit', handleFormSubmit);
        
        showModal();
    }

    function createModal() {
        // Remove existing modal if any
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <!-- Content will be filled by specific modal functions -->
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking overlay
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        return modal;
    }

    function showModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            setTimeout(() => modal.remove(), 300);
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const errorDiv = document.getElementById('form-error');
        
        // Clear previous errors
        errorDiv.classList.remove('show');
        errorDiv.textContent = '';
        
        // Validate form
        const name = formData.get('name').trim();
        const email = formData.get('email').trim();
        const phone = formData.get('phone').trim();
        
        if (!name || !email || !phone) {
            errorDiv.textContent = 'Täytä kaikki pakolliset kentät (merkitty tähdellä *)';
            errorDiv.classList.add('show');
            return;
        }
        
        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errorDiv.textContent = 'Syötä kelvollinen sähköpostiosoite';
            errorDiv.classList.add('show');
            return;
        }
        
        // Disable submit button
        const submitBtn = form.querySelector('.btn-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Lähetetään...';
        
        try {
            // Check if we're on Netlify (static) or Flask (development)
            const isNetlify = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
            
            // Submit to appropriate endpoint
            const submitUrl = isNetlify ? '/.netlify/functions/submit' : '/api/submit';
            
            const response = await fetch(submitUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    organization: formData.get('organization').trim(),
                    timestamp: new Date().toISOString(),
                    puzzleCompleted: true
                })
            });
            
            if (response.ok) {
                showSuccessModal();
            } else {
                const errorData = await response.json();
                if (response.status === 429) {
                    throw new Error(errorData.error || 'Voit lähettää vastauksen vain kerran päivässä.');
                } else {
                    throw new Error('Submission failed');
                }
            }
        } catch (error) {
            errorDiv.textContent = error.message || 'Virhe lähetettäessä. Yritä myöhemmin uudelleen.';
            errorDiv.classList.add('show');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Lähetä';
        }
    }

    function showSuccessModal() {
        const modal = createModal();
        
        modal.querySelector('.modal-content').innerHTML = `
            <div class="modal-header">
                <h2>Kiitos vastauksestasi!</h2>
                <p>Olet mukana arvonnassa</p>
            </div>
            <div class="success-message show">
                Vastauksesi on lähetetty onnistuneesti.
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-submit" onclick="closeModal()">Sulje</button>
            </div>
        `;
        
        showModal();
    }

    // Make closeModal globally available
    window.closeModal = closeModal;

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
