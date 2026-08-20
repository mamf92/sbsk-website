import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AuthProvider from './hooks/authContext/authProvider';
import './index.css';
import App from './App';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import BoardGameMasters from './pages/BoardGameMasters';
import OurGames from './pages/OurGames';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import BecomeAMember from './pages/BecomeAMember';
import Event from './pages/SingleEventPage';
import Events from './pages/Events';
import OurPartners from './pages/OurPartners';
import Register from './pages/Register';
import Login from './pages/Login';
import MemberPortal from './pages/MemberPortal';
import BoardPortal from './pages/BoardPortal';
import NotFound from './pages/NotFound';
import { initTheme } from './utils/theme';
import StudioRoute from './pages/StudioRoute';
import RouteError from './components/sections/RouteError';
import { homeLoader } from './loaders/home-loader';
import { eventsListLoader, eventDetailLoader } from './sanity/queryHelpers/events';
import { calendarLoader } from './loaders/calendar-loader';
import { boardPortalLoader } from './loaders/board-portal-loader';
import { memberPortalLoader } from './loaders/member-portal-loader';

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
          children: [
            { index: true, element: <Home />, loader: homeLoader },
            { path: 'kalender', element: <Calendar />, loader: calendarLoader },
            { path: 'board-game-masters', element: <BoardGameMasters /> },
            { path: 'våre-spill', element: <OurGames /> },
            { path: 'om-oss', element: <AboutUs /> },
            { path: 'kontakt-oss', element: <ContactUs /> },
            { path: 'bli-medlem', element: <BecomeAMember /> },
            { path: 'arrangementer', element: <Events />, loader: eventsListLoader },
            { path: 'arrangementer/:id', element: <Event />, loader: eventDetailLoader },
            { path: 'våre-partnere', element: <OurPartners /> },
            { path: 'lag-medlemsprofil', element: <Register /> },
            { path: 'login', element: <Login /> },
            { path: 'medlemsportal', element: <MemberPortal />, loader: memberPortalLoader },
            { path: 'styreportal', element: <BoardPortal />, loader: boardPortalLoader },
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
