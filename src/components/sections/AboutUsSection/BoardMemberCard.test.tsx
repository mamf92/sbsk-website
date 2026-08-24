import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BoardMemberCard } from './BoardMemberCard';

describe('BoardMemberCard', () => {
  it('renders the name in an h3', () => {
    render(<BoardMemberCard name="Anne Berg" />);

    expect(screen.getByRole('heading', { level: 3, name: 'Anne Berg' })).toBeInTheDocument();
  });

  it('shows initials when there is no portrait', () => {
    const { container } = render(<BoardMemberCard name="Anne Berg" />);

    expect(screen.getByText('AB')).toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('shows the portrait when one is passed, decoratively', () => {
    const { container } = render(
      <BoardMemberCard name="Anne Berg" imageUrl="https://example.test/anne.jpg" />,
    );

    expect(screen.queryByText('AB')).not.toBeInTheDocument();
    const image = container.querySelector('img');
    expect(image).toHaveAttribute('src', 'https://example.test/anne.jpg');
    expect(image).toHaveAttribute('alt', '');
  });

  it('renders the role and bio when present', () => {
    render(<BoardMemberCard name="Anne Berg" role="Leder" bio="Har vært med lenge." />);

    expect(screen.getByText('Leder')).toBeInTheDocument();
    expect(screen.getByText('Har vært med lenge.')).toBeInTheDocument();
  });
});
