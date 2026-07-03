import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useNavigate, Link } from 'react-router-dom';

import api from '../../services/api';

import { PiggyLogo } from '../../components/ui/PiggyLogo';
import { SocialButton } from '../../components/ui/SocialButton';
import { InputField } from '../../components/ui/InputField';

import GoogleIcon from '@mui/icons-material/Google';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import LockOpenOutlined from '@mui/icons-material/LockOpenOutlined';

const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  cpf: z.string()
    .transform(val => val.replace(/\D/g, ''))
    .pipe(z.string().length(11, 'CPF deve ter 11 dígitos')),
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Deve conter pelo menos um número')
    .regex(/[^a-zA-Z0-9]/, 'Deve conter pelo menos um caractere especial'),
  confirmPassword: z.string(),
  privacyAccepted: z.boolean().refine(val => val === true, {
    message: 'Você precisa aceitar a Política de Privacidade para continuar',
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export function RegisterPage() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data) {
    setApiError('');
    try {
      await api.post('/auth/register', {
        name: data.name,
        email: data.email.toLowerCase(),
        cpf: data.cpf,       // já vem limpo pelo .transform() do Zod
        password: data.password,
      });
      navigate('/login', { state: { message: 'Cadastro realizado com sucesso! Faça seu login.' } });
    } catch (error) {
      setApiError(error.response?.data?.message || 'Erro ao cadastrar, tente novamente.');
    }
  }

  return (
    <main className="flex flex-col items-center justify-center h-screen bg-primary-600">
      <div className="flex flex-col w-lg h-auto py-5 rounded-2xl shadow-lg items-center justify-center text-white bg-primary-500">
        <h3 className="text-md mt-2 text-shadow-sm font-bold tracking-wide">
          Bem-vindo(a) ao MyPiggy!
        </h3>
        <p className="text-xs text-shadow-sm mt-1 font-light">
          Vamos administrar suas finanças?
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-1 w-96 h-auto gap-2 mt-5">

          <InputField
            label="Nome completo"
            type="text"
            placeholder="João Silva"
            icon={<PersonOutlined fontSize="small" />}
            register={register('name')}
            error={errors.name?.message}
            size="sm"
          />

          <InputField
            label="Seu e-mail"
            type="email"
            placeholder="seu@email.com"
            icon={<EmailOutlined fontSize="small" />}
            register={register('email')}
            error={errors.email?.message}
            size="sm"
          />

          <InputField
            label="CPF"
            type="text"
            placeholder="000.000.000-00"
            icon={<BadgeOutlined fontSize="small" />}
            register={{
              ...register('cpf'),
              onChange: (e) => {
                const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
                const masked = raw
                  .replace(/(\d{3})(\d)/, '$1.$2')
                  .replace(/(\d{3})(\d)/, '$1.$2')
                  .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                e.target.value = masked;
                register('cpf').onChange(e);
              }
            }}
            error={errors.cpf?.message}
            size="sm"
          />

          <InputField
            label="Sua senha"
            type="password"
            placeholder="••••••••"
            icon={<LockOutlined fontSize="small" />}
            register={register('password')}
            error={errors.password?.message}
            size="sm"
            allowPasswordToggle
          />

          <InputField
            label="Confirmar senha"
            type="password"
            placeholder="••••••••"
            icon={<LockOutlined fontSize="small" />}
            register={register('confirmPassword')}
            error={errors.confirmPassword?.message}
            size="sm"
            allowPasswordToggle
          />

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="privacy"
              {...register('privacyAccepted')}
              className="mt-0.5 accent-primary-900 cursor-pointer"
            />
            <label htmlFor="privacy" className="text-xs text-white leading-tight">
              Ao cadastrar, você concorda com nossa{' '}
              <Link to="/privacy" className="underline font-semibold text-black" target="_blank">
                Política de Privacidade
              </Link>
              .
            </label>
          </div>
          {errors.privacyAccepted && (
            <p className="text-red-700 text-xs">{errors.privacyAccepted.message}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-lg bg-black text-white font-semibold shadow-md hover:bg-gray-900 hover:cursor-pointer disabled:opacity-50 transition-colors mt-2"
          >
            {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
          </button>
          
          {apiError && (
            <p className="text-red-900 text-sm font-semibold text-center">{apiError}</p>
          )}
        </form>

        <p className='text-xs font-extralight mt-4'>
          Já tem uma conta?{' '}
          <Link to="/login" className='underline text-black font-semibold'>
            Conecte-se!
          </Link>
        </p>
      </div>
    </main>
  );
}
