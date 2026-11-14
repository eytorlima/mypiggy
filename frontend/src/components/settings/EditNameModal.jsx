import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ModalShell } from '../ui/ModalShell';
import { useModalTransition } from '../../hooks/useModalTransition';
import { ModalField } from './ModalField';
import { updateProfile } from '../../services/userService';

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome não pode ter mais de 100 caracteres'),
});

export function EditNameModal({ open, currentName, onClose, onSuccess }) {
  const { mounted, visible } = useModalTransition(open, onClose);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  });

  // A cada abertura, o formulário volta com o nome atual e sem erro antigo
  useEffect(() => {
    if (open) {
      reset({ name: currentName || '' });
      setApiError('');
    }
  }, [open, currentName, reset]);

  async function onSubmit({ name }) {
    // Nada mudou: não gasta requisição
    if (name === (currentName || '').trim()) {
      onClose();
      return;
    }

    try {
      setApiError('');
      const profile = await updateProfile({ name });
      onSuccess(profile); // { id, name, email }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Não foi possível salvar o nome.');
    }
  }

  if (!mounted) return null;

  return (
    <ModalShell visible={visible} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <h3 className="font-bold text-gray-700 text-center">Editar nome</h3>

        <ModalField
          label="Nome"
          autoComplete="name"
          register={register('name')}
          error={errors.name?.message}
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
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}