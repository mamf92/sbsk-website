import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// jsdom does not implement matchMedia, which src/utils/theme.ts relies on.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// jsdom implements <dialog> and its `open` reflection but not showModal/show/close, so a
// component built on the native element cannot even mount under test without this. The
// polyfill is deliberately thin: it moves the `open` attribute and fires `close`, which is
// all the component contract depends on. The parts jsdom is missing that actually matter —
// the top layer, the focus trap, Escape, inertness of the page behind — are not emulated
// here on purpose, because a fake would let a broken dialog pass. They are covered by
// e2e/dialog.spec.ts in a real browser.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.show = function show() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(returnValue?: string) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    if (returnValue !== undefined) this.returnValue = returnValue;
    this.dispatchEvent(new Event('close'));
  };
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
