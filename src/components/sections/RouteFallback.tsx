import { Skeleton, SkeletonCard } from '../ui/Skeleton';

/**
 * What sits inside `<Outlet />` while a route has nothing to render yet: its loader is still
 * running on the first paint, or its code chunk is still in flight.
 *
 * A skeleton of the most common page shape (a heading, an intro line and a card grid) rather
 * than a spinner, so the page does not jump when it arrives. The sr-only label is what a screen
 * reader hears. Eagerly imported and free of data on purpose: it is what the app falls back to
 * when the network is slow, so it must never itself need fetching.
 */
export default function RouteFallback() {
  return (
    <div
      role="status"
      className="max-w-content mx-auto flex w-full flex-1 flex-col gap-6 px-4 py-12"
    >
      <span className="sr-only">Laster…</span>
      <Skeleton className="h-10 w-2/3 sm:w-1/2" />
      <Skeleton className="h-5 w-full sm:w-3/4" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard className="hidden lg:flex" />
      </div>
    </div>
  );
}
