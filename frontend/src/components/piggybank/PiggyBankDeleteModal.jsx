import { useEffect, useRef, useState } from 'react';
import { ModalShell } from '../ui/ModalShell';
import { useModalTransition } from '../../hooks/useModalTransition';
import { formatBRL } from '../../utils/formatCurrency';

export function PiggyBankDeleteModal({ open, piggy, accounts, loading, error, onClose, onConfirm }) {
  const [returnAccountId, setReturnAccountId] = useState('');
  const { mounted, visible } = useModalTransition(open, onClose);

  // Guarda o último porquinho: o pai zera ao fechar e o nome sumiria durante a animação de saída
  const lastPiggy = useRef(piggy);
  if (piggy) lastPiggy.current = piggy;
  const shown = piggy ?? lastPiggy.current;

  useEffect(() => {
    if (open) setReturnAccountId(accounts[0]?.id ?? '');
  }, [open, accounts]);

  if (!mounted || !shown) return null;

  const hasBalance = shown.balanceInCents > 0;
  const missingAccount = hasBalance && !returnAccountId;

  return (
    <ModalShell visible={visible} onClose={onClose} size="sm">
      <h2 className="text-lg font-bold text-gray-800 mb-2">Excluir porquinho</h2>
      <p className="text-sm text-gray-600">
        Tem certeza que deseja excluir <span className="font-semibold">{shown.name}</span>? Essa
        ação não pode ser desfeita.
      </p>

      {hasBalance && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
            Há <span className="font-semibold">{formatBRL(shown.balanceInCents)}</span> guardados. O
            valor volta para a conta escolhida abaixo (o rendimento estimado não é devolvido).
          </p>

          {accounts.length === 0 ? (
            <p className="text-sm text-red-600">Cadastre uma conta para receber o valor.</p>
          ) : (
            <div className="flex flex-col gap-1">
              <label htmlFor="piggy-return-account" className="text-sm font-medium text-gray-700">
                Devolver para
              </label>
              <select
                id="piggy-return-account"
                value={returnAccountId}
                onChange={(e) => setReturnAccountId(e.target.value)}
                className="w-full h-[40px] px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-700
                           focus:outline-none focus:border-primary-500 hover:cursor-pointer"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3 mt-5">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold
                     hover:bg-gray-50 disabled:opacity-50 transition-colors hover:cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => onConfirm(hasBalance ? returnAccountId : null)}
          disabled={loading || missingAccount}
          className="flex-1 py-2.5 rounded-lg bg-red-500 text-white font-semibold
                     hover:bg-red-600 disabled:opacity-50 transition-colors hover:cursor-pointer"
        >
          {loading ? 'Excluindo...' : 'Excluir'}
        </button>
      </div>
    </ModalShell>
  );
}