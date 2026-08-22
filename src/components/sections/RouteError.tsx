import { useEffect } from 'react';
import { isRouteErrorResponse, useNavigate, useRouteError, useRevalidator } from 'react-router-dom';
import ErrorState from './ErrorState';

/**
 * What a route renders when its loader throws or its element crashes.
 *
 * Without an `errorElement` React Router falls back to its own developer screen — a stack trace
 * on a white page, with the shell's header and footer gone, so the visitor cannot even navigate
 * away. That is what #160 put in front of anyone with an upcoming event to see: one undefined
 * field took down the entire page.
 *
 * This is wired per child route rather than on the shell route, which matters: an `errorElement`
 * on the parent replaces the parent's own element, taking `Header` and `Footer` with it. Attached
 * to the children, the error renders inside `<Outlet />` and the site's furniture survives.
 */
export default function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();
  const revalidator = useRevalidator();

  // A loader throwing `new Response(..., { status: 404 })` is a missing *thing* — an event slug
  // that does not resolve — which is the same thing to a visitor as a missing page. Anything
  // else is a fault on our side and must not claim the content does not exist.
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  useEffect(() => {
    document.title = notFound
      ? '404 – Stavanger Brettspillklubb'
      : 'Noe gikk galt – Stavanger Brettspillklubb';
    return () => {
      document.title = 'Stavanger Brettspillklubb';
    };
  }, [notFound]);

  // Worth keeping in the console: the visitor gets prose, but a fault still needs to be
  // diagnosable from a bug report that says only "it broke".
  useEffect(() => {
    if (!notFound) console.error('Route error:', error);
  }, [error, notFound]);

  if (notFound) {
    return (
      <ErrorState
        code="404"
        onPrimary={() => navigate('/')}
        onSecondary={() => navigate('/kalender')}
      />
    );
  }

  return (
    <ErrorState
      code="!"
      eyebrow="Feil"
      title="Noe gikk galt hos oss"
      body="Vi klarte ikke å hente innholdet på denne siden. Det er som regel forbigående – prøv igjen om et øyeblikk, eller gå til forsiden."
      primaryLabel="Prøv igjen"
      secondaryLabel="Til forsiden"
      // Re-running the loader beats a full reload: it refetches without throwing the bundle away,
      // so a visitor who hits a blip keeps their place instead of starting the app over.
      onPrimary={() => revalidator.revalidate()}
      onSecondary={() => navigate('/')}
    />
  );
}
