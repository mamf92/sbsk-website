import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Panel } from './Panel';

describe('Panel', () => {
  it('is a section named by its heading when it has a title', () => {
    render(<Panel title="Priser">Junior 100 kr</Panel>);
    const region = screen.getByRole('region', { name: 'Priser' });
    expect(region).toHaveTextContent('Junior 100 kr');
    expect(screen.getByRole('heading', { level: 2, name: 'Priser' })).toBeInTheDocument();
  });

  it('takes the heading level it is given', () => {
    render(<Panel title="Program" headingLevel="h3" />);
    expect(screen.getByRole('heading', { level: 3, name: 'Program' })).toBeInTheDocument();
  });

  it('is a plain block without a title', () => {
    render(<Panel data-testid="p">Tekst</Panel>);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(screen.getByTestId('p').tagName).toBe('DIV');
  });

  it('gives each tone its own classes', () => {
    const { rerender } = render(<Panel data-testid="p" />);
    const blue = screen.getByTestId('p').className;
    rerender(<Panel data-testid="p" tone="orange" />);
    expect(screen.getByTestId('p').className).not.toBe(blue);
  });

  it('keeps the caller className, native attributes and the ref', () => {
    const ref = createRef<HTMLElement>();
    render(<Panel ref={ref} title="A" className="extra" lang="nb" />);
    expect(ref.current).toHaveClass('extra');
    expect(ref.current).toHaveAttribute('lang', 'nb');
  });
});
