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

/**
 * Versão em colunas do gráfico por categoria (alternativa à pizza).
 * Recebe as mesmas props de CategoryPieChart, então a tela troca um pelo outro.
 */
export default function CategoryBarChart({ items, colors }) {
  return (
    <div className="h-64 w-full">
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
          {/* Eixo em reais inteiros; o tooltip mostra o valor completo */}
          <YAxis
            width={64}
            tick={{ fontSize: 11 }}
            tickFormatter={(cents) => `R$ ${Math.round(cents / 100)}`}
          />
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
  );
}