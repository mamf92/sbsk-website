import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LanguageToggle } from './LanguageToggle';

describe('LanguageToggle', () => {
  it('offers English on a Norwegian page, labelled in English', () => {
    render(<LanguageToggle locale="nb" onChange={() => {}} />);
    const button = screen.getByRole('button', { name: 'EN – Change language to English' });
    expect(button).toHaveTextContent('EN');
    expect(button).toHaveAttribute('lang', 'en');
  });

  it('offers Norwegian on an English page, labelled in Norwegian', () => {
    render(<LanguageToggle locale="en" onChange={() => {}} />);
    const button = screen.getByRole('button', { name: 'NO – Bytt språk til norsk' });
    expect(button).toHaveTextContent('NO');
    expect(button).toHaveAttribute('lang', 'nb');
  });

  it('reports the other locale when clicked', async () => {
    const onChange = vi.fn();
    render(<LanguageToggle locale="nb" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledWith('en');
  });
});
