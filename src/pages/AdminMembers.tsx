import { useLoaderData } from 'react-router-dom';
import AdminMembersSection from '../components/sections/AdminPortalSection/AdminMembersSection';
import type { adminMembersLoader } from '../loaders/admin-portal-loaders';

export default function AdminMembers() {
  const { members, seasonStatus } = useLoaderData<typeof adminMembersLoader>();
  return <AdminMembersSection members={members} seasonStatus={seasonStatus} />;
}
