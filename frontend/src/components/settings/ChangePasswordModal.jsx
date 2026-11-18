import { useEffect, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ModalShell } from '../ui/ModalShell';
import { useModalTransition } from '../../hooks/useModalTransition';
import { ModalField } from './ModalField';
import { updateProfile } from '../../services/userService';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';

// Mesma regra do cadastro (RegisterRequestDTO no back-end)
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual').max(72, 'Máximo de 72 caracteres'),
    newPassword: z
      .string()
      .max(72, 'Máximo de 72 caracteres')
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

const primaryButton =
  'flex-1 min-h-10 rounded-lg bg-amber-600 text-white text-sm font-semibold ' +
  'hover:cursor-pointer hover:bg-amber-700 transition-colors disabled:opacity-50';

const cancelButton =
  'flex-1 min-h-10 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold ' +
  'hover:cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50';

export function ChangePasswordModal({ open, onClose, onSuccess }) {
  const { mounted, visible } = useModalTransition(open, onClose);
  const [apiError, setApiError] = useState('');
  const [step, setStep] = useState('form'); // 'form' | 'confirm'
  const [pending, setPending] = useState(null); // valores já validados, aguardando confirmação
  const [saving, setSaving] = useState(false);
  const titleId = useId();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  // Senhas nunca ficam guardadas entre uma abertura e outra
  useEffect(() => {
    if (open) {
      reset(EMPTY);
      setApiError('');
      setStep('form');
      setSaving(false);
    } else {
      setPending(null);
    }
  }, [open, reset]);

  // Formulário válido: pede a confirmação antes de enviar
  function onSubmit(data) {
    setApiError('');
    setPending(data);
    setStep('confirm');
  }

  function backToForm() {
    if (pending) reset(pending);
    setStep('form');
  }

  async function handleConfirm() {
    if (!pending) return;
    setSaving(true);
    setApiError('');
    try {
      await updateProfile({
        currentPassword: pending.currentPassword,
        newPassword: pending.newPassword,
      });
      setPending(null);
      onSuccess();
    } catch (err) {
      // Senha atual errada volta como 400 (não 401): o usuário continua logado
      reset(pending);
      setStep('form');
      setApiError(err.response?.data?.message || 'Não foi possível alterar a senha.');
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;

  return (
    <ModalShell visible={visible} onClose={onClose} size="sm" titleId={titleId}>
      {step === 'confirm' ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-amber-600">
            <WarningAmberOutlined aria-hidden="true" />
            <h2 id={titleId} className="font-bold text-gray-800">Confirmar alteração</h2>
          </div>

          <p className="text-sm text-gray-600">
            Deseja realmente alterar a sua senha? Na próxima vez que entrar, você deverá usar a nova senha.
          </p>

          <div className="flex gap-3">
            <button type="button" onClick={backToForm} disabled={saving} className={cancelButton}>
              Voltar
            </button>
            <button type="button" onClick={handleConfirm} disabled={saving} className={primaryButton}>
              {saving ? 'Salvando...' : 'Sim, alterar'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <h2 id={titleId} className="font-bold text-gray-700 text-center">Alterar senha</h2>

          <ModalField
            label="Senha atual"
            type="password"
            autoComplete="current-password"
            maxLength={72}
            register={register('currentPassword')}
            error={errors.currentPassword?.message}
          />

          <ModalField
            label="Nova senha"
            type="password"
            autoComplete="new-password"
            maxLength={72}
            register={register('newPassword')}
            error={errors.newPassword?.message}
          />

          <ModalField
            label="Confirmar nova senha"
            type="password"
            autoComplete="new-password"
            maxLength={72}
            register={register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />

          {apiError && (
            <p role="alert" className="text-red-700 text-sm text-center">{apiError}</p>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className={cancelButton}>
              Cancelar
            </button>
            <button type="submit" className={primaryButton}>
              Alterar senha
            </button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}