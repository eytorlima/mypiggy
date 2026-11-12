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
  if (!dates || dates.length === 0) return null;

  const first = formatDateInput(dates[0]);
  const last = formatDateInput(dates[dates.length - 1]);
  const total = dates.length + 1; // as extras + a transação original

  return (
    // stopPropagation: este popup fica dentro do overlay do formulário, que fecha ao clicar fora
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        <h3 className="mb-2 text-lg font-bold text-gray-800">Transação recorrente</h3>

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