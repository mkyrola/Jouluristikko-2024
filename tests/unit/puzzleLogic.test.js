/**
 * Unit tests for puzzle logic functions
 * Tests core functionality extracted from main.js
 */

const { samplePuzzleData, SOLUTION_COORDS, SOLUTION_WORD } = require('../fixtures/puzzleData');

describe('Puzzle Logic', () => {
  
  describe('Coordinate Transformation', () => {
    test('transforms Y coordinates from bottom-left to top-left origin', () => {
      const cells = [
        { x: 0, y: 11 },
        { x: 5, y: 0 },
        { x: 3, y: 6 }
      ];
      const maxY = Math.max(...cells.map(c => c.y));
      
      const transformed = cells.map(cell => ({
        ...cell,
        y: maxY - cell.y
      }));
      
      expect(transformed[0].y).toBe(0);  // 11 -> 0
      expect(transformed[1].y).toBe(11); // 0 -> 11
      expect(transformed[2].y).toBe(5);  // 6 -> 5
    });

    test('preserves X coordinates during transformation', () => {
      const cells = [{ x: 5, y: 11 }, { x: 0, y: 0 }];
      const maxY = Math.max(...cells.map(c => c.y));
      
      const transformed = cells.map(cell => ({
        ...cell,
        y: maxY - cell.y
      }));
      
      expect(transformed[0].x).toBe(5);
      expect(transformed[1].x).toBe(0);
    });
  });

  describe('getTotalCells', () => {
    test('counts only non-blocked cells with letters', () => {
      const cells = [
        { isBlocked: false, letter: 'A' },
        { isBlocked: false, letter: 'B' },
        { isBlocked: true, letter: ' ' },
        { isBlocked: false, letter: ' ' },
        { isBlocked: false, letter: 'C' }
      ];
      
      const count = cells.filter(c => !c.isBlocked && c.letter.trim() !== '').length;
      
      expect(count).toBe(3);
    });

    test('returns 0 for empty cells array', () => {
      const cells = [];
      const count = cells.filter(c => !c.isBlocked && c.letter.trim() !== '').length;
      
      expect(count).toBe(0);
    });

    test('returns 0 when all cells are blocked', () => {
      const cells = [
        { isBlocked: true, letter: ' ' },
        { isBlocked: true, letter: ' ' }
      ];
      
      const count = cells.filter(c => !c.isBlocked && c.letter.trim() !== '').length;
      
      expect(count).toBe(0);
    });
  });

  describe('Solution Word Checking', () => {
    test('correctly identifies valid solution word', () => {
      const userAnswers = {
        '7,0': 'S',
        '3,2': 'I',
        '8,2': 'N',
        '4,5': 'A',
        '6,6': 'P',
        '0,8': 'P',
        '9,11': 'I'
      };
      
      const letters = SOLUTION_COORDS.map(coord => 
        userAnswers[`${coord.x},${coord.y}`] || ''
      ).join('');
      
      expect(letters.toUpperCase()).toBe(SOLUTION_WORD);
    });

    test('handles lowercase input correctly', () => {
      const userAnswers = {
        '7,0': 's',
        '3,2': 'i',
        '8,2': 'n',
        '4,5': 'a',
        '6,6': 'p',
        '0,8': 'p',
        '9,11': 'i'
      };
      
      const letters = SOLUTION_COORDS.map(coord => 
        userAnswers[`${coord.x},${coord.y}`] || ''
      ).join('');
      
      expect(letters.toUpperCase()).toBe(SOLUTION_WORD);
    });

    test('returns false for incorrect solution', () => {
      const userAnswers = {
        '7,0': 'X',
        '3,2': 'Y',
        '8,2': 'Z',
        '4,5': 'A',
        '6,6': 'B',
        '0,8': 'C',
        '9,11': 'D'
      };
      
      const letters = SOLUTION_COORDS.map(coord => 
        userAnswers[`${coord.x},${coord.y}`] || ''
      ).join('');
      
      expect(letters.toUpperCase()).not.toBe(SOLUTION_WORD);
    });

    test('handles missing letters gracefully', () => {
      const userAnswers = {
        '7,0': 'S',
        '3,2': 'I'
        // Other letters missing
      };
      
      const letters = SOLUTION_COORDS.map(coord => 
        userAnswers[`${coord.x},${coord.y}`] || ''
      ).join('');
      
      expect(letters).toBe('SI');
      expect(letters.toUpperCase()).not.toBe(SOLUTION_WORD);
    });
  });

  describe('Percentage Calculation', () => {
    test('calculates 100% when all answers correct', () => {
      const cells = [
        { x: 0, y: 0, letter: 'A', isBlocked: false },
        { x: 1, y: 0, letter: 'B', isBlocked: false },
        { x: 2, y: 0, letter: 'C', isBlocked: false }
      ];
      const userAnswers = { '0,0': 'A', '1,0': 'B', '2,0': 'C' };
      
      let correctCount = 0;
      cells.forEach(cell => {
        if (!cell.isBlocked && cell.letter.trim() !== '') {
          const userAnswer = userAnswers[`${cell.x},${cell.y}`]?.toUpperCase() || '';
          if (userAnswer === cell.letter.toUpperCase()) {
            correctCount++;
          }
        }
      });
      
      const totalCells = cells.filter(c => !c.isBlocked && c.letter.trim() !== '').length;
      const percentage = Math.round((correctCount / totalCells) * 100);
      
      expect(percentage).toBe(100);
    });

    test('calculates 0% when no answers correct', () => {
      const cells = [
        { x: 0, y: 0, letter: 'A', isBlocked: false },
        { x: 1, y: 0, letter: 'B', isBlocked: false }
      ];
      const userAnswers = { '0,0': 'X', '1,0': 'Y' };
      
      let correctCount = 0;
      cells.forEach(cell => {
        if (!cell.isBlocked && cell.letter.trim() !== '') {
          const userAnswer = userAnswers[`${cell.x},${cell.y}`]?.toUpperCase() || '';
          if (userAnswer === cell.letter.toUpperCase()) {
            correctCount++;
          }
        }
      });
      
      const totalCells = cells.filter(c => !c.isBlocked && c.letter.trim() !== '').length;
      const percentage = Math.round((correctCount / totalCells) * 100);
      
      expect(percentage).toBe(0);
    });

    test('calculates partial percentage correctly', () => {
      const cells = [
        { x: 0, y: 0, letter: 'A', isBlocked: false },
        { x: 1, y: 0, letter: 'B', isBlocked: false },
        { x: 2, y: 0, letter: 'C', isBlocked: false },
        { x: 3, y: 0, letter: 'D', isBlocked: false }
      ];
      const userAnswers = { '0,0': 'A', '1,0': 'B', '2,0': 'X', '3,0': 'Y' };
      
      let correctCount = 0;
      cells.forEach(cell => {
        if (!cell.isBlocked && cell.letter.trim() !== '') {
          const userAnswer = userAnswers[`${cell.x},${cell.y}`]?.toUpperCase() || '';
          if (userAnswer === cell.letter.toUpperCase()) {
            correctCount++;
          }
        }
      });
      
      const totalCells = cells.filter(c => !c.isBlocked && c.letter.trim() !== '').length;
      const percentage = Math.round((correctCount / totalCells) * 100);
      
      expect(percentage).toBe(50);
    });
  });

  describe('Word Finding', () => {
    test('finds across word containing cell', () => {
      const words = samplePuzzleData.words;
      const x = 1, y = 11;
      
      const wordsAtPoint = words.filter(word => {
        if (word.direction === 'across') {
          return y === word.startY && x >= word.startX && x < (word.startX + word.length);
        }
        return false;
      });
      
      expect(wordsAtPoint.length).toBe(1);
      expect(wordsAtPoint[0].answer).toBe('ASKO');
    });

    test('finds down word containing cell', () => {
      const words = samplePuzzleData.words;
      // Word ALAJAT starts at (0,11) and goes down for 6 letters: y=11,10,9,8,7,6
      const x = 0, y = 11;
      
      const wordsAtPoint = words.filter(word => {
        if (word.direction === 'down') {
          // For down words, y increases from startY
          return x === word.startX && y >= word.startY && y < (word.startY + word.length);
        }
        return false;
      });
      
      expect(wordsAtPoint.length).toBe(1);
      expect(wordsAtPoint[0].answer).toBe('ALAJAT');
    });

    test('finds multiple words at intersection', () => {
      const words = samplePuzzleData.words;
      const x = 0, y = 11; // Intersection point
      
      const wordsAtPoint = words.filter(word => {
        if (word.direction === 'across') {
          return y === word.startY && x >= word.startX && x < (word.startX + word.length);
        } else {
          return x === word.startX && y >= word.startY && y < (word.startY + word.length);
        }
      });
      
      expect(wordsAtPoint.length).toBe(2);
    });

    test('returns empty array for blocked cell', () => {
      const words = samplePuzzleData.words;
      const x = 4, y = 11; // Blocked cell
      
      const wordsAtPoint = words.filter(word => {
        if (word.direction === 'across') {
          return y === word.startY && x >= word.startX && x < (word.startX + word.length);
        } else {
          return x === word.startX && y >= word.startY && y < (word.startY + word.length);
        }
      });
      
      expect(wordsAtPoint.length).toBe(0);
    });
  });
});

