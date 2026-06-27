import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiggyLogo } from '../../components/ui/PiggyLogo';

import GoogleIcon from '@mui/icons-material/Google';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import { SocialButton } from '../../components/ui/SocialButton';

import { Link } from 'react-router-dom';

export function LoginOptionsPage() {
  const navigate = useNavigate();
  
  return (
    <main className="flex flex-col items-center justify-center h-screen bg-primary-600">
      <div className="flex flex-col w-lg h-auto py-7 rounded-2xl shadow-lg items-center justify-center text-white bg-primary-500">
        <PiggyLogo size={100} />
        <h3 className="text-2xl text-shadow-sm font-bold tracking-wide mt-10">
          Bem-vindo(a) ao MyPiggy!
        </h3>
        <p className="text-sm text-shadow-sm mt-1 font-light">
          Escolha como deseja acessar sua conta.
        </p>

        <div className="flex flex-col items-center justify-center mt-10 gap-4 w-96">
          <SocialButton
            icon={<GoogleIcon />}
            label="Continuar com Google"
            disabled={true}
          />

          <SocialButton
            icon={<EmailOutlined />}
            label="Entrar com e-mail e senha"
            onClick={() => navigate('/login')}
            disabled={false}
          />
        </div>

        <p className='text-xs font-extralight mt-5'>Ainda não tem uma conta? <Link to="/register" className='underline text-black font-semibold'>Cadastre-se aqui!</Link></p>
      </div>
    </main>
  );
}
