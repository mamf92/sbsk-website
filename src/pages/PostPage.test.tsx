import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { PostTypes } from '../sanity/queryHelpers/posts';
import PostPage from './PostPage';

let loaderData: { post: PostTypes };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useLoaderData: () => loaderData };
});

const post: PostTypes = {
  _id: 'abc',
  title: 'Turneringen trenger frivillige',
  subtitle: 'Bli med og hjelp til',
  publishedAt: '2026-09-01T10:00:00Z',
  category: 'arrangementer',
  content: [
    {
      _type: 'block',
      _key: 'b1',
      style: 'normal',
      markDefs: [],
      children: [{ _type: 'span', _key: 's1', text: 'Vi trenger folk i kiosken.', marks: [] }],
    },
  ],
  links: [
    { label: 'Meld deg som frivillig', url: 'https://example.com/frivillig' },
    { label: 'Se kalenderen', url: '/kalender' },
  ],
};

const renderPage = (value: PostTypes = post) => {
  loaderData = { post: value };
  return render(
    <MemoryRouter>
      <PostPage />
    </MemoryRouter>,
  );
};

describe('PostPage', () => {
  it('makes the title the page’s one h1, with the subtitle as a lead', () => {
    renderPage();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(post.title);
    expect(screen.getByText('Bli med og hjelp til')).toBeInTheDocument();
  });

  it('shows the category tag, the date and the body', () => {
    renderPage();
    expect(screen.getByText('Arrangementer')).toBeInTheDocument();
    expect(screen.getByText('1. september 2026')).toHaveAttribute('datetime', post.publishedAt);
    expect(screen.getByText('Vi trenger folk i kiosken.')).toBeInTheDocument();
  });

  it('links back to the list', () => {
    renderPage();
    expect(screen.getByRole('link', { name: 'Alle innlegg' })).toHaveAttribute('href', '/');
  });

  it('renders the post links as buttons, with only the first one orange', () => {
    renderPage();
    const first = screen.getByRole('link', { name: 'Meld deg som frivillig' });
    const second = screen.getByRole('link', { name: 'Se kalenderen' });
    expect(first).toHaveAttribute('href', 'https://example.com/frivillig');
    expect(first).toHaveClass('bg-primary');
    expect(second).toHaveAttribute('href', '/kalender');
    expect(second).not.toHaveClass('bg-primary');
  });

  it('renders without optional parts', () => {
    renderPage({ ...post, subtitle: undefined, links: undefined, carousel: undefined });
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
