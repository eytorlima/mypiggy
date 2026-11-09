import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAccounts } from '../../services/accountService';
import { getMonthlySummary } from '../../services/transactionService';
import { BalanceCard } from '../../components/ui/BalanceCard';
import { AccountsSection } from '../../components/ui/AccountSection';
import { SkeletonCard } from '../../components/ui/SkeletonCard';

const EMPTY_MONTHLY = { monthlyIncome: 0, monthlyExpense: 0 };

export function DashboardPage() {
  const { user } = useAuth();
  const { refreshKey } = useOutletContext(); // muda quando uma transação é salva pelo FAB

  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState({ totalBalance: 0, ...EMPTY_MONTHLY });
  const [loading, setLoading] = useState(true); // true só na 1ª carga
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false; // evita que uma resposta antiga sobrescreva a nova

    async function loadDashboard() {
      try {
        setError('');

        // Contas e resumo mensal em paralelo
        const [accountsData, monthly] = await Promise.all([
          getAccounts(),
          getMonthlySummary().catch(() => EMPTY_MONTHLY),
        ]);

        if (cancelled) return;

        const list = accountsData || [];

        setAccounts(list);
        setSummary({
          // Saldo total = soma das contas exibidas (sempre consistente com os cards)
          totalBalance: list.reduce((sum, a) => sum + (a.balanceInCents || 0), 0),
          monthlyIncome: monthly?.monthlyIncome ?? 0,
          monthlyExpense: monthly?.monthlyExpense ?? 0,
        });
      } catch {
        if (!cancelled) setError('Não foi possível carregar o dashboard.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col items-center mt-4 mb-4">
        <h1 className="text-xl font-bold text-gray-800">
          Olá, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-400">Aqui está o resumo das suas finanças.</p>
      </div>

      {loading ? (
        <SkeletonCard height="h-36" />
      ) : (
        <BalanceCard
          totalBalance={summary.totalBalance}
          monthlyIncome={summary.monthlyIncome}
          monthlyExpense={summary.monthlyExpense}
        />
      )}

      {loading ? (
        <SkeletonCard height="h-36" />
      ) : (
        <AccountsSection accounts={accounts} />
      )}

      {error && (
        <p className="text-red-500 text-sm text-center mt-4">{error}</p>
      )}
    </div>
  );
}