import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EXPENSE_COLOR, INCOME_COLOR } from '../../utils/categoryColors';
import { formatBRL } from '../../utils/formatCurrency';
import { formatMonthShort } from '../../utils/month';

const PERIOD_OPTIONS = [3, 6, 12];

// Eixo Y compacto para valores grandes não serem cortados: 850 | 1,2 mil | 15 mil | 3,5 mi
function formatAxis(cents) {
  const value = Math.round(cents / 100);
  const fmt = (n, digits) => n.toFixed(digits).replace('.', ',').replace(/,0$/, '');
  if (value >= 1_000_000) return `R$ ${fmt(value / 1_000_000, 1)} mi`;
  if (value >= 10_000) return `R$ ${Math.round(value / 1000)} mil`;
  if (value >= 1000) return `R$ ${fmt(value / 1000, 1)} mil`;
  return `R$ ${value}`;
}

/**
 * Receitas (verde) x despesas (vermelho) por mês.
 *
 * @param report          resposta de /api/reports/monthly
 * @param months          janela atual (3, 6 ou 12)
 * @param onChangeMonths  (n) => void
 */
export default function MonthlyBarChart({ report, months, onChangeMonths }) {
  // Adiciona um rótulo curto ("nov/26") a cada mês para o eixo X
  const data = (report?.items ?? []).map((item) => ({
    ...item,
    label: formatMonthShort(item.month),
  }));

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-gray-800">Receitas x Despesas</h2>

        <div className="flex gap-2" role="group" aria-label="Período do gráfico">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onChangeMonths(option)}
              aria-pressed={months === option}
              className={`rounded-lg px-3 sm:px-4 py-2 sm:py-1.5 text-xs font-medium transition hover:cursor-pointer ${
                months === option
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option} meses
            </button>
          ))}
        </div>
      </div>

      {/* Leitor de tela: tabela oculta com os mesmos valores do gráfico */}
      <table className="sr-only">
        <caption>Receitas e despesas dos últimos {months} meses</caption>
        <thead>
          <tr>
            <th scope="col">Mês</th>
            <th scope="col">Receitas</th>
            <th scope="col">Despesas</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.month}>
              <th scope="row">{row.label}</th>
              <td>{formatBRL(row.incomeInCents)}</td>
              <td>{formatBRL(row.expenseInCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="h-80 w-full" role="img" aria-label="Gráfico de barras de receitas e despesas por mês">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis width={64} tick={{ fontSize: 11 }} tickFormatter={formatAxis} />
            <Tooltip
              formatter={(value) => formatBRL(value)}
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
            />
            <Legend />
            <Bar dataKey="incomeInCents" name="Receitas" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenseInCents" name="Despesas" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {report && (
        <div className="mt-8 flex flex-wrap justify-around gap-3 text-sm">
          <span className="text-green-700">
            Total de receitas: <strong>{formatBRL(report.totalIncomeInCents)}</strong>
          </span>
          <span className="text-red-600">
            Total de despesas: <strong>{formatBRL(report.totalExpenseInCents)}</strong>
          </span>
        </div>
      )}
    </div>
  );
}