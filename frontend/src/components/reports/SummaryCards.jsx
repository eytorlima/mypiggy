import { formatBRL } from '../../utils/formatCurrency';

// O backend já ordena do maior para o menor total, então o primeiro item é o maior
function topOf(report) {
  return report?.items?.[0] ?? null;
}

// Categoria com mais transações (o reduce guarda o "melhor até agora")
function mostFrequentOf(report) {
  return (report?.items ?? []).reduce(
    (best, item) => (!best || item.transactionCount > best.transactionCount ? item : best),
    null
  );
}

function Label({ children }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{children}</p>
  );
}

function Row({ label, title, detail }) {
  return (
    <div className="mt-3">
      <Label>{label}</Label>
      {title ? (
        <>
          <p className="truncate font-semibold text-gray-800">{title}</p>
          <p className="text-sm text-gray-600">{detail}</p>
        </>
      ) : (
        <p className="text-gray-400">—</p>
      )}
    </div>
  );
}

/** Card de um lado do fluxo: total + maior categoria + categoria mais frequente */
function FlowCard({ heading, totalClass, report, topLabel }) {
  const top = topOf(report);
  const frequent = mostFrequentOf(report);

  return (
    <div className="rounded-xl bg-white p-5 shadow">
      <Label>{heading}</Label>
      <p className={`text-2xl font-bold ${totalClass}`}>
        {report ? formatBRL(report.totalInCents) : '—'}
      </p>

      <Row
        label={topLabel}
        title={top?.name}
        detail={top ? formatBRL(top.totalInCents) : ''}
      />
      <Row
        label="Categoria mais frequente"
        title={frequent?.name}
        detail={
          frequent
            ? `${frequent.transactionCount} ${
                frequent.transactionCount === 1 ? 'transação' : 'transações'
              }`
            : ''
        }
      />
    </div>
  );
}

/**
 * Faixa de resumo do topo da tela: Entradas | Saídas | Saldo do mês.
 * Sempre mostra os dois lados, independente da aba escolhida no gráfico.
 *
 * @param incomeReport   relatório por categoria com type=CREDIT (ou null enquanto carrega)
 * @param expenseReport  relatório por categoria com type=DEBIT  (ou null enquanto carrega)
 */
export default function SummaryCards({ incomeReport, expenseReport }) {
  const ready = incomeReport && expenseReport;
  const net = ready ? incomeReport.totalInCents - expenseReport.totalInCents : null;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <FlowCard
        heading="Total de entradas"
        totalClass="text-green-600"
        report={incomeReport}
        topLabel="Maior receita"
      />

      <FlowCard
        heading="Total de saídas"
        totalClass="text-red-600"
        report={expenseReport}
        topLabel="Maior despesa"
      />

      <div className="rounded-xl bg-white p-5 shadow">
        <Label>Saldo do mês</Label>
        {net === null ? (
          <p className="text-2xl font-bold text-gray-400">—</p>
        ) : (
          <p
            className={`text-2xl font-bold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {net < 0 ? '-' : ''}
            {formatBRL(Math.abs(net))}
          </p>
        )}
        <p className="mt-3 text-sm text-gray-500">Entradas menos saídas no mês selecionado.</p>
      </div>
    </div>
  );
}