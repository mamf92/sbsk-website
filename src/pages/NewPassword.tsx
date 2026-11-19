import { useLoaderData } from 'react-router-dom';
import NewPasswordSection from '../components/sections/NewPasswordSection';

/** `/nytt-passord`: where the recovery email lands. */
export default function NewPassword() {
  const { linkValid } = useLoaderData() as { linkValid: boolean };
  return (
    <div className="dark:bg-darkestblue flex h-full min-h-[85vh] w-full flex-col items-center bg-white">
      <NewPasswordSection linkValid={linkValid} />
    </div>
  );
}
