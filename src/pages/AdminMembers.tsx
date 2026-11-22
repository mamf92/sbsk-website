import { useLoaderData } from 'react-router-dom';
import AdminMembersSection from '../components/sections/AdminPortalSection/AdminMembersSection';
import ApplicationsPanel from '../components/sections/AdminPortalSection/ApplicationsPanel';
import type { adminMembersLoader } from '../loaders/admin-portal-loaders';

export default function AdminMembers() {
  const { members, seasonStatus, applications } = useLoaderData<typeof adminMembersLoader>();
  return (
    <div className="flex flex-col gap-6">
      <ApplicationsPanel applications={applications} />
      <AdminMembersSection members={members} seasonStatus={seasonStatus} />
    </div>
  );
}
