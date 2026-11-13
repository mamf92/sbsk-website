import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EventFacts } from './EventFacts';

describe('EventFacts', () => {
  it('pairs each label with its value in a definition list', () => {
    render(
      <EventFacts
        facts={[
          { id: 'when', label: 'Når', value: 'fredag 29. januar' },
          { id: 'where', label: 'Hvor', value: 'Tasta bydelshus' },
        ]}
      />,
    );
    const terms = screen.getAllByRole('term').map((el) => el.textContent);
    const definitions = screen.getAllByRole('definition').map((el) => el.textContent);
    expect(terms).toEqual(['Når', 'Hvor']);
    expect(definitions).toEqual(['fredag 29. januar', 'Tasta bydelshus']);
  });

  it('renders nothing without facts', () => {
    const { container } = render(<EventFacts facts={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('keeps the caller className and forwards the ref', () => {
    const ref = createRef<HTMLDListElement>();
    render(
      <EventFacts ref={ref} className="extra" facts={[{ id: 'a', label: 'A', value: 'B' }]} />,
    );
    expect(ref.current).toHaveClass('extra');
  });
});
