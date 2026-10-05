import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAccounts, getSummary } from '../../services/accountService';
import { getMonthlySummary } from '../../services/transactionService';
import { BalanceCard } from '../../components/ui/BalanceCard';
import { AccountsSection } from '../../components/ui/AccountSection';
import { SkeletonCard } from '../../components/ui/SkeletonCard';

const EMPTY_MONTHLY = { monthlyIncome: 0, monthlyExpense: 0 };

export function DashboardPage() {
  const { user } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState({ totalBalance: 0, ...EMPTY_MONTHLY });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError('');

        // Contas, saldo total (soma das contas) e resumo mensal em paralelo
        const [accountsData, totalBalance, monthly] = await Promise.all([
          getAccounts().catch(() => []),
          getSummary().catch(() => null),
          getMonthlySummary().catch(() => EMPTY_MONTHLY),
        ]);

        const list = accountsData || [];

        // Fallback: se o endpoint falhar, soma localmente
        const total =
          totalBalance ??
          list.reduce((sum, a) => sum + (a.balanceInCents || 0), 0);

        setAccounts(list);
        setSummary({
          totalBalance: total,
          monthlyIncome: monthly?.monthlyIncome ?? 0,
          monthlyExpense: monthly?.monthlyExpense ?? 0,
        });
      } catch {
        setError('Não foi possível carregar o dashboard.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

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