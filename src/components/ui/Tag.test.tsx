import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Tag } from './Tag';

describe('Tag', () => {
  it('renders its children', () => {
    render(<Tag>Turnering</Tag>);
    expect(screen.getByText('Turnering')).toBeInTheDocument();
  });

  it('gives each tone a distinct class list', () => {
    render(
      <>
        <Tag tone="blue">A</Tag>
        <Tag tone="orange">B</Tag>
      </>,
    );
    expect(screen.getByText('A').className).not.toBe(screen.getByText('B').className);
  });

  it('keeps the caller className, forwards attributes and the ref', () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Tag ref={ref} className="extra" lang="nb" data-testid="tag">
        XIX
      </Tag>,
    );
    const tag = screen.getByTestId('tag');
    expect(tag).toHaveClass('extra');
    expect(tag).toHaveAttribute('lang', 'nb');
    expect(ref.current).toBe(tag);
  });
});
