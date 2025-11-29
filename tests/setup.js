/**
 * Jest test setup file
 * Configures testing environment and global mocks
 */

require('@testing-library/jest-dom');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Mock alert and confirm
global.alert = jest.fn();
global.confirm = jest.fn(() => true);

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.getItem.mockReturnValue(null);
});
