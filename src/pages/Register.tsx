import { useLoaderData, useSearchParams } from 'react-router-dom';
import RegisterSection from '../components/sections/RegisterSection';
import type { Profile } from '../supabase/queryHelpers/getProfile';

export default function Register() {
  const { profile } = useLoaderData() as { profile: Profile | null };
  const [searchParams] = useSearchParams();

  return (
    <div className="dark:bg-darkestblue flex h-full min-h-[85vh] w-full flex-col items-center bg-white">
      <RegisterSection profile={profile} next={searchParams.get('neste')} />
    </div>
  );
}
