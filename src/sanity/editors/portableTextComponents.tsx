import { type PortableTextComponents } from '@portabletext/react';
import { Link } from 'react-router-dom';
import { PostImageComponent } from './postsImageComponent';

export const components: PortableTextComponents = {
  types: {
    image: PostImageComponent,
  },
  block: {
    normal: ({ children }) => <p className="font-body text-base">{children}</p>,
    // `clear-both`: a heading has to start its own line below a pending float rather than
    // squeeze beside it — whichever side an editor floated an inline image to (`postsImageComponent.tsx`),
    // and below the carousel's own left float (`PostsSection.tsx`) once a post has one.
    h2: ({ children }) => (
      <h2 className="font-heading clear-both text-2xl font-bold">{children}</h2>
    ),
    h3: ({ children }) => <h3 className="font-heading clear-both text-xl font-bold">{children}</h3>,
  },
  list: {
    // Lists don't need clearing: their `pl-5` marker inset doesn't collide with a float on
    // either side, so a bullet list is free to wrap the same way a paragraph does.
    bullet: ({ children }) => <ul className="list-disc pl-5">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal pl-5">{children}</ol>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    underline: ({ children }) => <u className="underline">{children}</u>,
    link: ({ value, children }) => {
      return (
        <a href={value.url} target="_blank" rel="noopener noreferrer" className="underline">
          {children}
        </a>
      );
    },
    internalLink: ({ value, children }) => {
      if (!value?.url) return <>{children}</>;
      const path = new URL(value.url, window.location.href).pathname;
      return <Link to={path}>{children}</Link>;
    },
  },
};
