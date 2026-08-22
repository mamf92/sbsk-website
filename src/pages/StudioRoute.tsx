import { lazy, Suspense } from 'react';
import { LoadingIndicator } from '../components/ui/LoadingIndicator';

// The Sanity Studio pulls in several MB of editor code. Loading it lazily keeps
// it out of the public site's entry bundle — only /studio visitors pay for it.
// Keep this indirection: importing ./Studio directly anywhere that is reachable
// from src/main.tsx puts the Studio back into the eager graph.
const Studio = lazy(() => import('./Studio'));

export default function StudioRoute() {
  return (
    <Suspense fallback={<LoadingIndicator label="Laster studio…" className="p-6" />}>
      <Studio />
    </Suspense>
  );
}