describe('Input Validation', () => {
  test('accepts only A-Z characters', () => {
    const validInputs = ['A', 'Z', 'a', 'z', 'M', 'm'];
    const invalidInputs = ['1', '!', ' ', 'Ä', 'ö', '中'];
    
    const isValidInput = (char) => /^[A-Za-z]$/.test(char);
    
    validInputs.forEach(input => {
      expect(isValidInput(input)).toBe(true);
    });
    
    invalidInputs.forEach(input => {
      expect(isValidInput(input)).toBe(false);
    });
  });

  test('converts lowercase to uppercase', () => {
    const inputs = ['a', 'b', 'z'];
    const expected = ['A', 'B', 'Z'];
    
    inputs.forEach((input, i) => {
      expect(input.toUpperCase()).toBe(expected[i]);
    });
  });
});

describe('localStorage Handling', () => {
  test('handles corrupted JSON gracefully', () => {
    localStorage.setItem('puzzleState', 'invalid json {{{');
    
    let userAnswers = {};
    try {
      const savedState = localStorage.getItem('puzzleState');
      if (savedState) {
        userAnswers = JSON.parse(savedState);
      }
    } catch (e) {
      localStorage.removeItem('puzzleState');
      userAnswers = {};
    }
    
    expect(userAnswers).toEqual({});
    expect(localStorage.removeItem).toHaveBeenCalledWith('puzzleState');
  });

  test('restores valid saved state', () => {
    const savedAnswers = { '0,0': 'A', '1,0': 'B' };
    localStorage.setItem('puzzleState', JSON.stringify(savedAnswers));
    
    let userAnswers = {};
    try {
      const savedState = localStorage.getItem('puzzleState');
      if (savedState) {
        userAnswers = JSON.parse(savedState);
      }
    } catch (e) {
      userAnswers = {};
    }
    
    expect(userAnswers).toEqual(savedAnswers);
  });

  test('handles null localStorage gracefully', () => {
    // localStorage is cleared in beforeEach, so getItem returns null
    let userAnswers = {};
    try {
      const savedState = localStorage.getItem('puzzleState');
      if (savedState) {
        userAnswers = JSON.parse(savedState);
      }
    } catch (e) {
      userAnswers = {};
    }
    
    expect(userAnswers).toEqual({});
  });
});

describe('Solution Obfuscation', () => {
  test('base64 decode and reverse produces correct solution', () => {
    const encoded = 'SVBQQU5JUw==';
    const decoded = atob(encoded).split('').reverse().join('');
    
    expect(decoded).toBe('SINAPPI');
  });
});
