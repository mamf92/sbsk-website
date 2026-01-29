import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App';
import Home from './pages/Home';
import LargeEvent from './pages/LargeEvent';
import SmallEvent from './pages/SmallEvent';
import OurGames from './pages/OurGames';
import BecomeAMember from './pages/BecomeAMember';
import NotFound from './pages/NotFound';
import { initTheme } from './utils/theme';

initTheme();

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'largeevent', element: <LargeEvent /> },
      { path: 'smallevent', element: <SmallEvent /> },
      { path: 'ourgames', element: <OurGames /> },
      { path: 'becomeamember', element: <BecomeAMember /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
