// Utilitários para trabalhar com meses no formato "YYYY-MM",
// o mesmo formato que a API de relatórios usa.

function toYearMonth(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function parse(ym) {
  const [year, month] = ym.split('-').map(Number);
  return { year, month };
}

/** Mês atual, ex.: "2026-11" */
export function currentMonth() {
  return toYearMonth(new Date());
}

/** Soma (ou subtrai, com delta negativo) meses. O Date cuida da virada de ano. */
export function shiftMonth(ym, delta) {
  const { year, month } = parse(ym);
  return toYearMonth(new Date(year, month - 1 + delta, 1));
}

/** "2026-11" -> "Novembro de 2026" */
export function formatMonthLabel(ym) {
  const { year, month } = parse(ym);
  const label = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** "2026-11" -> "nov/26" (rótulo curto para o eixo do gráfico) */
export function formatMonthShort(ym) {
  const { year, month } = parse(ym);
  const name = new Date(year, month - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'short' })
    .replace('.', '');
  return `${name}/${String(year).slice(2)}`;
}