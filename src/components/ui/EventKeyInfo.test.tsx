import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EventKeyInfo } from './EventKeyInfo';

const facts = [
  { id: 'when', label: 'Når', value: '28.–31. januar 2027' },
  { id: 'where', label: 'Hvor', value: 'Tasta bydelshus' },
];

describe('EventKeyInfo', () => {
  it('is a named complementary landmark with the facts and actions', () => {
    render(
      <EventKeyInfo label="Nøkkelinfo" facts={facts} actions={<button>Meld deg på</button>} />,
    );
    const aside = screen.getByRole('complementary', { name: 'Nøkkelinfo' });
    expect(aside).toHaveTextContent('Tasta bydelshus');
    expect(screen.getAllByRole('term').map((el) => el.textContent)).toEqual(['Når', 'Hvor']);
    expect(screen.getByRole('button', { name: 'Meld deg på' })).toBeInTheDocument();
  });

  it('renders nothing with neither facts nor actions', () => {
    const { container } = render(<EventKeyInfo label="Nøkkelinfo" facts={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('keeps the caller className and forwards the ref', () => {
    const ref = createRef<HTMLElement>();
    render(<EventKeyInfo ref={ref} label="N" facts={facts} className="extra" />);
    expect(ref.current).toHaveClass('extra');
  });
});
