import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatBRL } from '../../utils/formatCurrency';
import { formatMonthLabel, formatMonthShort } from '../../utils/month';

const PERIOD_OPTIONS = [3, 6, 12];
const LINE_COLOR = '#22c55e';

// Eixo Y compacto, com suporte a saldo negativo: -850 | 1,2 mil | -15 mil | 3,5 mi
function formatAxis(cents) {
  const sign = cents < 0 ? '-' : '';
  const value = Math.round(Math.abs(cents) / 100);
  const fmt = (n, digits) => n.toFixed(digits).replace('.', ',').replace(/,0$/, '');
  if (value >= 1_000_000) return `${sign}R$ ${fmt(value / 1_000_000, 1)} mi`;
  if (value >= 10_000) return `${sign}R$ ${Math.round(value / 1000)} mil`;
  if (value >= 1000) return `${sign}R$ ${fmt(value / 1000, 1)} mil`;
  return `${sign}R$ ${value}`;
}

/**
 * Evolução do saldo (consolidado) ao fim de cada mês.
 *
 * @param report          resposta de /api/reports/balance-history
 * @param months          janela atual (3, 6 ou 12)
 * @param onChangeMonths  (n) => void
 */
export default function BalanceHistoryChart({ report, months, onChangeMonths }) {
  const data = (report?.points ?? []).map((point) => ({
    ...point,
    label: formatMonthShort(point.month),
  }));

  const first = data[0];
  const last = data[data.length - 1];
  const variation = first && last ? last.balanceInCents - first.balanceInCents : 0;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-gray-800">Evolução do saldo</h2>

        <div className="flex gap-2" role="group" aria-label="Período da evolução do saldo">
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
        <caption>Saldo ao fim de cada mês, nos últimos {months} meses</caption>
        <thead>
          <tr>
            <th scope="col">Mês</th>
            <th scope="col">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.month}>
              <th scope="row">{row.label}</th>
              <td>{formatBRL(row.balanceInCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="h-80 w-full" role="img" aria-label="Gráfico de linha da evolução do saldo por mês">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis width={72} tick={{ fontSize: 11 }} tickFormatter={formatAxis} />
            <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 4" />
            <Tooltip
              formatter={(value) => [formatBRL(value), 'Saldo']}
              labelFormatter={(label, payload) =>
                payload?.[0] ? formatMonthLabel(payload[0].payload.month) : label
              }
              itemStyle={{ color: '#000' }}
            />
            <Line
              type="monotone"
              dataKey="balanceInCents"
              name="Saldo"
              stroke={LINE_COLOR}
              strokeWidth={2.5}
              dot={{ r: 4, fill: LINE_COLOR }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {first && last && (
        <div className="mt-8 flex flex-wrap justify-around gap-3 text-sm">
          <span className="text-gray-700">
            Saldo atual:{' '}
            <strong className={last.balanceInCents < 0 ? 'text-red-600' : 'text-gray-800'}>
              {formatBRL(last.balanceInCents)}
            </strong>
          </span>
          <span className={variation < 0 ? 'text-red-600' : 'text-green-700'}>
            Variação desde {first.label}:{' '}
            <strong>
              {variation > 0 ? '+' : ''}
              {formatBRL(variation)}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}