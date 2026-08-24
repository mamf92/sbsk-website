import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Divider } from './Divider';

describe('Divider', () => {
  it('renders a single child, a month label', () => {
    render(<Divider>SEPTEMBER 2026</Divider>);
    expect(screen.getByText('SEPTEMBER 2026')).toBeInTheDocument();
  });

  it('renders two children spread across the row, a label and a trailing detail', () => {
    render(
      <Divider>
        <span>Neste arrangement</span>
        <span>Om 3 dager</span>
      </Divider>,
    );

    expect(screen.getByText('Neste arrangement')).toBeInTheDocument();
    expect(screen.getByText('Om 3 dager')).toBeInTheDocument();
  });
});
