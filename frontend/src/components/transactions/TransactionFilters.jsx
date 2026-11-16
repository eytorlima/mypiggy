import { useId, useMemo } from 'react';
import { SelectField } from '../ui/SelectField';
import { toLocalDateTime } from '../../utils/dateUtils';
import FilterAltOffOutlined from '@mui/icons-material/FilterAltOffOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';

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
  search: '',
});

/**
 * filters: { month: "YYYY-MM" | "", type, accountId, categoryId, search }
 * onChange recebe o objeto de filtros completo e atualizado.
 */
export function TransactionFilters({ filters, onChange, accounts, categories }) {
  const monthId = useId();

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

  // Ao começar a pesquisar, o mês é limpo para a busca valer em TODOS os períodos.
  // Depois disso o usuário pode escolher um mês de novo (a busca respeita o mês).
  function handleSearch(value) {
    const startedSearching = !filters.search.trim() && value.trim();
    onChange({
      ...filters,
      search: value,
      month: startedSearching ? '' : filters.month,
    });
  }

  const defaults = DEFAULT_FILTERS();
  const isFiltered =
    filters.month !== defaults.month ||
    filters.type ||
    filters.accountId ||
    filters.categoryId ||
    filters.search;

  return (
    <div
      role="search"
      className="bg-white border border-black/10 rounded-2xl p-4 shadow-sm [&_label]:text-gray-700"
    >
      {/* Caixa de pesquisa */}
      <div className="relative mb-3">
        <SearchOutlined
          fontSize="small"
          aria-hidden="true"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
        />
        <input
          type="search"
          value={filters.search}
          onChange={(e) => handleSearch(e.target.value)}
          maxLength={100}
          placeholder="Pesquisar por descrição, conta, categoria..."
          aria-label="Pesquisar transações"
          className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700
                     focus:outline-none focus:border-primary-500 [&::-webkit-search-cancel-button]:hidden"
        />
        {filters.search && (
          <button
            type="button"
            onClick={() => update('search', '')}
            aria-label="Limpar pesquisa"
            className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center
                       text-gray-500 hover:text-gray-700 hover:cursor-pointer"
          >
            <CloseOutlined fontSize="small" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <label htmlFor={monthId} className="text-sm font-medium text-gray-700">Mês</label>
          <input
            id={monthId}
            type="month"
            min="2000-01"
            max="2100-12"
            value={filters.month}
            onChange={(e) => update('month', e.target.value)}
            className="w-full min-w-0 min-h-[40px] px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700
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
          className="mt-3 py-1.5 flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800 hover:cursor-pointer"
        >
          <FilterAltOffOutlined fontSize="small" aria-hidden="true" />
          Limpar filtros
        </button>
      )}
    </div>
  );
}