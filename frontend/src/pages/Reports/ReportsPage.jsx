import { useEffect, useMemo, useState } from 'react';
import CategoryBarChart from '../../components/reports/CategoryBarChart';
import CategoryLegend from '../../components/reports/CategoryLegend';
import CategoryPieChart from '../../components/reports/CategoryPieChart';
import MonthlyBarChart from '../../components/reports/MonthlyBarChart';
import MonthSelector from '../../components/reports/MonthSelector';
import SummaryCards from '../../components/reports/SummaryCards';
import ExportButtons from '../../components/reports/ExportButtons';
import { getByCategory, getMonthly } from '../../services/reportService';
import { assignCategoryColors, keyOf } from '../../utils/categoryColors';
import { formatBRL } from '../../utils/formatCurrency';
import { currentMonth } from '../../utils/month';

function ChartSkeleton({ height = 'h-64' }) {
  return <div className={`${height} w-full animate-pulse rounded-xl bg-gray-200`} />;
}

// Ocupa exatamente a altura do gráfico (h-64). Quando não há gráfico para mostrar
// (sem dados, erro, tudo oculto), o card mantém o mesmo tamanho em vez de encolher.
function ChartPlaceholder({ children, className = 'text-gray-500' }) {
  return (
    <div className={`flex h-64 items-center justify-center px-4 text-center text-sm ${className}`}>
      {children}
    </div>
  );
}

