import { Suspense } from 'react';
import { Outlet, useLoaderData, useSearchParams } from 'react-router-dom';
import MemberDashboardTop from '../components/sections/AdminPortalSection/MemberDashboardTop';
import MemberNav from '../components/sections/MemberPortalSection/MemberNav';
import RouteFallback from '../components/sections/RouteFallback';
import { Alert } from '../components/ui/Alert';
import type { MemberPortalData } from '../loaders/member-portal-loader';

/**
 * `/medlemsportal` (Min side): the same top band as Styreportal, with the member's tabs under it.
 */
export default function MemberPortal() {
  const { profile, me, activity } = useLoaderData() as MemberPortalData;
  const [searchParams] = useSearchParams();
  // Set by `requireAdminSession` when it bounces a signed-in non-admin here (#82).
  const notAdmin = searchParams.get('reason') === 'not_admin';

  return (
    <div className="dark:bg-darkestblue min-h-[60vh] bg-white">
      <MemberDashboardTop profile={profile} me={me} activity={activity} />
      <MemberNav />
      <div className="max-w-content mx-auto flex w-full flex-col gap-4 px-4 py-8">
        {notAdmin && <Alert tone="info">Du har ikke administratortilgang til styreportalen.</Alert>}
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
