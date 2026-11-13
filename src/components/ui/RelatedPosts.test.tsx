import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { RelatedPosts } from './RelatedPosts';
import { setLocale } from '../../utils/locale';

const posts = [
  {
    _id: 'p1',
    title: 'Vi trenger frivillige',
    slug: 'frivillige',
    publishedAt: '2027-01-10T09:00:00Z',
  },
];

describe('RelatedPosts', () => {
  it('renders nothing without posts', () => {
    const { container } = render(<RelatedPosts posts={[]} />, { wrapper: MemoryRouter });
    expect(container).toBeEmptyDOMElement();
  });

  it('links each post to its own page under a named region', () => {
    render(<RelatedPosts posts={posts} />, { wrapper: MemoryRouter });
    const region = screen.getByRole('region', { name: 'Innlegg om arrangementet' });
    expect(region).toContainElement(screen.getByRole('link', { name: 'Vi trenger frivillige' }));
    expect(screen.getByRole('link')).toHaveAttribute('href', '/innlegg/frivillige');
  });

  it('marks the Norwegian post titles on an English page', () => {
    act(() => setLocale('en'));
    render(<RelatedPosts posts={posts} />, { wrapper: MemoryRouter });
    expect(screen.getByRole('link').parentElement).toHaveAttribute('lang', 'nb');
  });
});
