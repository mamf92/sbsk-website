import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Label } from './Label';

describe('Label', () => {
  it('names the field it points at', () => {
    render(
      <>
        <Label htmlFor="navn">Navn</Label>
        <input id="navn" />
      </>,
    );
    expect(screen.getByRole('textbox', { name: 'Navn' })).toBeInTheDocument();
  });

  it('marks optional fields, and only those', () => {
    const { rerender } = render(<Label htmlFor="bio">Bio</Label>);
    expect(screen.queryByText('(valgfritt)', { exact: false })).toBeNull();

    rerender(
      <Label htmlFor="bio" optional>
        Bio
      </Label>,
    );
    expect(screen.getByText('(valgfritt)', { exact: false })).toBeInTheDocument();
  });
});
