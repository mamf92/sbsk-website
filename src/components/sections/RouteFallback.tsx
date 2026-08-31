import { LoadingIndicator } from '../ui/LoadingIndicator';

/**
 * What sits inside `<Outlet />` while a route has nothing to render yet — either its loader is
 * still running on the very first paint, or its code chunk is still in flight.
 *
 * Both cases are wired to this in `src/main.tsx` and `src/App.tsx`. Eagerly imported on purpose,
 * and deliberately free of loaders and data: it is what the app falls back to when the network
 * is slow, so it must never itself be something that has to be fetched first.
 */
export default function RouteFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-12">
      <LoadingIndicator label="Laster…" />
    </div>
  );
}
