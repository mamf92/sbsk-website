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
});

describe('FieldError', () => {
  it('is the small Alert, and is announced the same way', () => {
    render(<FieldError>Postnummeret må være på 4 siffer.</FieldError>);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Postnummeret må være på 4 siffer.');
  });

  it('matches Alert at size sm exactly', () => {
    const { unmount } = render(<FieldError>x</FieldError>);
    const field = screen.getByRole('alert').className;
    unmount();

    render(<Alert size="sm">x</Alert>);
    expect(screen.getByRole('alert').className).toBe(field);
  });

  it('can be pointed at by aria-describedby, which is how it pairs with Input', () => {
    render(<FieldError id="postcode-error">Ugyldig postnummer.</FieldError>);
    expect(screen.getByRole('alert')).toHaveAttribute('id', 'postcode-error');
  });
});
