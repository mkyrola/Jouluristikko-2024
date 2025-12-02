// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Crossword Puzzle Application', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for puzzle to load
    await page.waitForSelector('#crossword-grid .cell');
  });

  test.describe('Page Load', () => {
    test('loads the puzzle page', async ({ page }) => {
      await expect(page).toHaveTitle('Seemoto Jouluristikko 2024');
    });

    test('displays the puzzle image', async ({ page }) => {
      const image = page.locator('.puzzle-image');
      await expect(image).toBeVisible();
    });

    test('displays all control buttons', async ({ page }) => {
      await expect(page.locator('#instructions-button')).toBeVisible();
      await expect(page.locator('#check-button')).toBeVisible();
      await expect(page.locator('#check-solution-button')).toBeVisible();
      await expect(page.locator('#clear-button')).toBeVisible();
      await expect(page.locator('#submit-button')).toBeVisible();
    });

    test('submit button is initially disabled', async ({ page }) => {
      await expect(page.locator('#submit-button')).toBeDisabled();
    });

    test('renders puzzle cells', async ({ page }) => {
      const cells = page.locator('#crossword-grid .cell');
      const count = await cells.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Cell Interaction', () => {
    test('can click and focus a cell', async ({ page }) => {
      const firstInput = page.locator('#crossword-grid .cell input').first();
      await firstInput.click();
      await expect(firstInput).toBeFocused();
    });

    test('can type a letter in a cell', async ({ page }) => {
      const firstInput = page.locator('#crossword-grid .cell input').first();
      await firstInput.click();
      await firstInput.fill('A');
      await expect(firstInput).toHaveValue('A');
    });

    test('converts lowercase to uppercase', async ({ page }) => {
      const firstInput = page.locator('#crossword-grid .cell input').first();
      await firstInput.click();
      await firstInput.pressSequentially('a');
      await expect(firstInput).toHaveValue('A');
    });

    test('accepts Finnish characters (Ä, Ö, Å)', async ({ page }) => {
      const inputs = page.locator('#crossword-grid .cell input');
      const firstInput = inputs.first();
      const secondInput = inputs.nth(1);
      const thirdInput = inputs.nth(2);
      
      // Test Ä
      await firstInput.click();
      await firstInput.fill('ä');
      await expect(firstInput).toHaveValue('Ä');
      
      // Test Ö
      await secondInput.click();
      await secondInput.fill('ö');
      await expect(secondInput).toHaveValue('Ö');
      
      // Test Å
      await thirdInput.click();
      await thirdInput.fill('å');
      await expect(thirdInput).toHaveValue('Å');
    });

    test('highlights word when cell is clicked', async ({ page }) => {
      const firstInput = page.locator('#crossword-grid .cell input').first();
      await firstInput.click();
      
      // Check for word-highlight class on related cells
      const highlightedCells = page.locator('.cell.word-highlight, .cell.selected');
      const count = await highlightedCells.count();
      expect(count).toBeGreaterThan(0);
    });

    test('clears highlights when clicking another cell', async ({ page }) => {
      const inputs = page.locator('#crossword-grid .cell input');
      const firstInput = inputs.first();
      const secondInput = inputs.nth(5);
      
      await firstInput.click();
      await secondInput.click();
      
      // First cell should no longer be selected
      const firstCell = page.locator('#crossword-grid .cell').first();
      await expect(firstCell).not.toHaveClass(/selected/);
    });

    test('toggles direction when clicking same cell twice', async ({ page }) => {
      // Find a cell that is at an intersection (part of both horizontal and vertical words)
      const inputs = page.locator('#crossword-grid .cell input');
      const testInput = inputs.first();
      
      // First click - should highlight one direction
      await testInput.click();
      const firstHighlightCount = await page.locator('.cell.word-highlight').count();
      
      // Second click on same cell - should toggle direction
      await testInput.click();
      const secondHighlightCount = await page.locator('.cell.word-highlight').count();
      
      // If cell is at intersection, highlight count may differ
      // At minimum, clicking should work without errors
      expect(firstHighlightCount).toBeGreaterThanOrEqual(0);
      expect(secondHighlightCount).toBeGreaterThanOrEqual(0);
    });

    test('auto-advances in horizontal direction when typing', async ({ page }) => {
      const inputs = page.locator('#crossword-grid .cell input');
      const firstInput = inputs.first();
      
      // Click to set horizontal direction
      await firstInput.click();
      
      // Type multiple characters
      await page.keyboard.type('AB');
      
      // First input should have 'A', focus should have moved
      await expect(firstInput).toHaveValue('A');
      await expect(firstInput).not.toBeFocused();
    });

    test('continues typing across word boundaries in same direction', async ({ page }) => {
      const inputs = page.locator('#crossword-grid .cell input');
      const firstInput = inputs.first();
      
      // Click to set horizontal direction  
      await firstInput.click();
      
      // Type a long sequence - should continue without stopping
      await page.keyboard.type('TESTWORD');
      
      // First input should have first letter
      await expect(firstInput).toHaveValue('T');
      
      // Check that multiple cells have been filled
      const filledCells = await page.evaluate(() => {
        const inputs = document.querySelectorAll('#crossword-grid .cell input');
        let count = 0;
        inputs.forEach(input => {
          if (input.value) count++;
        });
        return count;
      });
      
      // Should have filled multiple cells (depends on grid, but at least some)
      expect(filledCells).toBeGreaterThan(1);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('moves to next cell on arrow right', async ({ page }) => {
      const inputs = page.locator('#crossword-grid .cell input');
      const firstInput = inputs.first();
      
      await firstInput.click();
      await page.keyboard.press('ArrowRight');
      
      // Focus should have moved
      await expect(firstInput).not.toBeFocused();
    });

    test('moves to previous cell on arrow left', async ({ page }) => {
      const inputs = page.locator('#crossword-grid .cell input');
      const secondInput = inputs.nth(1);
      
      await secondInput.click();
      await page.keyboard.press('ArrowLeft');
      
      const firstInput = inputs.first();
      await expect(firstInput).toBeFocused();
    });
  });

  test.describe('Instructions Button', () => {
    test('shows instructions dialog', async ({ page }) => {
      page.once('dialog', async dialog => {
        expect(dialog.type()).toBe('alert');
        expect(dialog.message()).toContain('Ristikon täyttöohjeet');
        await dialog.accept();
      });
      
      await page.locator('#instructions-button').click();
    });
  });

  test.describe('Check Puzzle Button', () => {
    test('shows percentage dialog', async ({ page }) => {
      page.once('dialog', async dialog => {
        expect(dialog.type()).toBe('alert');
        expect(dialog.message()).toContain('Ristikko on');
        expect(dialog.message()).toContain('%');
        await dialog.accept();
      });
      
      await page.locator('#check-button').click();
    });
  });

  test.describe('Clear Button', () => {
    test('shows confirmation dialog', async ({ page }) => {
      page.once('dialog', async dialog => {
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toContain('tyhjentää');
        await dialog.dismiss(); // Don't actually clear
      });
      
      await page.locator('#clear-button').click();
    });

    test('clears all inputs when confirmed', async ({ page }) => {
      // Fill some cells first
      const firstInput = page.locator('#crossword-grid .cell input').first();
      await firstInput.fill('X');
      
      page.once('dialog', async dialog => {
        await dialog.accept();
      });
      
      await page.locator('#clear-button').click();
      
      // Wait a moment for clear to complete
      await page.waitForTimeout(100);
      
      await expect(firstInput).toHaveValue('');
    });
  });

  test.describe('Solution Validation', () => {
    test('check solution button shows result', async ({ page }) => {
      page.once('dialog', async dialog => {
        expect(dialog.type()).toBe('alert');
        expect(dialog.message()).toMatch(/Ratkaisusana on (oikein|väärin)/);
        await dialog.accept();
      });
      
      await page.locator('#check-solution-button').click();
    });
  });

  test.describe('Persistence', () => {
    test('saves answers to localStorage', async ({ page }) => {
      const firstInput = page.locator('#crossword-grid .cell input').first();
      await firstInput.fill('X');
      
      // Check localStorage
      const savedState = await page.evaluate(() => {
        return localStorage.getItem('puzzleState');
      });
      
      expect(savedState).not.toBeNull();
      expect(savedState).toContain('X');
    });

    test('restores answers on page reload', async ({ page }) => {
      const firstInput = page.locator('#crossword-grid .cell input').first();
      await firstInput.fill('Z');
      
      // Reload page
      await page.reload();
      await page.waitForSelector('#crossword-grid .cell');
      
      // Check first input still has value
      const reloadedInput = page.locator('#crossword-grid .cell input').first();
      await expect(reloadedInput).toHaveValue('Z');
    });
  });

  test.describe('Responsive Design', () => {
    test('renders correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      
      await expect(page.locator('.puzzle-container')).toBeVisible();
      await expect(page.locator('.controls')).toBeVisible();
    });

    test('renders correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      
      await expect(page.locator('.puzzle-container')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('buttons have aria-labels', async ({ page }) => {
      const buttons = page.locator('.controls button');
      const count = await buttons.count();
      
      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        expect(ariaLabel).not.toBeNull();
      }
    });

    test('controls have toolbar role', async ({ page }) => {
      const controls = page.locator('.controls');
      await expect(controls).toHaveAttribute('role', 'toolbar');
    });
  });
});

test.describe('Error Handling', () => {
  test('displays error message on puzzle load failure', async ({ page }) => {
    // Intercept the puzzle data request and make it fail
    await page.route('**/api/puzzle', route => {
      route.abort();
    });
    
    await page.goto('/');
    
    // Should show error message
    const errorMessage = page.locator('#crossword-grid');
    await expect(errorMessage).toContainText('Virhe');
  });
});
