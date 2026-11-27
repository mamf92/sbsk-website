import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Eyebrow } from './Eyebrow';

describe('Eyebrow', () => {
  it('renders its label', () => {
    render(<Eyebrow>Bli medlem</Eyebrow>);
    expect(screen.getByText('Bli medlem')).toBeInTheDocument();
  });
});
