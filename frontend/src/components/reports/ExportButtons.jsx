import { useEffect, useState } from 'react';
import { getAccounts } from '../../services/accountService';
import { getCategories } from '../../services/categoryService';
import { exportCsv, exportPdf } from '../../services/reportService';
import { localDateTimeToDateInput, monthRange } from '../../utils/dateUtils';
import { downloadFile } from '../../utils/downloadFile';
import MultiSelectFilter from './MultiSelectFilter';

const MAX_YEARS = 5; // mesmo limite do backend

const TYPE_OPTIONS = [
  { value: 'CREDIT', label: 'Receitas', active: 'bg-green-500 text-white', idle: 'bg-green-50 text-green-700 hover:bg-green-100' },
  { value: 'DEBIT', label: 'Despesas', active: 'bg-red-500 text-white', idle: 'bg-red-50 text-red-700 hover:bg-red-100' },
  { value: 'TRANSFER', label: 'Transferências', active: 'bg-gray-800 text-white', idle: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
];
const ALL_TYPES = TYPE_OPTIONS.map((t) => t.value);

// Mês atual como { start, end } no formato "YYYY-MM-DD" (hora local, sem passar por UTC)
function currentMonthRange() {
  const now = new Date();
  const { startDate, endDate } = monthRange(now.getFullYear(), now.getMonth() + 1);
  return {
    start: localDateTimeToDateInput(startDate),
    end: localDateTimeToDateInput(endDate),
  };
}

// Mesma validação do backend, para o usuário ver o erro sem esperar a requisição
function validate(start, end, types) {
  if (!start || !end) return 'Informe a data inicial e a data final.';
  if (start > end) return 'A data inicial não pode ser posterior à data final.';

  const limit = new Date(`${start}T00:00:00`);
  limit.setFullYear(limit.getFullYear() + MAX_YEARS);
  if (new Date(`${end}T00:00:00`) > limit) {
    return `O período máximo de exportação é de ${MAX_YEARS} anos.`;
  }
  if (types.length === 0) return 'Selecione ao menos um tipo de transação.';
  return '';
}

const toOptions = (list, getValue, getLabel) =>
  list
    .map((item) => ({ value: getValue(item), label: getLabel(item) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

// Abre o calendário ao clicar em QUALQUER parte do campo (por padrão só o ícone abre).
// showPicker pode lançar erro em alguns navegadores: nesse caso o comportamento normal continua.
function openPicker(event) {
  try {
    event.currentTarget.showPicker?.();
  } catch {
    // sem suporte: o usuário ainda pode digitar ou usar o ícone do campo
  }
}

const DATE_INPUT_CLASS =
  'h-10 w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 ' +
  'shadow-sm outline-none transition hover:border-gray-400 hover:bg-gray-100 focus:border-primary-700 ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

const BUTTON_CLASS =
  'h-10 flex-1 rounded-lg px-5 text-sm font-medium text-white shadow-sm transition ' +
  'hover:cursor-pointer hover:shadow-md active:scale-95 ' +
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-sm disabled:active:scale-100 sm:flex-none';

export default function ExportButtons() {
  const initial = currentMonthRange();
  const [startDate, setStartDate] = useState(initial.start);
  const [endDate, setEndDate] = useState(initial.end);

  const [types, setTypes] = useState(ALL_TYPES);
  const [categoryIds, setCategoryIds] = useState([]); // vazio = todas
  const [accountIds, setAccountIds] = useState([]); // vazio = todas

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [accountOptions, setAccountOptions] = useState([]);
  const [optionsError, setOptionsError] = useState(false);

  const [loading, setLoading] = useState(null); // null | 'csv' | 'pdf'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const busy = loading !== null;
  const typesFiltered = types.length < ALL_TYPES.length;
  const hasFilters = typesFiltered || categoryIds.length > 0 || accountIds.length > 0;

  // Carrega as opções dos filtros. allSettled: se uma falhar, a outra continua funcionando
  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([getCategories(), getAccounts()]).then(([cats, accs]) => {
      if (cancelled) return;

      if (cats.status === 'fulfilled' && Array.isArray(cats.value)) {
        // A categoria interna das transferências não é escolhível pelo usuário
        const visible = cats.value.filter((c) => c.icon !== 'transfer');
        setCategoryOptions(toOptions(visible, (c) => c.id, (c) => c.name));
      } else {
        setOptionsError(true);
      }

      if (accs.status === 'fulfilled' && Array.isArray(accs.value)) {
        setAccountOptions(toOptions(accs.value, (a) => a.id, (a) => a.name));
      } else {
        setOptionsError(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function clearMessages() {
    setError('');
    setSuccess('');
  }

  function handleDateChange(setter) {
    return (event) => {
      setter(event.target.value);
      clearMessages();
    };
  }

  function toggleType(value) {
    setTypes((prev) => (prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]));
    clearMessages();
  }

  function changeFilter(setter) {
    return (next) => {
      setter(next);
      clearMessages();
    };
  }

  function clearFilters() {
    setTypes(ALL_TYPES);
    setCategoryIds([]);
    setAccountIds([]);
    clearMessages();
  }

  async function handleExport(kind) {
    setSuccess('');

    const validationError = validate(startDate, endDate, types);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(kind);
    try {
      // Todos os tipos marcados = não filtra por tipo (extrato completo)
      const filters = {
        types: typesFiltered ? types : [],
        categoryIds,
        accountIds,
      };
      const blob = kind === 'csv'
        ? await exportCsv(startDate, endDate, filters)
        : await exportPdf(startDate, endDate, filters);

      // O nome é montado aqui porque o navegador não consegue ler o Content-Disposition (CORS)
      const suffix = hasFilters ? '-filtrado' : '';
      downloadFile(blob, `mypiggy-extrato-${startDate}_${endDate}${suffix}.${kind}`);
      setSuccess(`Arquivo ${kind.toUpperCase()} gerado.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null); // sempre libera os botões, com sucesso ou erro
    }
  }

  // Resumo do que será exportado, para o usuário conferir antes de clicar
  const typeLabels = TYPE_OPTIONS.filter((t) => types.includes(t.value)).map((t) => t.label.toLowerCase());
  const summaryParts = [
    typeLabels.length === ALL_TYPES.length ? 'todos os tipos de transações' : typeLabels.join(' e '),
    categoryIds.length ? `${categoryIds.length} categoria(s)` : 'todas as categorias',
    accountIds.length ? `${accountIds.length} conta(s)` : 'todas as contas',
  ];

  return (
    <section className="rounded-xl bg-white p-4 shadow sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-800">Exportar extrato</h2>
          <p className="text-xs text-gray-500">
            Escolha o período e o que incluir. Sem filtros, o extrato sai completo (independente do mês
            exibido acima).
          </p>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            disabled={busy}
            className="shrink-0 rounded-lg bg-gray-200 px-5 py-3 text-xs font-medium text-black transition hover:cursor-pointer hover:bg-gray-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* ---------- Período: lado a lado, também no celular ---------- */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="export-start" className="mb-1 block text-xs font-medium text-gray-600">
            De
          </label>
          <input
            id="export-start"
            type="date"
            value={startDate}
            onChange={handleDateChange(setStartDate)}
            onClick={openPicker}
            disabled={busy}
            className={DATE_INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="export-end" className="mb-1 block text-xs font-medium text-gray-600">
            Até
          </label>
          <input
            id="export-end"
            type="date"
            value={endDate}
            onChange={handleDateChange(setEndDate)}
            onClick={openPicker}
            disabled={busy}
            className={DATE_INPUT_CLASS}
          />
        </div>
      </div>

      {/* ---------- Tipos ---------- */}
      <div className="mt-8">
        <span className="mb-1 block text-xs font-medium text-gray-600">Tipos de transação</span>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((option) => {
            const checked = types.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleType(option.value)}
                disabled={busy}
                aria-pressed={checked}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition hover:cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                  checked ? option.active : option.idle
                }`}
              >
                {checked ? '✓ ' : ''}
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------- Categorias e contas ---------- */}
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MultiSelectFilter
          label="Categorias"
          options={categoryOptions}
          selected={categoryIds}
          onChange={changeFilter(setCategoryIds)}
          allLabel="Todas as categorias"
          disabled={busy}
        />
        <MultiSelectFilter
          label="Contas"
          options={accountOptions}
          selected={accountIds}
          onChange={changeFilter(setAccountIds)}
          allLabel="Todas as contas"
          disabled={busy}
        />
      </div>

      {optionsError && (
        <p className="mt-2 text-xs text-gray-500">
          Não foi possível carregar todas as opções de filtro. A exportação continua disponível.
        </p>
      )}
      {categoryIds.length > 0 && types.includes('TRANSFER') && (
        <p className="mt-2 text-xs text-gray-500">
          Transferências não têm categoria própria: com filtro de categoria, elas não entram no arquivo.
        </p>
      )}

      <p className="mt-8 text-xs text-gray-500">
        Será exportado em extrato: <strong className="text-gray-800">{summaryParts.join(' · ')}</strong>
      </p>

      {/* ---------- Ações ---------- */}
      <div className="mt-3 flex gap-2 sm:justify-end">
        <button
          type="button"
          onClick={() => handleExport('csv')}
          disabled={busy}
          className={`${BUTTON_CLASS} bg-green-500 hover:bg-green-700`}
        >
          {loading === 'csv' ? 'Gerando...' : 'Exportar CSV'}
        </button>
        <button
          type="button"
          onClick={() => handleExport('pdf')}
          disabled={busy}
          className={`${BUTTON_CLASS} bg-red-500 hover:bg-red-700`}
        >
          {loading === 'pdf' ? 'Gerando...' : 'Exportar PDF'}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && !error && <p className="mt-3 text-sm text-green-700">{success}</p>}
    </section>
  );
}