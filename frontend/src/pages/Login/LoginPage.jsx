import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

import api from '../../services/api';

import { PiggyLogo } from '../../components/ui/PiggyLogo';
import { SocialButton } from '../../components/ui/SocialButton';
import { InputField } from '../../components/ui/InputField';

import GoogleIcon from '@mui/icons-material/Google';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido').max(100, 'Máximo de 100 caracteres'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres').max(72, 'Máximo de 72 caracteres'),
});

export function LoginPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useAuth();
  const [apiError, setApiError] = useState('');

  // Avisos vindos de outras telas (cadastro concluído / sessão expirada) viram toast
  // uma única vez; depois a URL e o state são limpos para não reaparecerem ao recarregar
  useEffect(() => {
    const successMessage = location.state?.message;
    const isExpired = searchParams.get('expired') === 'true';

    if (successMessage) {
      toast.success(successMessage);
      navigate(location.pathname, { replace: true, state: null });
    }
    if (isExpired) {
      toast.warning('Sua sessão expirou. Por favor, faça login novamente.');
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data) {
    setApiError('');
    try {
      const response = await api.post('/auth/login', {
        ...data,
        email: data.email.toLowerCase(),
      });
      const { token, id, name, email } = response.data.data;
      login(token, { id, name, email });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setApiError(error.response?.data?.message || 'Erro ao fazer login, tente novamente.');
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-dvh px-4 py-6 bg-primary-600">
      <div className="flex flex-col w-full max-w-lg h-auto py-7 px-4 rounded-2xl shadow-lg items-center justify-center text-white bg-primary-500">
        <PiggyLogo size={80} />
        <h1 className="text-xl sm:text-2xl text-shadow-sm font-bold tracking-wide mt-5 text-center">
          Bem-vindo(a) de volta!
        </h1>
        <p className="text-sm text-shadow-sm mt-1 font-light text-center">
          O Piggy sentiu sua falta.
        </p>

        <div className="flex flex-col items-center justify-center w-full max-w-sm gap-4 mt-5">
          <SocialButton
            icon={<GoogleIcon />}
            label="Continuar com Google"
            disabled={true}
          />

          <span className="text-sm text-shadow-sm mt-1 font-bold">OU</span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 w-full max-w-sm">
          <InputField
            label="Seu e-mail"
            type="email"
            placeholder="seu@email.com"
            icon={<EmailOutlined fontSize="small" />}
            register={register('email')}
            error={errors.email?.message}
            maxLength={100}
            autoComplete="email"
          />

          <InputField
            label="Sua senha"
            type="password"
            placeholder="••••••••"
            icon={<LockOutlined fontSize="small" />}
            register={register('password')}
            error={errors.password?.message}
            maxLength={72}
            autoComplete="current-password"
            allowPasswordToggle
          />

          {/* Ainda sem função (como antes), mas agora focável por teclado */}
          <button
            type="button"
            className="self-start text-xs text-white hover:underline hover:cursor-pointer"
          >
            Esqueceu sua senha?
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-lg bg-black text-white font-semibold shadow-md hover:bg-gray-900 hover:cursor-pointer disabled:opacity-50 transition-colors mt-5"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>

          {apiError && (
            <p role="alert" className="text-red-900 text-xs font-semibold text-center">{apiError}</p>
          )}
        </form>

        <p className="text-xs font-light mt-4 text-center">
          É novo por aqui?{' '}
          <Link to="/register" className="underline text-black font-semibold">
            Cadastre-se!
          </Link>
        </p>
      </div>
    </main>
  );
}