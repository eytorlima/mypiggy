import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAccounts, getSummary } from '../../services/accountService';
import { getMonthlySummary } from '../../services/transactionService';
import { BalanceCard } from '../../components/ui/BalanceCard';
import { AccountCard } from '../../components/ui/AccountCard';
import { AccountsSection } from '../../components/ui/AccountSection';
import { SkeletonCard } from '../../components/ui/SkeletonCard';

import AddOutlined from '@mui/icons-material/AddOutlined';
import SavingsOutlined from '@mui/icons-material/SavingsOutlined';

export function DashboardPage() {
  const { user } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState({ totalBalance: 0, monthlyIncome: 0, monthlyExpense: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);

        // Carrega contas e resumo em paralelo
        const [accountsData, summaryData] = await Promise.all([
          getAccounts().catch(() => []),
          getMonthlySummary().catch(() => ({ totalBalance: 0, monthlyIncome: 0, monthlyExpense: 0 })),
        ]);

        setAccounts(accountsData || []);
        setSummary(summaryData || { totalBalance: 0, monthlyIncome: 0, monthlyExpense: 0 });
      } catch (err) {
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
        <AccountsSection
          accounts={accounts}
        />
      )}
      
      {error && (
        <p className="text-red-500 text-sm text-center mt-4">{error}</p>
      )}

    </div>
  );
}