import * as React from 'react';

/**
 * Autofill can populate a form's DOM before React ever renders a value into it — a saved
 * password, a browser's own name/e-mail suggestion — and it does so without firing `change`,
 * so a controlled field's React state stays `''` even though the box on screen is not. Both a
 * blur-based "did this field pass" check and a submit-time validity gate read that state, not
 * the DOM, so an autofilled field used to blur straight into a false "required" error and hold
 * the submit button disabled.
 *
 * A mount-time read of the form's own `FormData` is what catches it: by the time an effect
 * runs, the browser has already written whatever it is going to write, so there is no event to
 * listen for — just one read, once. Only fields that came in non-empty reach `sync`, so the
 * caller's merge never overwrites a field the user is mid-typing into with an empty string.
 */
export function useAutofillSync<T extends string>(
  formRef: React.RefObject<HTMLFormElement | null>,
  fields: readonly T[],
  sync: (values: Partial<Record<T, string>>) => void,
) {
  React.useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const data = new FormData(form);
    const filled: Partial<Record<T, string>> = {};
    for (const field of fields) {
      const value = data.get(field);
      if (typeof value === 'string' && value !== '') filled[field] = value;
    }

    if (Object.keys(filled).length > 0) sync(filled);
    // Deliberately mount-only: this reads the DOM state the browser wrote before React's first
    // paint, not a live subscription that should re-run when `fields`/`sync` change identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
