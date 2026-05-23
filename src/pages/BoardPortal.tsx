import BoardPoartalSection from '../components/sections/BoardPortalSection/BoardPortalSection';
import type { Profile } from '../supabase/queryHelpers/getProfil';

const exampleMember: Profile = {
  name: 'Ola',
  surname: 'Nordmann',
  email: 'ola.nordmann@example.com',
  address: '123 Main Street',
  city: 'Oslo',
  is_admin: false,
  created_at: '2024-01-01T00:00:00Z',
  id: 'example-id',
  photo_url: null,
  bio: null,
};

export default function BoardPortal() {
  return (
    <>
      <div className="dark:bg-darkestblue min-h-[60vh] bg-white">
        <BoardPoartalSection member={exampleMember} />
      </div>
    </>
  );
}
