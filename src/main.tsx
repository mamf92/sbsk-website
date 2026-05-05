import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
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
import Login from './pages/Login';
import MyProfile from './pages/MyProfile';
import BoardPortal from './pages/BoardPortal';
import NotFound from './pages/NotFound';
import { initTheme } from './utils/theme';
import StudioRoute from './pages/Studio';
import { homeLoader } from './loaders/home';
import { eventsListLoader, eventDetailLoader } from './sanity/queryHelpers/events';

initTheme();

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <Home />, loader: homeLoader },
        { path: 'kalender', element: <Calendar /> },
        { path: 'board-game-masters', element: <BoardGameMasters /> },
        { path: 'våre-spill', element: <OurGames /> },
        { path: 'om-oss', element: <AboutUs /> },
        { path: 'kontakt-oss', element: <ContactUs /> },
        { path: 'bli-medlem', element: <BecomeAMember /> },
        { path: 'arrangementer', element: <Events />, loader: eventsListLoader },
        { path: 'arrangementer/:id', element: <Event />, loader: eventDetailLoader },
        { path: 'våre-partnere', element: <OurPartners /> },
        { path: 'login', element: <Login /> },
        { path: 'min-profil', element: <MyProfile /> },
        { path: 'styreportal', element: <BoardPortal /> },
        {
          path: 'studio',
          children: [
            { index: true, element: <StudioRoute /> },
            { path: '*', element: <StudioRoute /> },
          ],
        },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  { basename: import.meta.env.VITE_BASE },
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
