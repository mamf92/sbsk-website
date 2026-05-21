import { type PortableTextComponents } from '@portabletext/react';
import { Link } from 'react-router-dom';
import { PostImageComponent } from './postsImageComponent';

export const components: PortableTextComponents = {
  types: {
    image: PostImageComponent,
  },
  block: {
    normal: ({ children }) => <p className="font-body text-base">{children}</p>,
    h2: ({ children }) => <h2 className="font-heading text-2xl font-bold">{children}</h2>,
    h3: ({ children }) => <h3 className="font-heading text-xl font-bold">{children}</h3>,
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc pl-5">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal pl-5">{children}</ol>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    underline: ({ children }) => <u className="underline">{children}</u>,
    link: ({ value, children }) => {
      return (
        <a
          href={value.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
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
