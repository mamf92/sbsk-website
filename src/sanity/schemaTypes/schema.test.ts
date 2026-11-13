import { createSchema } from 'sanity';
import { describe, expect, it } from 'vitest';
import { eventType } from './eventType';
import { sharedObjectTypes } from './objects';
import { festivalTypes } from './festivalType';
import { gameType } from './gameType';

// A schema mistake (a field pointing at an unregistered type, a bad option) only shows up when
// an editor opens the Studio, which no other test does. This compiles the types the way the
// Studio does and fails on any error-level problem.
describe('Studio schema', () => {
  it('compiles the event and festival types and the shared objects without errors', () => {
    const schema = createSchema({
      name: 'test',
      types: [eventType, gameType, ...festivalTypes, ...sharedObjectTypes],
    });
    const validation =
      (
        schema as unknown as {
          _validation?: { problems: { severity: string; message: string }[] }[];
        }
      )._validation ?? [];
    const errors = validation
      .flatMap((group) => group.problems)
      .filter((problem) => problem.severity === 'error')
      .map((problem) => problem.message);
    expect(errors).toEqual([]);
  });

  it('catches a reference to an unregistered type', () => {
    // Guards the test above: without the shared objects, `signup` and friends are unknown.
    const schema = createSchema({ name: 'test', types: [eventType] });
    const validation =
      (
        schema as unknown as {
          _validation?: { problems: { severity: string }[] }[];
        }
      )._validation ?? [];
    expect(validation.flatMap((g) => g.problems).some((p) => p.severity === 'error')).toBe(true);
  });
});
