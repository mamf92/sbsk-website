/**
 * Resolves a loader's promise to its value or to a failure flag, never a rejection.
 *
 * The point is partial rendering: a route that fetches two things should show the one that
 * arrived. Throwing is still the right move when a route has nothing to show without the data —
 * `eventDetailLoader` throws its 404 so `RouteError` can render one — so this is deliberately
 * opt-in per source rather than wrapped around every fetch.
 */
export async function settle<T>(promise: Promise<T>): Promise<{ data: T | null; failed: boolean }> {
  try {
    return { data: await promise, failed: false };
  } catch (error) {
    // Swallowed for the visitor, kept for whoever has to explain the empty section later.
    console.error('Loader source failed:', error);
    return { data: null, failed: true };
  }
}
