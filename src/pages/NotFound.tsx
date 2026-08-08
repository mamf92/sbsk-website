import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorState from '../components/sections/ErrorState';

export default function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = '404 – Stavanger Brettspillklubb';
    return () => {
      document.title = 'Stavanger Brettspillklubb';
    };
  }, []);

  return (
    <ErrorState
      variant="dark"
      code="404"
      onPrimary={() => navigate('/')}
      onSecondary={() => navigate('/kalender')}
    />
  );
}
