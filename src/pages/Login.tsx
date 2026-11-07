import LoginSection from '../components/sections/LoginSection';
import { useSearchParams } from 'react-router-dom';

export default function Login() {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason') || undefined;

  return (
    <div className="bg-page text-fg flex h-full min-h-[85vh] w-full flex-col items-center">
      <LoginSection reason={reason} />
    </div>
  );
}
