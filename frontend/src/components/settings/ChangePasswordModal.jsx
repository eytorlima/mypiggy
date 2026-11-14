import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ModalShell } from '../ui/ModalShell';
import { useModalTransition } from '../../hooks/useModalTransition';
import { ModalField } from './ModalField';
import { updateProfile } from '../../services/userService';

// Mesma regra do cadastro (RegisterRequestDTO no back-end)
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: z
      .string()
      .regex(
        PASSWORD_REGEX,
        'Mínimo de 8 caracteres, com maiúscula, minúscula, número e caractere especial'
      ),
    confirmPassword: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  });

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

export function ChangePasswordModal({ open, onClose, onSuccess }) {
  const { mounted, visible } = useModalTransition(open, onClose);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  // Senhas nunca ficam preenchidas entre uma abertura e outra
  useEffect(() => {
    if (open) {
      reset(EMPTY);
      setApiError('');
    }
  }, [open, reset]);

  async function onSubmit({ currentPassword, newPassword }) {
    try {
      setApiError('');
      await updateProfile({ currentPassword, newPassword });
      onSuccess();
    } catch (err) {
      // Senha atual errada volta como 400 (não 401): o usuário continua logado
      setApiError(err.response?.data?.message || 'Não foi possível alterar a senha.');
    }
  }

  if (!mounted) return null;

  return (
    <ModalShell visible={visible} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <h3 className="font-bold text-gray-700 text-center">Alterar senha</h3>

        <ModalField
          label="Senha atual"
          type="password"
          autoComplete="current-password"
          register={register('currentPassword')}
          error={errors.currentPassword?.message}
        />

        <ModalField
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          register={register('newPassword')}
          error={errors.newPassword?.message}
        />

        <ModalField
          label="Confirmar nova senha"
          type="password"
          autoComplete="new-password"
          register={register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />

        {apiError && <p className="text-red-700 text-sm text-center">{apiError}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 h-10 rounded-lg border border-gray-300 text-gray-600 text-sm font-semibold
                       hover:cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 h-10 rounded-lg bg-primary-500 text-white text-sm font-semibold
                       hover:cursor-pointer hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Salvando...' : 'Alterar senha'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}