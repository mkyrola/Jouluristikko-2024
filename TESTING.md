# Testing Guide - Seemoto Jouluristikko 2024

This document describes the automated test suite for the crossword puzzle application.

## Test Stack

| Layer | Framework | Description |
|-------|-----------|-------------|
| **Unit Tests (JS)** | Jest + jsdom | Tests core puzzle logic functions |
| **Unit Tests (Python)** | pytest | Tests Flask API endpoints |
| **E2E Tests** | Playwright | Tests full user flows in browser |

## Quick Start

### Install Dependencies

```bash
# JavaScript dependencies
npm install

# Python dependencies (with testing)
pip install -r requirements.txt

# Install Playwright browsers
npx playwright install
```

### Run All Tests

```bash
# JavaScript unit tests
npm test

# Python tests
pytest

# E2E tests
npm run test:e2e

# Run everything
npm run test:all && pytest
```

## Test Structure

```
tests/
├── setup.js              # Jest configuration
├── conftest.py           # pytest fixtures
├── fixtures/
│   └── puzzleData.js     # Sample test data
├── unit/
│   ├── puzzleLogic.test.js    # Core logic tests
│   └── domInteraction.test.js # DOM manipulation tests
├── e2e/
│   └── puzzle.spec.js    # Full user flow tests
└── test_flask_api.py     # Flask API tests
```

## JavaScript Unit Tests

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- puzzleLogic
```

### Test Categories

| Category | File | Tests |
|----------|------|-------|
| **Coordinate Transform** | `puzzleLogic.test.js` | Y-axis conversion |
| **Cell Counting** | `puzzleLogic.test.js` | getTotalCells logic |
| **Solution Checking** | `puzzleLogic.test.js` | Solution word validation |
| **Percentage Calc** | `puzzleLogic.test.js` | Correct answer percentage |
| **Word Finding** | `puzzleLogic.test.js` | Word at cell lookup |
| **Input Validation** | `puzzleLogic.test.js` | A-Z character filtering |
| **localStorage** | `puzzleLogic.test.js` | State persistence |
| **DOM Operations** | `domInteraction.test.js` | Cell creation, selection |

### Coverage Report

After running `npm run test:coverage`, view the HTML report:
```
open coverage/lcov-report/index.html
```

## Python/Flask Tests

### Running Tests

```bash
# Run all Python tests
pytest

# Run with verbose output
pytest -v

# Run with coverage
pytest --cov=src

# Run specific test class
pytest tests/test_flask_api.py::TestPuzzleAPIRoute
```

### Test Categories

| Class | Tests |
|-------|-------|
| `TestIndexRoute` | HTML rendering, page content |
| `TestPuzzleAPIRoute` | JSON API, data structure |
| `TestImageRoute` | Static image serving |
| `TestSecurityHeaders` | No sensitive data leak |
| `TestPathTraversal` | Security against path attacks |

## E2E Tests (Playwright)

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific test
npx playwright test puzzle.spec.js

# Run with UI mode
npx playwright test --ui
```

### Test Scenarios

| Scenario | Tests |
|----------|-------|
| **Page Load** | Title, image, buttons visible |
| **Cell Interaction** | Click, type, focus handling |
| **Keyboard Navigation** | Arrow keys, backspace |
| **Button Actions** | Instructions, check, clear |
| **Solution Validation** | Correct/incorrect feedback |
| **Persistence** | localStorage save/restore |
| **Responsive Design** | Mobile and tablet viewports |
| **Accessibility** | ARIA labels, roles |
| **Error Handling** | API failure graceful degradation |

### View Report

After tests run:
```bash
npx playwright show-report
```

## Writing New Tests

### JavaScript Unit Test Example

```javascript
describe('New Feature', () => {
  test('does something correctly', () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });
});
```

### Python Test Example

```python
class TestNewFeature:
    def test_something_works(self, client):
        response = client.get('/new-endpoint')
        assert response.status_code == 200
```

### E2E Test Example

```javascript
test('user can complete a task', async ({ page }) => {
  await page.goto('/');
  await page.click('#button');
  await expect(page.locator('.result')).toBeVisible();
});
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
# GitHub Actions example
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      
      - name: Install dependencies
        run: |
          npm ci
          pip install -r requirements.txt
          npx playwright install --with-deps
      
      - name: Run unit tests
        run: npm test
      
      - name: Run Python tests
        run: pytest
      
      - name: Run E2E tests
        run: npm run test:e2e
```

## Test Metrics

Current test counts:
- **JavaScript Unit Tests**: ~40 tests
- **Python API Tests**: ~25 tests
- **E2E Tests**: ~25 tests

**Total: ~90 automated tests**

---

*Last Updated: November 2024*
