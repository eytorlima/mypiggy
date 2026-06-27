import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiggyLogo } from '../../components/ui/PiggyLogo';

export function WelcomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login-options');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-primary-500 gap-6">
      <PiggyLogo size={150} />
      <div className="text-center text-white">
        <h1 className="text-5xl text-shadow-lg font-bold tracking-wide">MyPiggy</h1>
        <p className="text-xl text-shadow-lg mt-4 font-normal">
          Sua gestão financeira pessoal.
        </p>
      </div>
    </div>
  );
}
