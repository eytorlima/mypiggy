import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { keyOf } from '../../utils/categoryColors';
import { formatBRL } from '../../utils/formatCurrency';

// Eixo Y compacto: 850 | 1,2 mil | 15 mil | 3,5 mi
function formatAxis(cents) {
  const value = Math.round(cents / 100);
  const fmt = (n) => n.toFixed(1).replace('.', ',').replace(/,0$/, '');
  if (value >= 1_000_000) return `R$ ${fmt(value / 1_000_000)} mi`;
  if (value >= 10_000) return `R$ ${Math.round(value / 1000)} mil`;
  if (value >= 1000) return `R$ ${fmt(value / 1000)} mil`;
  return `R$ ${value}`;
}

/**
 * Versão em colunas do gráfico por categoria (alternativa à pizza).
 * Recebe as mesmas props de CategoryPieChart, então a tela troca um pelo outro.
 */
export default function CategoryBarChart({ items, colors }) {
  return (
    <div className="h-64 w-full">
      {/* Leitor de tela: os valores vão em lista oculta */}
      <ul className="sr-only">
        {items.map((item) => (
          <li key={keyOf(item)}>
            {item.name}: {formatBRL(item.totalInCents)}
          </li>
        ))}
      </ul>

      <div className="h-full w-full" role="img" aria-label="Gráfico de colunas por categoria">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={items} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              interval={0}
              angle={-30}
              textAnchor="end"
              height={60}
              tick={{ fontSize: 11 }}
            />
            <YAxis width={64} tick={{ fontSize: 11 }} tickFormatter={formatAxis} />
            <Tooltip
              formatter={(value) => formatBRL(value)}
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
            />
            <Bar dataKey="totalInCents" name="Total" radius={[6, 6, 0, 0]}>
              {items.map((item) => (
                <Cell key={keyOf(item)} fill={colors[keyOf(item)]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}