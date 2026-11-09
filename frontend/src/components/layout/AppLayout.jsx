import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { TransactionFormModal } from '../transactions/TransactionFormModal';
import { getAccounts } from '../../services/accountService';
import { getCategories } from '../../services/categoryService';

export function AppLayout() {
  const [fabOpen, setFabOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Sobe 1 a cada transação salva pelo FAB. As páginas recebem esse número via
  // <Outlet context> e recarregam seus dados quando ele muda.
  const [refreshKey, setRefreshKey] = useState(0);

  // Contas e categorias que o formulário precisa
  async function loadFormData() {
    const [accountsData, categoriesData] = await Promise.all([
      getAccounts().catch(() => []),
      getCategories().catch(() => []),
    ]);
    setAccounts(accountsData || []);
    setCategories(categoriesData || []);
  }

  // Pré-carrega ao entrar no app e depois de cada transação salva
  useEffect(() => {
    loadFormData();
  }, [refreshKey]);

  function handleFabClick() {
    loadFormData(); // garante a lista atualizada (ex.: conta criada há pouco)
    setFabOpen(true);
  }

  function handleSuccess() {
    setFabOpen(false);
    setRefreshKey((k) => k + 1); // avisa a página aberta (Dashboard, Transações...)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      {/* Espaço do header fixo */}
      <div className="pt-16 pb-20 flex-1">
        <Outlet context={{ refreshKey }} />
      </div>

      <BottomNav onFabClick={handleFabClick} />

      <TransactionFormModal
        open={fabOpen}
        transaction={null}
        accounts={accounts}
        categories={categories}
        onClose={() => setFabOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}