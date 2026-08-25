import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { useAutofillSync } from './useAutofillSync';

type Fields = 'name' | 'email';

// `defaultValue` stands in for autofill here: it puts a value in the DOM that React's own
// state never learns about, the same gap a browser-filled field leaves — the hook reads
// `FormData`, not React state, so it can't tell the two apart.
function TestForm({
  onSync,
  name = '',
  email = '',
}: {
  onSync: (values: Partial<Record<Fields, string>>) => void;
  name?: string;
  email?: string;
}) {
  const formRef = React.useRef<HTMLFormElement>(null);
  useAutofillSync(formRef, ['name', 'email'], onSync);
  return (
    <form ref={formRef}>
      <input name="name" defaultValue={name} />
      <input name="email" defaultValue={email} />
    </form>
  );
}

describe('useAutofillSync', () => {
  it('reports only the named fields the DOM already carries a value for', () => {
    const onSync = vi.fn();
    render(<TestForm onSync={onSync} name="Autofylt Navn" />);

    expect(onSync).toHaveBeenCalledTimes(1);
    expect(onSync).toHaveBeenCalledWith({ name: 'Autofylt Navn' });
  });

  it('does not call sync when every named field is empty', () => {
    const onSync = vi.fn();
    render(<TestForm onSync={onSync} />);

    expect(onSync).not.toHaveBeenCalled();
  });

  it('reports every filled field at once, not one call per field', () => {
    const onSync = vi.fn();
    render(<TestForm onSync={onSync} name="Navn" email="a@b.no" />);

    expect(onSync).toHaveBeenCalledTimes(1);
    expect(onSync).toHaveBeenCalledWith({ name: 'Navn', email: 'a@b.no' });
  });
});
