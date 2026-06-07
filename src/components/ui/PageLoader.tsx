import { useNavigation } from 'react-router-dom';
import Logo from '../../assets/logos/dicelogo.png';

export default function PageLoader() {
  const navigation = useNavigation();

  if (navigation.state === 'idle') return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-darkblue/70 fixed inset-0 z-9999 flex items-center justify-center backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-4">
        <img
          src={Logo}
          alt=""
          aria-hidden="true"
          className="w-16 animate-spin"
          style={{ animationDuration: '1.2s' }}
        />
        <span className="font-heading text-sm tracking-widest text-white uppercase">Laster...</span>
      </div>
    </div>
  );
}
