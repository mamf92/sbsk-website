import { Outlet } from 'react-router-dom';

export default function Home() {
  return (
    <>
      <main className="dark:bg-darkestblue min-h-[60vh] bg-white dark:text-white">
        <div className="text-orange font-heading text-6xl font-bold">Stavanger Brettspillklubb</div>
        <Outlet />
      </main>
    </>
  );
}
