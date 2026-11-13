import { describe, expect, it } from 'vitest';
import { signupState } from './signup';

const now = new Date('2027-01-10T12:00:00Z');
const url = 'https://spond.com/landing/event/abc';

describe('signupState', () => {
  it('is none without a sign-up', () => {
    expect(signupState(undefined, now)).toBe('none');
    expect(signupState(null, now)).toBe('none');
    expect(signupState({}, now)).toBe('none');
  });

  it('maps the no-link methods', () => {
    expect(signupState({ method: 'oppmote' }, now)).toBe('dropIn');
    expect(signupState({ method: 'stengt', url }, now)).toBe('closed');
  });

  it('is open for a safe link with no window', () => {
    expect(signupState({ method: 'spond', url }, now)).toBe('open');
    expect(signupState({ method: 'lenke', url: 'https://example.com' }, now)).toBe('open');
  });

  it('is none for a link method without a safe URL', () => {
    expect(signupState({ method: 'spond' }, now)).toBe('none');
    expect(signupState({ method: 'lenke', url: 'javascript:alert(1)' }, now)).toBe('none');
  });

  it('is notYetOpen until the opening time, and open from it', () => {
    expect(signupState({ method: 'spond', url, opens: '2027-01-10T12:00:01Z' }, now)).toBe(
      'notYetOpen',
    );
    expect(signupState({ method: 'spond', url, opens: '2027-01-10T12:00:00Z' }, now)).toBe('open');
  });

  it('is closed from the deadline, and open just before it', () => {
    expect(signupState({ method: 'spond', url, closes: '2027-01-10T12:00:00Z' }, now)).toBe(
      'closed',
    );
    expect(signupState({ method: 'spond', url, closes: '2027-01-10T12:00:01Z' }, now)).toBe('open');
  });

  it('lets a passed deadline win over a future opening', () => {
    expect(
      signupState(
        { method: 'spond', url, opens: '2027-01-11T00:00:00Z', closes: '2027-01-09T00:00:00Z' },
        now,
      ),
    ).toBe('closed');
  });

  it('ignores unparseable times', () => {
    expect(signupState({ method: 'spond', url, opens: 'soon', closes: 'later' }, now)).toBe('open');
  });

  it('shows nothing for a method this build does not know', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(signupState({ method: 'sbsk' as any, url }, now)).toBe('none');
  });
});
