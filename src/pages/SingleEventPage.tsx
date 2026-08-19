import { useLoaderData } from 'react-router-dom';
import type { SanityDocument } from '@sanity/client';

export default function SmallEvent() {
  const { event } = useLoaderData() as { event: SanityDocument };

  return (
    <div className="dark:bg-darkestblue min-h-[60vh] bg-white dark:text-white">
      <div className="text-orange font-heading text-h2 font-bold">Arrangement</div>
      <h1 className="text-h1 mb-8 font-bold">{event.title}</h1>
    </div>
  );
}
