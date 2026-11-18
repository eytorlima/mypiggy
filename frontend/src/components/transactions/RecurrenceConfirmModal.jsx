import { useEffect, useId, useRef } from 'react';
import { formatDateInput } from '../../utils/recurrenceUtils';

const FREQUENCY_LABEL = {
  DAILY: 'diária',
  WEEKLY: 'semanal',
  MONTHLY: 'mensal',
  ANNUAL: 'anual',
};

/**
 * Popup de confirmação: avisa quantas transações serão criadas ao registrar
 * uma transação recorrente com data no passado.
 *
 * @param dates           datas ("YYYY-MM-DD") das ocorrências extras; null/vazio = fechado
 * @param recurrencyType  'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ANNUAL'
 * @param loading         true enquanto salva
 */
export function RecurrenceConfirmModal({ dates, recurrencyType, loading, onConfirm, onCancel }) {
  const isOpen = !!dates && dates.length > 0;
  const titleId = useId();
  const panelRef = useRef(null);

  // ESC fecha só este popup (fase de captura: chega antes do ESC do formulário)
  useEffect(() => {
    if (!isOpen) return undefined;
    function handleKey(e) {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (!loading) onCancel();
    }
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [isOpen, loading, onCancel]);

  // Foco no popup ao abrir; devolve ao elemento de origem ao fechar
  useEffect(() => {
    if (!isOpen) return undefined;
    const previous = document.activeElement;
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      if (previous && previous.isConnected) previous.focus?.({ preventScroll: true });
    };
  }, [isOpen]);

  // Mantém o Tab entre os dois botões
  function handleKeyDown(e) {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const buttons = panelRef.current.querySelectorAll('button:not([disabled])');
    if (buttons.length === 0) return;
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    const active = document.activeElement;

    if (e.shiftKey && (active === first || active === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  if (!isOpen) return null;

  const first = formatDateInput(dates[0]);
  const last = formatDateInput(dates[dates.length - 1]);
  const total = dates.length + 1; // as extras + a transação original

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{ outline: 'none' }}
        onKeyDown={handleKeyDown}
        className="w-full max-w-sm max-h-[90dvh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
      >
        <h3 id={titleId} className="mb-2 text-lg font-bold text-gray-800">
          Transação recorrente
        </h3>

        <p className="mb-2 text-sm text-gray-600">
          Esta transação é <strong>{FREQUENCY_LABEL[recurrencyType] ?? 'recorrente'}</strong> e
          tem data anterior a hoje. Além da transação informada, serão registradas{' '}
          <strong>
            {dates.length} {dates.length === 1 ? 'ocorrência' : 'ocorrências'}
          </strong>{' '}
          {dates.length === 1 ? `em ${first}` : `de ${first} até ${last}`}.
        </p>

        <p className="mb-4 text-sm text-gray-600">
          Ao todo, {total} lançamentos vão alterar o saldo da conta. Deseja continuar?
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-lg bg-gray-100 py-2.5 font-semibold text-gray-700 transition-colors hover:cursor-pointer hover:bg-gray-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-gray-700 py-2.5 font-semibold text-white transition-colors hover:cursor-pointer hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Registrar todas'}
          </button>
        </div>
      </div>
    </div>
  );
}