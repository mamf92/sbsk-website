import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EventPageLayout } from './EventPageLayout';

describe('EventPageLayout', () => {
  it('puts the aside first in reading order, then the content', () => {
    render(
      <EventPageLayout aside={<aside aria-label="Nøkkelinfo">Fakta</aside>}>
        <h2>Program</h2>
      </EventPageLayout>,
    );
    const aside = screen.getByRole('complementary', { name: 'Nøkkelinfo' });
    const heading = screen.getByRole('heading', { name: 'Program' });
    expect(aside.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('keeps the caller className, native attributes and the ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<EventPageLayout ref={ref} aside={null} className="extra" id="x" />);
    expect(ref.current).toHaveClass('extra');
    expect(ref.current).toHaveAttribute('id', 'x');
  });
});
