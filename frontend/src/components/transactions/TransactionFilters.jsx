import { useMemo } from 'react';
import { SelectField } from '../ui/SelectField';
import { toLocalDateTime } from '../../utils/dateUtils';
import FilterAltOffOutlined from '@mui/icons-material/FilterAltOffOutlined';

const TYPE_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'CREDIT', label: 'Receitas' },
  { value: 'DEBIT', label: 'Despesas' },
  { value: 'TRANSFER', label: 'Transferências' },
];

export const currentMonth = () => toLocalDateTime(new Date()).slice(0, 7); // "2026-10"

export const DEFAULT_FILTERS = () => ({
  month: currentMonth(),
  type: '',
  accountId: '',
  categoryId: '',
});

/**
 * filters: { month: "YYYY-MM" | "", type, accountId, categoryId }
 * onChange recebe o objeto de filtros completo e atualizado.
 */
export function TransactionFilters({ filters, onChange, accounts, categories }) {
  const accountOptions = useMemo(
    () => [
      { value: '', label: 'Todas as contas' },
      ...accounts.map((a) => ({ value: a.id, label: a.name })),
    ],
    [accounts]
  );

  const categoryOptions = useMemo(
    () => [
      { value: '', label: 'Todas as categorias' },
      ...categories.map((c) => ({ value: String(c.id), label: c.name })),
    ],
    [categories]
  );

  function update(field, value) {
    onChange({ ...filters, [field]: value });
  }

  const defaults = DEFAULT_FILTERS();
  const isFiltered =
    filters.month !== defaults.month ||
    filters.type ||
    filters.accountId ||
    filters.categoryId;

  return (
    <div className="bg-white border border-black/10 rounded-2xl p-4 shadow-sm [&_label]:text-gray-700">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Mês</label>
          <input
            type="month"
            value={filters.month}
            onChange={(e) => update('month', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700
                       focus:outline-none focus:border-primary-500"
          />
        </div>

        <SelectField
          label="Tipo"
          options={TYPE_OPTIONS}
          value={filters.type}
          onChange={(v) => update('type', v)}
        />

        <SelectField
          label="Conta"
          options={accountOptions}
          value={filters.accountId}
          onChange={(v) => update('accountId', v)}
        />

        <SelectField
          label="Categoria"
          options={categoryOptions}
          value={filters.categoryId}
          onChange={(v) => update('categoryId', v)}
        />
      </div>

      {isFiltered && (
        <button
          type="button"
          onClick={() => onChange(DEFAULT_FILTERS())}
          className="mt-3 flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 hover:cursor-pointer"
        >
          <FilterAltOffOutlined fontSize="small" />
          Limpar filtros
        </button>
      )}
    </div>
  );
}