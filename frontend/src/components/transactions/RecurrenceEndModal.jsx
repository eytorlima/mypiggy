import { useEffect, useState } from 'react';
import StopCircleOutlined from '@mui/icons-material/StopCircleOutlined';

const recurrenceLabel = {
  DAILY: 'diária',
  WEEKLY: 'semanal',
  MONTHLY: 'mensal',
  ANNUAL: 'anual',
};

export function RecurrenceEndModal({ open, transaction, loading, onClose, onConfirm }) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  const [lastTransaction, setLastTransaction] = useState(transaction);
  useEffect(() => {
    if (transaction) setLastTransaction(transaction);
  }, [transaction]);

  useEffect(() => {
    if (open) {
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
  const type = recurrenceLabel[t?.recurrencyType] || '';

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
        <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
          <StopCircleOutlined />
        </div>

        <h2 className="text-lg font-bold text-gray-800">Encerrar recorrência?</h2>

        <p className="mt-2 text-sm text-gray-600">
          A recorrência {type} de <span className="font-semibold">{label}</span> deixará de
          gerar novas transações.
        </p>
        <p className="mt-1 text-xs text-gray-400">
          As transações que já existem são mantidas. Esta ação não pode ser desfeita.
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
            onClick={onConfirm}
            className="py-2.5 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600
                       disabled:opacity-50 transition-colors hover:cursor-pointer"
          >
            {loading ? 'Encerrando...' : 'Encerrar'}
          </button>
        </div>
      </div>
    </div>
  );
}