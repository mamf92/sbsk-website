import { Outlet } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { ThemeProvider } from './hooks/theme/ThemeProvider';

export default function App() {
  return (
    <ThemeProvider>
      <div className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only rounded-none bg-white px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex flex-1 flex-col">
          <Outlet />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
