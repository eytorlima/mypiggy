import { useId } from 'react';
import { ModalShell } from './ModalShell';
import { useModalTransition } from '../../hooks/useModalTransition';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';

export function ConfirmLogoutModal({ open, onClose, onConfirm }) {
  const titleId = useId();
  const { mounted, visible } = useModalTransition(open, onClose);

  if (!mounted) return null;

  return (
    <ModalShell visible={visible} onClose={onClose} size="sm" titleId={titleId}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-red-600">
          <LogoutOutlined aria-hidden="true" />
          <h2 id={titleId} className="font-bold text-gray-800">Sair da conta</h2>
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

      <p className="text-sm text-gray-600 mb-6">
        Deseja realmente sair do MyPiggy? Você precisará entrar novamente para acessar suas finanças.
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium
                     hover:bg-gray-50 hover:cursor-pointer transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold
                     hover:bg-red-600 hover:cursor-pointer transition-colors"
        >
          Sair
        </button>
      </div>
    </ModalShell>
  );
}