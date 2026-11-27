import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StepStrip } from './StepStrip';

const STEPS = ['Send inn', 'Styret legger deg til', 'Lag profil'];

describe('StepStrip', () => {
  it('marks the active step as current', () => {
    render(<StepStrip steps={STEPS} active={2} />);
    expect(screen.getByRole('listitem', { current: 'step' })).toHaveTextContent(
      'Styret legger deg til',
    );
  });

  it('says a done step is done in text, not by colour alone', () => {
    render(<StepStrip steps={STEPS} active={2} />);
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Ferdig:Send inn');
    expect(screen.getAllByRole('listitem')[2]).toHaveTextContent('3Lag profil');
  });
});
