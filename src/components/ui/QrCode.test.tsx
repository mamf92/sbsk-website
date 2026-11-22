import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QrCode } from './QrCode';

describe('QrCode', () => {
  it('draws the code as one path once the encoder has loaded', async () => {
    const { container } = render(<QrCode value="sbsk-medlem:abc" label="Medlemskort" />);
    expect(screen.getByRole('img', { name: 'Medlemskort' })).toBeInTheDocument();
    await waitFor(() => expect(container.querySelector('path')).not.toBeNull());
    expect(container.querySelector('path')?.getAttribute('d')).toMatch(/^M\d+ \d+h1v1h-1z/);
  });

  it('redraws when the value changes', async () => {
    const { container, rerender } = render(<QrCode value="first" label="Kode" />);
    await waitFor(() => expect(container.querySelector('path')).not.toBeNull());
    const first = container.querySelector('path')?.getAttribute('d');
    rerender(<QrCode value="second, a different and longer value" label="Kode" />);
    await waitFor(() => expect(container.querySelector('path')?.getAttribute('d')).not.toBe(first));
  });
});
