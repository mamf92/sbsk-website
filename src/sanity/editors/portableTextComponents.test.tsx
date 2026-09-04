import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { components } from './portableTextComponents';

// `marks.link`/`marks.internalLink` are plain functions, not components registered anywhere —
// calling them directly is simpler than round-tripping through <PortableText>, and pins exactly
// the render-time guard #96 added: Studio's `rule.uri()` validation doesn't reach a document
// written straight against the Content Lake API, so this is the last line of defence.
const LinkMark = components.marks!.link!;
const InternalLinkMark = components.marks!.internalLink!;

function renderMark(Mark: typeof LinkMark, url: string | undefined) {
  return render(
    <MemoryRouter>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Mark value={{ url } as any} markType="link" renderNode={{} as any} text="Lenketekst">
        Lenketekst
      </Mark>
    </MemoryRouter>,
  );
}

describe('portableTextComponents — external link', () => {
  it('renders an https URL as an anchor', () => {
    renderMark(LinkMark, 'https://example.com');
    const anchor = screen.getByRole('link', { name: 'Lenketekst' });
    expect(anchor).toHaveAttribute('href', 'https://example.com');
    expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders an http URL as an anchor', () => {
    renderMark(LinkMark, 'http://example.com');
    expect(screen.getByRole('link', { name: 'Lenketekst' })).toBeInTheDocument();
  });

  it('drops a javascript: URL to plain text', () => {
    renderMark(LinkMark, 'javascript:alert(1)');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Lenketekst')).toBeInTheDocument();
  });

  it('drops a missing URL to plain text rather than throwing', () => {
    renderMark(LinkMark, undefined);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Lenketekst')).toBeInTheDocument();
  });
});

describe('portableTextComponents — internal link', () => {
  it('renders a known route pasted as a full absolute URL as a router Link', () => {
    renderMark(InternalLinkMark, 'https://mamf92.github.io/kalender');
    expect(screen.getByRole('link', { name: 'Lenketekst' })).toHaveAttribute('href', '/kalender');
  });

  it('renders a bare known path as a router Link', () => {
    renderMark(InternalLinkMark, '/våre-spill');
    expect(screen.getByRole('link', { name: 'Lenketekst' })).toHaveAttribute('href', '/våre-spill');
  });

  it('renders a known dynamic event path as a router Link', () => {
    renderMark(InternalLinkMark, '/arrangementer/some-event');
    expect(screen.getByRole('link', { name: 'Lenketekst' })).toHaveAttribute(
      'href',
      '/arrangementer/some-event',
    );
  });

  it('drops a path with no matching route to plain text', () => {
    renderMark(InternalLinkMark, '/not-a-real-route');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Lenketekst')).toBeInTheDocument();
  });

  it('drops an unparsable URL to plain text rather than throwing', () => {
    expect(() => renderMark(InternalLinkMark, 'not a url at all::')).not.toThrow();
  });
});
