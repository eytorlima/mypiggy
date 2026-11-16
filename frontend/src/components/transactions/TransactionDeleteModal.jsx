import { useEffect, useId, useRef, useState } from 'react';
import { ModalShell } from '../ui/ModalShell';
import { useModalTransition } from '../../hooks/useModalTransition';
import { formatBRL } from '../../utils/formatCurrency';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';

const SCOPE_OPTIONS = [
  { value: 'ONE', label: 'Só esta transação', hint: 'As demais da série são mantidas.' },
  { value: 'SERIES', label: 'Toda a série', hint: 'Remove todas as ocorrências e para de gerar novas.' },
];

// onConfirm recebe o escopo: 'ONE' (só esta) ou 'SERIES' (toda a série)
export function TransactionDeleteModal({ open, transaction, loading, onClose, onConfirm }) {
  const titleId = useId();
  const [scope, setScope] = useState('ONE');

  // Não deixa ESC nem clique fora fecharem enquanto a exclusão está em andamento
  const handleClose = () => {
    if (!loading) onClose();
  };
  const { mounted, visible } = useModalTransition(open, handleClose);

  // Guarda a última transação para o texto não sumir durante a animação de saída
  const lastTransaction = useRef(transaction);
  if (transaction) lastTransaction.current = transaction;

  // Sempre começa na opção mais segura
  useEffect(() => {
    if (open) setScope('ONE');
  }, [open]);

  if (!mounted) return null;

  const t = lastTransaction.current;
  const label = t?.description || t?.categoryName || 'esta transação';
  const isTransfer = t?.transactionType === 'TRANSFER';
  const inSeries = Boolean(t?.recurrenceSeriesId);
  const wholeSeries = inSeries && scope === 'SERIES';

  return (
    <ModalShell visible={visible} onClose={handleClose} size="sm" titleId={titleId}>
      <div className="text-center">
        <div
          aria-hidden="true"
          className="mx-auto mb-3 w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center"
        >
          <DeleteOutlineOutlined />
        </div>

        <h2 id={titleId} className="text-lg font-bold text-gray-800">
          {wholeSeries ? 'Excluir série?' : 'Excluir transação?'}
        </h2>

        <p className="mt-2 text-sm text-gray-600 break-words">
          <span className="font-semibold">{label}</span>
          {t && <> ({formatBRL(t.amountInCents)})</>}{' '}
          {wholeSeries ? 'e todas as suas repetições serão removidas.' : 'será removida.'}
        </p>

        {inSeries && (
          <fieldset className="mt-4 flex flex-col gap-2 text-left">
            <legend className="sr-only">O que excluir</legend>
            {SCOPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                  ${scope === opt.value ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <input
                  type="radio"
                  name="delete-scope"
                  value={opt.value}
                  checked={scope === opt.value}
                  disabled={loading}
                  onChange={() => setScope(opt.value)}
                  className="mt-1 accent-red-500"
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-700">{opt.label}</span>
                  <span className="block text-xs text-gray-500">{opt.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
        )}

        <p className="mt-3 text-xs text-gray-500">
          {isTransfer
            ? 'O valor volta para a conta de origem e sai da conta de destino.'
            : 'O saldo da conta será ajustado automaticamente.'}
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
            onClick={() => onConfirm(inSeries ? scope : 'ONE')}
            className="py-2.5 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600
                       disabled:opacity-50 transition-colors hover:cursor-pointer"
          >
            {loading ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}