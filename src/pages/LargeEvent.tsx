import { Outlet } from "react-router-dom";

export default function LargeEvent() {
  return (
    <>
      <main className="bg-amber-600 min-h-[60vh]">
        <div className="p-6 text-white bg-emerald-600">Arrangementoverskrift</div>
        <Outlet />
      </main>
    </>
  );
}
