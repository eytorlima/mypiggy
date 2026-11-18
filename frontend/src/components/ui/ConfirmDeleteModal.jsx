import { useId, useRef } from 'react';
import { ModalShell } from './ModalShell';
import { useModalTransition } from '../../hooks/useModalTransition';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';

export function ConfirmDeleteModal({ open, accountName, loading, onClose, onConfirm }) {
  const titleId = useId();
  const { mounted, visible } = useModalTransition(open, onClose);

  // Guarda o último nome: o pai zera ao fechar e o texto sumiria na animação de saída
  const lastName = useRef(accountName);
  if (accountName) lastName.current = accountName;

  if (!mounted) return null;

  return (
    <ModalShell visible={visible} onClose={onClose} size="sm" titleId={titleId}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-red-600">
          <WarningAmberOutlined aria-hidden="true" />
          <h2 id={titleId} className="font-bold text-gray-800">Excluir conta</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="-mr-2 w-10 h-10 rounded-full flex items-center justify-center
                     text-gray-500 hover:text-gray-700 hover:cursor-pointer"
        >
          <CloseOutlined fontSize="small" />
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-1 break-words">
        Tem certeza que deseja excluir a conta <strong>{lastName.current}</strong>?
      </p>
      <p className="text-xs text-gray-500 mb-6">
        Esta ação não pode ser desfeita. As transações associadas também serão excluídas.
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium
                     hover:bg-gray-50 hover:cursor-pointer disabled:opacity-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold
                     hover:bg-red-600 hover:cursor-pointer disabled:opacity-50 transition-colors"
        >
          {loading ? 'Excluindo...' : 'Excluir'}
        </button>
      </div>
    </ModalShell>
  );
}