import { describe, expect, it } from 'vitest';
import { dayHoursProblem } from './festivalType';

describe('dayHoursProblem', () => {
  it('accepts both times, or neither while they are not known yet', () => {
    expect(dayHoursProblem('17:00', '23:00')).toBeNull();
    expect(dayHoursProblem('22:00', '02:00')).toBeNull();
    expect(dayHoursProblem(undefined, undefined)).toBeNull();
  });

  it('asks for the other time when only one is set', () => {
    expect(dayHoursProblem('17:00', undefined)).toMatch(/både/);
    expect(dayHoursProblem(undefined, '23:00')).toMatch(/både/);
  });

  it('rejects closing the same minute the doors open', () => {
    expect(dayHoursProblem('10:00', '10:00')).toMatch(/samme minutt/);
  });
});
