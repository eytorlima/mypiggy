// Utilitários de recorrência. A lógica de datas espelha a do back-end
// (TransactionService.nextOccurrence), para o popup mostrar exatamente
// o que será gerado.

const pad = (n) => String(n).padStart(2, '0');

/** Date -> "YYYY-MM-DD" (partes locais, sem deslocamento de fuso) */
export function toDateInput(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "2026-11-10" -> "10/11/2026" */
export function formatDateInput(dateInput) {
  const [y, m, d] = dateInput.split('-');
  return `${d}/${m}/${y}`;
}

// Soma meses mantendo o dia, mas respeitando o fim do mês
// (31/01 + 1 mês = 28/02), como o plusMonths do Java.
function addMonthsClamped(y, m, d, n) {
  const base = new Date(y, m - 1 + n, 1);
  const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  return new Date(base.getFullYear(), base.getMonth(), Math.min(d, lastDay));
}

function occurrence(y, m, d, type, step) {
  switch (type) {
    case 'DAILY':
      return new Date(y, m - 1, d + step);
    case 'WEEKLY':
      return new Date(y, m - 1, d + 7 * step);
    case 'MONTHLY':
      return addMonthsClamped(y, m, d, step);
    case 'ANNUAL':
      return addMonthsClamped(y, m, d, 12 * step);
    default:
      return null;
  }
}

/** Data mínima aceita para recorrência DIÁRIA (1 mês atrás), em "YYYY-MM-DD" */
export function oneMonthAgoInput(today = new Date()) {
  return toDateInput(
    addMonthsClamped(today.getFullYear(), today.getMonth() + 1, today.getDate(), -1)
  );
}

/**
 * Datas ("YYYY-MM-DD") das ocorrências atrasadas: depois da data original
 * e até hoje (inclusive). A data original não entra, porque ela já é a transação criada.
 */
export function missedOccurrences(dateInput, recurrencyType, today, max = 366) {
  const [y, m, d] = dateInput.split('-').map(Number);
  const dates = [];

  for (let step = 1; step <= max; step++) {
    const next = occurrence(y, m, d, recurrencyType, step);
    if (!next) break;

    const nextInput = toDateInput(next);
    if (nextInput > today) break; // strings "YYYY-MM-DD" comparam na ordem cronológica
    dates.push(nextInput);
  }

  return dates;
}