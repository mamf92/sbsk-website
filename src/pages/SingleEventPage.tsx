import { useLoaderData } from 'react-router-dom';
import type { SanityDocument } from '@sanity/client';

export default function SmallEvent() {
  const { event } = useLoaderData() as { event: SanityDocument };

  return (
    <>
      <main className="dark:bg-darkestblue min-h-[60vh] bg-white dark:text-white">
        <div className="text-orange font-heading text-6xl font-bold">Arrangement</div>
        <h1 className="mb-8 text-4xl font-bold">{event.title}</h1>
      </main>
    </>
  );
}
