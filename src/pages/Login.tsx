import LoginSection from '../components/sections/LoginSection';
import { useSearchParams } from 'react-router-dom';

export default function Login() {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason') || undefined;
  const next = searchParams.get('neste') || undefined;

  return (
    <div className="dark:bg-darkestblue flex h-full min-h-[85vh] w-full flex-col items-center bg-white">
      <LoginSection reason={reason} next={next} />
    </div>
  );
}
