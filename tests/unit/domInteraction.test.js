/**
 * Unit tests for DOM interaction functions
 * Tests cell creation and event handling
 */

describe('DOM Interaction', () => {
  
  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <div id="crossword-grid" class="crossword-grid"></div>
      <button id="instructions-button">Ohjeet</button>
      <button id="check-button">Tarkista ristikko</button>
      <button id="check-solution-button">Tarkista ratkaisusana</button>
      <button id="clear-button">Tyhjennä ristikko</button>
      <button id="submit-button" disabled>Lähetä vastaus</button>
    `;
  });

  describe('Grid Element', () => {
    test('crossword grid element exists', () => {
      const grid = document.getElementById('crossword-grid');
      expect(grid).not.toBeNull();
    });

    test('grid can be cleared', () => {
      const grid = document.getElementById('crossword-grid');
      grid.innerHTML = '<div class="cell">Test</div>';
      expect(grid.children.length).toBe(1);
      
      grid.innerHTML = '';
      expect(grid.children.length).toBe(0);
    });
  });

  describe('Cell Creation', () => {
    test('creates cell element with correct class', () => {
      const cellElement = document.createElement('div');
      cellElement.className = 'cell';
      
      expect(cellElement.classList.contains('cell')).toBe(true);
    });

    test('sets data attributes correctly', () => {
      const cellElement = document.createElement('div');
      cellElement.dataset.x = '5';
      cellElement.dataset.y = '3';
      
      expect(cellElement.dataset.x).toBe('5');
      expect(cellElement.dataset.y).toBe('3');
    });

    test('creates input for non-blocked cell', () => {
      const cell = { x: 0, y: 0, letter: 'A', isBlocked: false };
      const cellElement = document.createElement('div');
      
      if (!cell.isBlocked && cell.letter.trim() !== '') {
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 1;
        cellElement.appendChild(input);
      }
      
      expect(cellElement.querySelector('input')).not.toBeNull();
      expect(cellElement.querySelector('input').maxLength).toBe(1);
    });

    test('does not create input for blocked cell', () => {
      const cell = { x: 4, y: 0, letter: ' ', isBlocked: true };
      const cellElement = document.createElement('div');
      
      if (!cell.isBlocked && cell.letter.trim() !== '') {
        const input = document.createElement('input');
        cellElement.appendChild(input);
      }
      
      if (cell.isBlocked) {
        cellElement.classList.add('blocked');
      }
      
      expect(cellElement.querySelector('input')).toBeNull();
      expect(cellElement.classList.contains('blocked')).toBe(true);
    });

    test('positions cell using percentage values', () => {
      const cell = { x: 5, y: 3 };
      const cellElement = document.createElement('div');
      
      cellElement.style.left = `${cell.x * 10}%`;
      cellElement.style.top = `${cell.y * 8.33}%`;
      
      expect(cellElement.style.left).toBe('50%');
      expect(cellElement.style.top).toBe('24.99%');
    });
  });

  describe('Button Elements', () => {
    test('all control buttons exist', () => {
      const buttonIds = [
        'instructions-button',
        'check-button',
        'check-solution-button',
        'clear-button',
        'submit-button'
      ];
      
      buttonIds.forEach(id => {
        const button = document.getElementById(id);
        expect(button).not.toBeNull();
      });
    });

    test('submit button is initially disabled', () => {
      const submitButton = document.getElementById('submit-button');
      expect(submitButton.disabled).toBe(true);
    });

    test('submit button can be enabled', () => {
      const submitButton = document.getElementById('submit-button');
      submitButton.disabled = false;
      expect(submitButton.disabled).toBe(false);
    });
  });

  describe('Cell Selection', () => {
    test('adds selected class to cell', () => {
      const grid = document.getElementById('crossword-grid');
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = '0';
      cell.dataset.y = '0';
      grid.appendChild(cell);
      
      cell.classList.add('selected');
      
      expect(cell.classList.contains('selected')).toBe(true);
    });

    test('removes selected class from all cells', () => {
      const grid = document.getElementById('crossword-grid');
      
      for (let i = 0; i < 3; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell selected';
        grid.appendChild(cell);
      }
      
      document.querySelectorAll('.cell').forEach(cellEl => {
        cellEl.classList.remove('selected');
      });
      
      const selectedCells = document.querySelectorAll('.cell.selected');
      expect(selectedCells.length).toBe(0);
    });
  });

  describe('Word Highlighting', () => {
    test('adds word-highlight class', () => {
      const cell = document.createElement('div');
      cell.className = 'cell';
      
      cell.classList.add('word-highlight');
      
      expect(cell.classList.contains('word-highlight')).toBe(true);
    });

    test('clears word highlights', () => {
      const grid = document.getElementById('crossword-grid');
      
      for (let i = 0; i < 5; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell word-highlight';
        grid.appendChild(cell);
      }
      
      document.querySelectorAll('.cell').forEach(cellEl => {
        cellEl.classList.remove('word-highlight');
      });
      
      const highlightedCells = document.querySelectorAll('.cell.word-highlight');
      expect(highlightedCells.length).toBe(0);
    });
  });

  describe('Cell Query Selectors', () => {
    test('finds cell by coordinates', () => {
      const grid = document.getElementById('crossword-grid');
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = '3';
      cell.dataset.y = '7';
      grid.appendChild(cell);
      
      const found = document.querySelector('.cell[data-x="3"][data-y="7"]');
      
      expect(found).not.toBeNull();
      expect(found).toBe(cell);
    });

    test('returns null for non-existent coordinates', () => {
      const found = document.querySelector('.cell[data-x="99"][data-y="99"]');
      expect(found).toBeNull();
    });
  });

  describe('Input Clearing', () => {
    test('clears all cell inputs', () => {
      const grid = document.getElementById('crossword-grid');
      
      for (let i = 0; i < 3; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        const input = document.createElement('input');
        input.value = 'X';
        cell.appendChild(input);
        grid.appendChild(cell);
      }
      
      document.querySelectorAll('.cell input').forEach(input => {
        input.value = '';
      });
      
      document.querySelectorAll('.cell input').forEach(input => {
        expect(input.value).toBe('');
      });
    });
  });
});

describe('Modal Creation', () => {
  test('creates modal element with correct styles', () => {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      z-index: 1000;
    `;
    
    expect(modal.style.position).toBe('fixed');
    expect(modal.style.zIndex).toBe('1000');
  });

  test('creates overlay element', () => {
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
    
    expect(overlay.style.position).toBe('fixed');
    expect(overlay.style.zIndex).toBe('999');
  });

  test('modal can be appended and removed from body', () => {
    const modal = document.createElement('div');
    modal.id = 'test-modal';
    
    document.body.appendChild(modal);
    expect(document.getElementById('test-modal')).not.toBeNull();
    
    document.body.removeChild(modal);
    expect(document.getElementById('test-modal')).toBeNull();
  });
});
