import '@testing-library/jest-dom/vitest';

// jsdom has no ResizeObserver (Modal body watches its size for the footer line).
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
}
