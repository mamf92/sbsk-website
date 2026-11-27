import { beforeEach, describe, expect, it, vi } from 'vitest';

const nextGameNightLoader = vi.fn();
vi.mock('../sanity/queryHelpers/events', () => ({
  nextGameNightLoader: () => nextGameNightLoader(),
}));

const { becomeAMemberLoader } = await import('./become-a-member-loader');

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  nextGameNightLoader.mockReset();
});

describe('becomeAMemberLoader', () => {
  it('returns the next game night', async () => {
    const event = { _id: 'spillkveld-1', title: 'Spillkveld' };
    nextGameNightLoader.mockResolvedValue(event);
    expect(await becomeAMemberLoader()).toEqual({ nextGameNight: event });
  });

  it('keeps the page when Sanity fails, without the note', async () => {
    nextGameNightLoader.mockRejectedValue(new Error('offline'));
    expect(await becomeAMemberLoader()).toEqual({ nextGameNight: null });
  });
});
