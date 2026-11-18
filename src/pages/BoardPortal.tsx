import { Suspense } from 'react';
import { Link, Outlet, useLoaderData } from 'react-router-dom';
import AdminNav from '../components/sections/AdminPortalSection/AdminNav';
import MemberDashboardTop from '../components/sections/AdminPortalSection/MemberDashboardTop';
import RouteFallback from '../components/sections/RouteFallback';
import { buttonClasses } from '../components/ui/buttonClasses';
import type { adminPortalLoader } from '../loaders/admin-portal-loaders';

/**
 * `/styreportal`: the member page's top band (Martin: "look a lot like the members page") with
 * the board's tabs underneath. Each tab is a nested route, so its own loader refreshes only its
 * own data, and the door check-in has a URL of its own.
 */
export default function BoardPortal() {
  const { profile, me, activity } = useLoaderData<typeof adminPortalLoader>();
  return (
    <div className="dark:bg-darkestblue min-h-[60vh] bg-white">
      <MemberDashboardTop
        profile={profile}
        me={me}
        activity={activity}
        actions={
          <Link to="/studio" className={buttonClasses({ variant: 'outline', size: 'sm' })}>
            Innholdsredigering
          </Link>
        }
      />
      <AdminNav />
      <div className="max-w-content mx-auto w-full px-4 py-8">
        {/* The tabs are their own chunks; without this boundary a cold load of one would
            suspend up to the app shell and blank the band above. */}
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