export function ReportsPage() {
  // ---- Estado dos controles ----
  const [month, setMonth] = useState(currentMonth());
  const [type, setType] = useState('CREDIT'); // 'DEBIT' = Saídas | 'CREDIT' = Entradas
  const [view, setView] = useState('pie'); // 'pie' | 'bar'
  const [months, setMonths] = useState(6); // janela do gráfico mensal
  const [hidden, setHidden] = useState(() => new Set()); // categorias ocultas na legenda

  // ---- Estado dos dados ----
  // Os dois tipos são buscados juntos: os cards do topo sempre mostram Entradas e Saídas,
  // e a aba do gráfico só escolhe qual dos dois relatórios desenhar (sem nova consulta).
  const [incomeReport, setIncomeReport] = useState(null);
  const [expenseReport, setExpenseReport] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState('');

  const [monthlyReport, setMonthlyReport] = useState(null);
  const [monthlyLoading, setMonthlyLoading] = useState(true);
  const [monthlyError, setMonthlyError] = useState('');

  // Relatórios por categoria (entradas + saídas): recarrega quando muda o mês
  useEffect(() => {
    let cancelled = false; // evita que uma resposta antiga sobrescreva uma mais nova

    setCategoryLoading(true);
    setCategoryError('');

    Promise.all([getByCategory(month, 'CREDIT'), getByCategory(month, 'DEBIT')])
      .then(([income, expense]) => {
        if (cancelled) return;
        setIncomeReport(income);
        setExpenseReport(expense);
      })
      .catch(() => {
        if (!cancelled) setCategoryError('Não foi possível carregar o relatório por categoria.');
      })
      .finally(() => {
        if (!cancelled) setCategoryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [month]);

  // Relatório mensal: recarrega quando muda a janela (3/6/12 meses)
  useEffect(() => {
    let cancelled = false;

    setMonthlyLoading(true);
    setMonthlyError('');

    getMonthly(months)
      .then((data) => {
        if (!cancelled) setMonthlyReport(data);
      })
      .catch(() => {
        if (!cancelled) setMonthlyError('Não foi possível carregar o relatório mensal.');
      })
      .finally(() => {
        if (!cancelled) setMonthlyLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [months]);

  // ---- Valores derivados (calculados a partir do estado, nunca guardados nele) ----
  const categoryReport = type === 'DEBIT' ? expenseReport : incomeReport;

  const allItems = useMemo(() => categoryReport?.items ?? [], [categoryReport]);

  // Cores calculadas com TODAS as categorias para não mudarem ao ocultar uma
  const colors = useMemo(() => assignCategoryColors(allItems), [allItems]);

  const visibleItems = useMemo(
    () => allItems.filter((item) => !hidden.has(keyOf(item))),
    [allItems, hidden]
  );

  const visibleTotal = useMemo(
    () => visibleItems.reduce((sum, item) => sum + item.totalInCents, 0),
    [visibleItems]
  );

  // Trocar mês ou tipo começa uma "legenda nova": tudo volta a ficar visível
  function changeMonth(next) {
    setMonth(next);
    setHidden(new Set());
  }

  function changeType(next) {
    setType(next);
    setHidden(new Set());
  }

  function toggleCategory(key) {
    setHidden((previous) => {
      const next = new Set(previous); // nunca mutar o Set do estado: copiar e depois salvar
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const Chart = view === 'pie' ? CategoryPieChart : CategoryBarChart;
  const hasData = !categoryLoading && !categoryError && allItems.length > 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 pb-28 pt-4">
      <h1 className="text-center text-lg font-bold uppercase tracking-wide text-gray-800">
        Relatórios
      </h1>

      <MonthSelector month={month} onChange={changeMonth} />

      {/* ---------- Resumo do topo: entradas | saídas | saldo ---------- */}
      {!categoryError && (
        <SummaryCards
          incomeReport={categoryLoading ? null : incomeReport}
          expenseReport={categoryLoading ? null : expenseReport}
        />
      )}

      {/* ---------- Gráficos lado a lado (empilham no celular) ---------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        {/* Gráfico por categoria */}
        <section className="rounded-xl bg-white p-4 shadow">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => changeType('CREDIT')}
                className={`rounded-lg px-3 py-1 text-sm font-medium transition hover:cursor-pointer ${
                  type === 'CREDIT'
                    ? 'bg-green-500 text-white'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                Entradas
              </button>
              <button
                type="button"
                onClick={() => changeType('DEBIT')}
                className={`rounded-lg px-3 py-1 text-sm font-medium transition hover:cursor-pointer ${
                  type === 'DEBIT'
                    ? 'bg-red-500 text-white'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                Saídas
              </button>
            </div>

            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setView('pie')}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition hover:cursor-pointer ${
                  view === 'pie' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Pizza
              </button>
              <button
                type="button"
                onClick={() => setView('bar')}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition hover:cursor-pointer ${
                  view === 'bar' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Colunas
              </button>
            </div>
          </div>

          {/* Sempre renderizado (mostra R$ 0,00 sem dados) para a altura não variar */}
          <p className="mb-2 text-center text-sm text-gray-500">
            Total exibido: <strong className="text-gray-800">{formatBRL(visibleTotal)}</strong>
          </p>

          {categoryLoading ? (
            <ChartSkeleton />
          ) : categoryError ? (
            <ChartPlaceholder className="text-red-600">{categoryError}</ChartPlaceholder>
          ) : allItems.length === 0 ? (
            <ChartPlaceholder>
              Nenhuma {type === 'DEBIT' ? 'saída' : 'entrada'} registrada neste mês.
            </ChartPlaceholder>
          ) : visibleItems.length === 0 ? (
            <ChartPlaceholder>
              Todas as categorias estão ocultas. Clique na legenda para mostrá-las.
            </ChartPlaceholder>
          ) : (
            <Chart items={visibleItems} colors={colors} />
          )}

          {/* A legenda só existe com dados: é ela que faz o card crescer */}
          {hasData && (
            <CategoryLegend
              items={allItems}
              colors={colors}
              hidden={hidden}
              onToggle={toggleCategory}
              visibleTotal={visibleTotal}
            />
          )}
        </section>

        {/* Receitas x despesas por mês */}
        <section className="rounded-xl bg-white p-6 shadow sm:p-8">
          {monthlyError ? (
            <p className="py-10 text-center text-sm text-red-600">{monthlyError}</p>
          ) : monthlyLoading && !monthlyReport ? (
            <ChartSkeleton height="h-80" />
          ) : (
            <MonthlyBarChart report={monthlyReport} months={months} onChangeMonths={setMonths} />
          )}
        </section>
      </div>

      <ExportButtons />
    </div>
  );
}