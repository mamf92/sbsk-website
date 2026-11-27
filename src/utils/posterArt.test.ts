import { describe, expect, it } from 'vitest';
import { posterArt } from './posterArt';

describe('posterArt', () => {
  it('gives Christmas art to jul events only, not to «juli»', () => {
    expect(posterArt('spillkveld', 'Julespillkveld')).toMatch(/jul/);
    expect(posterArt('annet', 'EKSEMPEL: Julebord')).toMatch(/jul/);
    expect(posterArt('turnering', 'Sommerturnering i juli')).toMatch(/turnering/);
    expect(posterArt('festival', 'Jul')).toMatch(/festival/);
  });
});
