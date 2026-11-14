import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatAxisDate, formatFullDate, formatStockPrice } from '../../utils/stockUtils';

const LONG_SPAN_DAYS = 200; // acima disso o eixo X mostra mês/ano em vez de dia/mês

/**
 * Gráfico de área com o fechamento do período.
 * Ocupa 100% do container pai (o pai precisa ter altura, ex.: h-56).
 *
 * @param data   [{ date: 1781233200 (segundos Unix), close: 41.18 }, ...] em ordem crescente
 * @param color  cor da linha/área (verde se subiu no período, vermelho se caiu)
 */
export default function StockPriceChart({ data, color }) {
  // id do gradiente único por cor, para não colidir com outros gráficos da página
  const gradientId = `stock-gradient-${String(color).replace(/[^a-zA-Z0-9]/g, '')}`;

  const spanDays =
    data.length > 1 ? (data[data.length - 1].date - data[0].date) / 86400 : 0;
  const isLong = spanDays > LONG_SPAN_DAYS;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickFormatter={(date) => formatAxisDate(date, isLong)}
          minTickGap={isLong ? 40 : 24}
        />
        <YAxis
          width={52}
          domain={['auto', 'auto']}
          tick={{ fontSize: 11 }}
          tickFormatter={(value) => value.toFixed(2).replace('.', ',')}
        />
        <Tooltip
          labelFormatter={(date) => formatFullDate(date)}
          formatter={(value) => [formatStockPrice(value), 'Fechamento']}
          itemStyle={{ color: '#000' }}
        />
        <Area
          type="monotone"
          dataKey="close"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}