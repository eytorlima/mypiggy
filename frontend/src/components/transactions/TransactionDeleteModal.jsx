import { useEffect, useState } from 'react';
import { formatBRL } from '../../utils/formatCurrency';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';

const SCOPE_OPTIONS = [
  { value: 'ONE', label: 'Só esta transação', hint: 'As demais da série são mantidas.' },
  { value: 'SERIES', label: 'Toda a série', hint: 'Remove todas as ocorrências e para de gerar novas.' },
];

// onConfirm recebe o escopo: 'ONE' (só esta) ou 'SERIES' (toda a série)
export function TransactionDeleteModal({ open, transaction, loading, onClose, onConfirm }) {
  // mounted: está no DOM | visible: dispara a transição
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const [scope, setScope] = useState('ONE');

  // Guarda a última transação para o texto não sumir durante a animação de saída
  const [lastTransaction, setLastTransaction] = useState(transaction);
  useEffect(() => {
    if (transaction) setLastTransaction(transaction);
  }, [transaction]);

  useEffect(() => {
    if (open) {
      setScope('ONE'); // sempre começa na opção mais segura
      setMounted(true);
      const t = setTimeout(() => setVisible(true), 20);
      return () => clearTimeout(t);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), 250);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => e.key === 'Escape' && !loading && onClose();
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, loading, onClose]);

  if (!mounted) return null;

  const t = lastTransaction;
  const label = t?.description || t?.categoryName || 'esta transação';
  const isTransfer = t?.transactionType === 'TRANSFER';
  const inSeries = Boolean(t?.recurrenceSeriesId);
  const wholeSeries = inSeries && scope === 'SERIES';

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4
                  transition-opacity duration-200 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={() => !loading && onClose()}
    >
      <div
        className={`bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center
                    transition-all duration-300 ease-out
                    ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
          <DeleteOutlineOutlined />
        </div>

        <h2 className="text-lg font-bold text-gray-800">
          {wholeSeries ? 'Excluir série?' : 'Excluir transação?'}
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          <span className="font-semibold">{label}</span>
          {t && <> ({formatBRL(t.amountInCents)})</>}{' '}
          {wholeSeries ? 'e todas as suas repetições serão removidas.' : 'será removida.'}
        </p>

        {inSeries && (
          <div className="mt-4 flex flex-col gap-2 text-left">
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
                  <span className="block text-xs text-gray-400">{opt.hint}</span>
                </span>
              </label>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs text-gray-400">
          {isTransfer
            ? 'O valor volta para a conta de origem e sai da conta de destino.'
            : 'O saldo da conta será ajustado automaticamente.'}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
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
    </div>
  );
}