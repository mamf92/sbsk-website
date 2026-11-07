import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import * as React from 'react';
import { Alert, FieldError } from './Alert';

describe('Alert', () => {
  it('announces itself — the whole reason it exists', () => {
    render(<Alert>Feil e-post eller passord.</Alert>);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Feil e-post eller passord.');
  });

  it('renders the error glyph', () => {
    const { container } = render(<Alert>Noe gikk galt.</Alert>);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('applies a distinct class list for every size', () => {
    const { unmount } = render(<Alert size="md">x</Alert>);
    const md = screen.getByRole('alert').className;
    unmount();

    render(<Alert size="sm">x</Alert>);
    expect(screen.getByRole('alert').className).not.toBe(md);
  });

  it('merges a caller className and forwards native attributes', () => {
    render(
      <Alert className="mt-4" data-testid="feil">
        x
      </Alert>,
    );

    const alert = screen.getByTestId('feil');
    expect(alert.className).toContain('mt-4');
  });

  it('forwards a ref', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Alert ref={ref}>x</Alert>);
    expect(ref.current).toBe(screen.getByRole('alert'));
  });

  it('defaults to the error tone', () => {
    render(<Alert>x</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('bg-danger-bg', 'text-danger-text');
  });

  it.each([
    ['info', 'bg-info-bg'],
    ['success', 'bg-success-bg'],
  ] as const)('announces the %s tone politely as a status, on its own tint', (tone, bg) => {
    render(<Alert tone={tone}>Meldingen din er sendt.</Alert>);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Meldingen din er sendt.');
    expect(status).toHaveClass(bg, 'border-l-4');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('gives each tone its own icon', () => {
    const paths = (['info', 'success', 'error'] as const).map((tone) => {
      const { container, unmount } = render(<Alert tone={tone}>x</Alert>);
      const svg = container.querySelector('svg')!.innerHTML;
      unmount();
      return svg;
    });
    expect(new Set(paths).size).toBe(3);
  });

  it('is square and casts no shadow', () => {
    render(<Alert>x</Alert>);
    const classes = screen.getByRole('alert').className;
    expect(classes).toContain('rounded-none');
    expect(classes).not.toMatch(/shadow/);
  });
});

describe('FieldError', () => {
  it('is announced, so a screen reader hears the fix-it message', () => {
    render(<FieldError>Postnummeret må være på 4 siffer.</FieldError>);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Postnummeret må være på 4 siffer.');
  });

  it('is red text with an icon, not a box', () => {
    const { container } = render(<FieldError>x</FieldError>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('text-danger-text');
    expect(alert.className).not.toMatch(/\bbg-|border/);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('can be pointed at by aria-describedby, which is how it pairs with Input', () => {
    render(<FieldError id="postcode-error">Ugyldig postnummer.</FieldError>);
    expect(screen.getByRole('alert')).toHaveAttribute('id', 'postcode-error');
  });
});
