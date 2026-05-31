// Test setup file for Vitest
import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock File System Access API
globalThis.showOpenFilePicker = vi.fn();
globalThis.showSaveFilePicker = vi.fn();

// Global test timeout
const TEST_TIMEOUT = 10000;

export const testTimeout = TEST_TIMEOUT;

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});
