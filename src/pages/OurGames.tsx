import { Outlet } from 'react-router-dom';

export default function Home() {
  return (
    <>
      <main className="min-h-[60vh] bg-white">
        <div className="text-darkestblue font-heading text-6xl font-bold">
          Stavanger Brettspillklubb
        </div>
        <Outlet />
      </main>
    </>
  );
}
