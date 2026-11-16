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
    // Tocar/clicar em qualquer lugar também avança, sem esperar os 3 segundos
    <main
      className="flex flex-col items-center justify-center min-h-dvh px-4 bg-primary-500 gap-6"
      onClick={() => navigate('/login-options')}
    >
      <PiggyLogo size={150} />
      <div className="text-center text-white">
        <h1 className="text-4xl sm:text-5xl text-shadow-lg font-bold tracking-wide">MyPiggy</h1>
        <p className="text-lg sm:text-xl text-shadow-lg mt-4 font-normal">
          Sua gestão financeira pessoal.
        </p>
      </div>
    </main>
  );
}