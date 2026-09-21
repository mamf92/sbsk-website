import { Suspense } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import RouteFallback from './components/sections/RouteFallback';

export default function App() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Nothing reset the scroll position on navigation, so going home from the bottom of a
          long page landed you on the new page still at footer level — the page had changed and
          the view had not, which reads as nothing having happened (#253). This jumps to the top
          on a new navigation and restores the previous offset on back/forward, which is what
          a visitor expects of each. It sits above the shell rather than in a page, because the
          behaviour belongs to every route. Deliberately instant: see `useGoHome`. */}
      <ScrollRestoration />
      <a
        href="#main"
        className="sr-only rounded-none bg-white px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex flex-1 flex-col">
        {/* Every page but Home is a lazy chunk (see src/main.tsx). This boundary is what they
            resolve against, and it sits inside <main> so the header and footer stay put while
            a chunk lands. React Router navigates inside a transition, so React holds the
            outgoing page on screen rather than showing this — it appears on a cold load of a
            split route and nowhere else. */}
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
