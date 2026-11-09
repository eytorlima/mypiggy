import { currentMonth, formatMonthLabel, shiftMonth } from '../../utils/month';

/**
 * Seletor de mês com botões anterior/próximo.
 * Não deixa avançar além do mês atual (não há dados no futuro).
 */
export default function MonthSelector({ month, onChange }) {
  // Strings "YYYY-MM" podem ser comparadas diretamente: a ordem alfabética é a cronológica
  const isCurrentOrFuture = month >= currentMonth();

  return (
    <div className="flex items-center justify-between rounded-xl bg-white p-2 shadow">
      <button
        type="button"
        onClick={() => onChange(shiftMonth(month, -1))}
        className="h-10 w-10 rounded-lg text-xl text-gray-600 transition hover:bg-gray-100 hover:cursor-pointer"
        aria-label="Mês anterior"
      >
        ‹
      </button>

      <span className="font-semibold text-gray-800">{formatMonthLabel(month)}</span>

      <button
        type="button"
        onClick={() => onChange(shiftMonth(month, 1))}
        disabled={isCurrentOrFuture}
        className="h-10 w-10 rounded-lg text-xl text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent hover:cursor-pointer"
        aria-label="Próximo mês"
      >
        ›
      </button>
    </div>
  );
}