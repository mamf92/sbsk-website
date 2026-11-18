import { useLoaderData } from 'react-router-dom';
import AdminCheckInSection from '../components/sections/AdminPortalSection/AdminCheckInSection';
import type { adminCheckInEventLoader } from '../loaders/admin-portal-loaders';

export default function AdminCheckIn() {
  const data = useLoaderData<typeof adminCheckInEventLoader>();
  // Keyed by event so moving between two events resets the optimistic state.
  return <AdminCheckInSection key={data.event._id} {...data} />;
}
