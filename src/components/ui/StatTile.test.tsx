import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatTile } from './StatTile';

describe('StatTile', () => {
  it('renders the value and its label', () => {
    render(<StatTile value={42} label="Aktive medlemmer" />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Aktive medlemmer')).toBeInTheDocument();
  });

  it('passes native attributes through and keeps the caller className', () => {
    render(<StatTile value="–" label="Innsjekk" data-testid="tile" className="col-span-2" />);
    expect(screen.getByTestId('tile')).toHaveClass('col-span-2');
  });

  it('gives each tone and size a distinct class list', () => {
    const { rerender } = render(<StatTile value={1} label="x" data-testid="t" />);
    const seen = new Set<string>();
    for (const tone of ['dark', 'light'] as const) {
      for (const size of ['sm', 'md'] as const) {
        rerender(<StatTile value={1} label="x" data-testid="t" tone={tone} size={size} />);
        seen.add(screen.getByTestId('t').className + screen.getByText('1').className);
      }
    }
    expect(seen.size).toBe(4);
  });

  it('forwards its ref to the DOM node', () => {
    const ref = createRef<HTMLDivElement>();
    render(<StatTile ref={ref} value={1} label="x" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
