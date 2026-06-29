import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';

import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import api from '../../services/api';

import { PiggyLogo } from '../../components/ui/PiggyLogo';
import { SocialButton } from '../../components/ui/SocialButton';
import { InputField } from '../../components/ui/InputField';

import GoogleIcon from '@mui/icons-material/Google';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

export function LoginPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';
  const successMessage = location.state?.message;
  const navigate = useNavigate();
  const { login } = useAuth();
  const [apiError, setApiError] = useState('');

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
    <main className="flex flex-col items-center justify-center h-screen bg-primary-600">
        {successMessage && (
          <div className="absolute top-0 flex items-center gap-2 bg-black border-2 border-primary-900 shadow-md 
          font-normal text-white text-sm px-3 py-2 rounded-lg w-auto mt-8">
            <span>✓</span>
            <p>{successMessage}</p>
          </div>
        )} 

        {isExpired && (
          <div className="absolute top-0 flex items-center gap-2 bg-yellow-100 border-2 border-yellow-800 shadow-md 
          font-normal text-yellow-800 text-sm px-3 py-2 rounded-lg w-auto mt-8">
            <span>⚠</span>
            <p>Sua sessão expirou. Por favor, faça login novamente.</p>
          </div>
        )}

      <div className="flex flex-col w-lg h-auto py-7 rounded-2xl shadow-lg items-center justify-center text-white bg-primary-500">
        <PiggyLogo size={80} />
        <h3 className="text-2xl text-shadow-sm font-bold tracking-wide mt-5">
          Bem-vindo(a) de volta!
        </h3>
        <p className="text-sm text-shadow-sm mt-1 font-light">
          O Piggy sentiu sua falta.
        </p>

        <div className="flex flex-col items-center justify-center w-96 gap-4 mt-5">
          <SocialButton
            icon={<GoogleIcon />}
            label="Continuar com Google"
            disabled={true}
          />

          <span className="text-sm text-shadow-sm mt-1 font-bold">OU</span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 w-96">
          <InputField
            label="Seu e-mail"
            type="email"
            placeholder="seu@email.com"
            icon={<EmailOutlined fontSize="small" />}
            register={register('email')}
            error={errors.email?.message}
          />

          <InputField
            label="Sua senha"
            type="password"
            placeholder="••••••••"
            icon={<LockOutlined fontSize="small" />}
            register={register('password')}
            error={errors.password?.message}
          />

          {/* Esqueceu a senha — não funcional */}
          <span className="text-xs text-left text-white cursor-pointer hover:underline">
            Esqueceu sua senha?
          </span>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-lg bg-black text-white font-semibold shadow-md hover:bg-gray-900 hover:cursor-pointer disabled:opacity-50 transition-colors mt-5"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>

          {/* Erro da API */}
          {apiError && (
            <p className="text-red-700 text-xs text-center">{apiError}</p>
          )}
       </form>

        <p className='text-xs font-extralight mt-4'>É novo por aqui? <Link to="/register" className='underline text-black font-semibold'>Cadastre-se!</Link></p>
      </div>
    </main>
  );
}
