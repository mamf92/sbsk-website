import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Tag } from './Tag';

describe('Tag', () => {
  it('defaults to the blue tone', () => {
    render(<Tag>Nyheter</Tag>);
    expect(screen.getByText('Nyheter')).toHaveClass('bg-tag-blue-bg', 'text-tag-blue-fg');
  });

  it('has an orange tone', () => {
    render(<Tag tone="orange">Spillkveld</Tag>);
    expect(screen.getByText('Spillkveld')).toHaveClass('bg-tag-orange-bg', 'text-tag-orange-fg');
  });

  it('is small and square', () => {
    render(<Tag>x</Tag>);
    expect(screen.getByText('x')).toHaveClass('rounded-none', 'text-xs');
  });
});
