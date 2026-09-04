import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AuthProvider from './hooks/authContext/authProvider';
import './index.css';
import App from './App';
import Home from './pages/Home';
import { initTheme } from './utils/theme';
import StudioRoute from './pages/StudioRoute';
import RouteError from './components/sections/RouteError';
import RouteFallback from './components/sections/RouteFallback';
import { homeLoader } from './loaders/home-loader';
import { eventsListLoader, eventDetailLoader } from './sanity/queryHelpers/events';
import { calendarLoader } from './loaders/calendar-loader';
import { ourGamesLoader } from './loaders/our-games-loader';
import { aboutUsLoader } from './loaders/about-us-loader';
import { boardPortalLoader } from './loaders/board-portal-loader';
import { memberPortalLoader } from './loaders/member-portal-loader';
import { memberPortalEnabled } from './utils/featureFlags';

// Every page below the home page is its own chunk. Lighthouse measured ~58% of the entry bundle
// unused on the home page (#222) — that was thirteen other pages' markup and component trees,
// downloaded and parsed before anything could paint. `<Suspense>` in `App` is what these resolve
// against; React Router runs navigations inside a transition, so the fallback only ever shows on
// a cold load of one of these URLs, never as a flash mid-navigation.
//
// `Home` is deliberately *not* lazy: it is the route the overwhelming majority of visits land on,
// and splitting it would put a second round trip in front of the LCP element this change exists
// to speed up. Loaders stay eager for the same reason — they are small, they are shared, and a
// lazy loader could not start fetching until its chunk had arrived.
//
// `RouteError` and `RouteFallback` are eager on purpose: see their own doc comments.
const Calendar = React.lazy(() => import('./pages/Calendar'));
const BoardGameMasters = React.lazy(() => import('./pages/BoardGameMasters'));
const OurGames = React.lazy(() => import('./pages/OurGames'));
const AboutUs = React.lazy(() => import('./pages/AboutUs'));
const ContactUs = React.lazy(() => import('./pages/ContactUs'));
const BecomeAMember = React.lazy(() => import('./pages/BecomeAMember'));
const Event = React.lazy(() => import('./pages/SingleEventPage'));
const Events = React.lazy(() => import('./pages/Events'));
const OurPartners = React.lazy(() => import('./pages/OurPartners'));
const Register = React.lazy(() => import('./pages/Register'));
const Login = React.lazy(() => import('./pages/Login'));
const MemberPortal = React.lazy(() => import('./pages/MemberPortal'));
const BoardPortal = React.lazy(() => import('./pages/BoardPortal'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

initTheme();

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      // A failure in the shell itself has no <Outlet /> left to render into, so it needs its own
      // boundary. This is the only case that loses the header and footer.
      errorElement: <RouteError />,
      children: [
        {
          // Pathless, so it adds no segment and renders a bare <Outlet />. Its only job is to be
          // the error boundary every page below shares. It has to sit *inside* App rather than on
          // it: an errorElement replaces the element of the route it is attached to, so putting
          // this on the route above would take Header and Footer down with the page.
          errorElement: <RouteError />,
          // The same reasoning, for the other of the two states a route can be in before it has
          // anything to show. On the first paint the matched page's loader has not resolved yet,
          // and React Router renders the nearest hydrate fallback while it runs — with none
          // anywhere on the tree it renders nothing and warns "No `HydrateFallback` element
          // provided to render during initial hydration" (#222). Attached here rather than to
          // the shell route for the same reason as the errorElement: a fallback on the route
          // above would replace `<App />` and blank the header and footer on every cold load.
          hydrateFallbackElement: <RouteFallback />,
          children: [
            { index: true, element: <Home />, loader: homeLoader },
            { path: 'kalender', element: <Calendar />, loader: calendarLoader },
            { path: 'board-game-masters', element: <BoardGameMasters /> },
            { path: 'våre-spill', element: <OurGames />, loader: ourGamesLoader },
            { path: 'om-oss', element: <AboutUs />, loader: aboutUsLoader },
            { path: 'kontakt-oss', element: <ContactUs /> },
            { path: 'bli-medlem', element: <BecomeAMember /> },
            { path: 'arrangementer', element: <Events />, loader: eventsListLoader },
            { path: 'arrangementer/:id', element: <Event />, loader: eventDetailLoader },
            { path: 'våre-partnere', element: <OurPartners /> },
            // Gated behind #213: no member/board portal for the MVP launch, so these four
            // routes are absent from the production build and fall through to the catch-all
            // 404 below. `memberPortalEnabled` is true in unit tests and the Playwright config
            // so the pages stay covered while hidden. Re-enable by setting
            // VITE_ENABLE_MEMBER_PORTAL=true at build time.
            ...(memberPortalEnabled
              ? [
                  { path: 'lag-medlemsprofil', element: <Register /> },
                  { path: 'login', element: <Login /> },
                  {
                    path: 'medlemsportal',
                    element: <MemberPortal />,
                    loader: memberPortalLoader,
                  },
                  { path: 'styreportal', element: <BoardPortal />, loader: boardPortalLoader },
                ]
              : []),
            { path: 'studio/*', element: <StudioRoute /> },
            { path: '*', element: <NotFound /> },
          ],
        },
      ],
    },
  ],
  { basename: import.meta.env.VITE_BASE },
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);
