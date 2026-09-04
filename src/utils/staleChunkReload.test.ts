import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { recoverFromStaleChunks } from './staleChunkReload';

const RELOAD_GUARD_KEY = 'sbsk-stale-chunk-reload';

describe('recoverFromStaleChunks', () => {
  let reloadSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sessionStorage.clear();
    reloadSpy = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload: reloadSpy });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reloads the page the first time a chunk fails to load', () => {
    recoverFromStaleChunks();
    window.dispatchEvent(new Event('vite:preloadError', { cancelable: true }));

    expect(reloadSpy).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(RELOAD_GUARD_KEY)).toBe('1');
  });

  it('reloads only once if more chunks fail before the reload navigates away', () => {
    recoverFromStaleChunks();
    window.dispatchEvent(new Event('vite:preloadError', { cancelable: true }));
    window.dispatchEvent(new Event('vite:preloadError', { cancelable: true }));

    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it('clears a stale guard on a fresh, successful load so a later deploy gets its own retry', () => {
    sessionStorage.setItem(RELOAD_GUARD_KEY, '1');
    recoverFromStaleChunks();

    expect(sessionStorage.getItem(RELOAD_GUARD_KEY)).toBeNull();
  });
});
