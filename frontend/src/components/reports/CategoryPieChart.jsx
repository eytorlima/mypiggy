import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { keyOf } from '../../utils/categoryColors';
import { formatBRL } from '../../utils/formatCurrency';

/**
 * Gráfico de pizza (rosca) por categoria.
 *
 * @param items   categorias VISÍVEIS (as ocultas na legenda já foram filtradas)
 * @param colors  mapa { [chave da categoria]: '#hex' }
 */
export default function CategoryPieChart({ items, colors }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={items}
            dataKey="totalInCents"
            nameKey="name"
            innerRadius="45%"
            outerRadius="85%"
            paddingAngle={2}
            stroke="none"
          >
            {items.map((item) => (
              <Cell key={keyOf(item)} fill={colors[keyOf(item)]} />
            ))}
          </Pie>
          {/* O valor chega em centavos; formatBRL converte para "R$ 1.500,00" */}
          <Tooltip formatter={(value) => formatBRL(value)} itemStyle={{ color: '#000' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}