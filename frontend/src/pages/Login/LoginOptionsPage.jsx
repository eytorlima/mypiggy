import { useNavigate, Link } from 'react-router-dom';
import { PiggyLogo } from '../../components/ui/PiggyLogo';

import GoogleIcon from '@mui/icons-material/Google';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import { SocialButton } from '../../components/ui/SocialButton';

export function LoginOptionsPage() {
  const navigate = useNavigate();

  return (
    <main className="flex flex-col items-center justify-center min-h-dvh px-4 py-6 bg-primary-600">
      <div className="flex flex-col w-full max-w-lg h-auto py-7 px-4 rounded-2xl shadow-lg items-center justify-center text-white bg-primary-500">
        <PiggyLogo size={100} />
        <h1 className="text-xl sm:text-2xl text-shadow-sm font-bold tracking-wide mt-6 sm:mt-10 text-center">
          Bem-vindo(a) ao MyPiggy!
        </h1>
        <p className="text-sm text-shadow-sm mt-1 font-light text-center">
          Escolha como deseja acessar sua conta.
        </p>

        <div className="flex flex-col items-center justify-center mt-6 sm:mt-10 gap-4 w-full max-w-sm">
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

        <p className="text-xs font-light mt-5 text-center">
          Ainda não tem uma conta?{' '}
          <Link to="/register" className="underline text-black font-semibold">
            Cadastre-se aqui!
          </Link>
        </p>
      </div>
    </main>
  );
}