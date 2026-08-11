/**
 * First letter of the first two words of a name. "Anne Berg" → "AB".
 *
 * Lives outside `Avatar.tsx` because a module under `src/components/ui/` may only export
 * components — anything else there breaks Fast Refresh.
 */
export function initials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] ?? '')
    .join('')
    .toUpperCase();

  return letters || '?';
}
