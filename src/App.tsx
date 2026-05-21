import { Outlet } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { ThemeProvider } from './hooks/ThemeProvider';

export default function App() {
  return (
    <ThemeProvider>
      <a
        href="#main"
        className="sr-only rounded bg-white px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </ThemeProvider>
  );
}
