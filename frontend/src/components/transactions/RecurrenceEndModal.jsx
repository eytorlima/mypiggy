import { useId, useRef } from 'react';
import { ModalShell } from '../ui/ModalShell';
import { useModalTransition } from '../../hooks/useModalTransition';
import StopCircleOutlined from '@mui/icons-material/StopCircleOutlined';

const recurrenceLabel = {
  DAILY: 'diária',
  WEEKLY: 'semanal',
  MONTHLY: 'mensal',
  ANNUAL: 'anual',
};

export function RecurrenceEndModal({ open, transaction, loading, onClose, onConfirm }) {
  const titleId = useId();

  // Não deixa ESC nem clique fora fecharem enquanto a operação está em andamento
  const handleClose = () => {
    if (!loading) onClose();
  };
  const { mounted, visible } = useModalTransition(open, handleClose);

  // Guarda a última transação para o texto não sumir durante a animação de saída
  const lastTransaction = useRef(transaction);
  if (transaction) lastTransaction.current = transaction;

  if (!mounted) return null;

  const t = lastTransaction.current;
  const label = t?.description || t?.categoryName || 'esta transação';
  const type = recurrenceLabel[t?.recurrencyType] || '';

  return (
    <ModalShell visible={visible} onClose={handleClose} size="sm" titleId={titleId}>
      <div className="text-center">
        <div
          aria-hidden="true"
          className="mx-auto mb-3 w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center"
        >
          <StopCircleOutlined />
        </div>

        <h2 id={titleId} className="text-lg font-bold text-gray-800">Encerrar recorrência?</h2>

        <p className="mt-2 text-sm text-gray-600 break-words">
          A recorrência {type} de <span className="font-semibold">{label}</span> deixará de
          gerar novas transações.
        </p>
        <p className="mt-1 text-xs text-gray-500">
          As transações que já existem são mantidas. Esta ação não pode ser desfeita.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={handleClose}
            className="py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold
                       hover:bg-gray-50 disabled:opacity-50 transition-colors hover:cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="py-2.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700
                       disabled:opacity-50 transition-colors hover:cursor-pointer"
          >
            {loading ? 'Encerrando...' : 'Encerrar'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}