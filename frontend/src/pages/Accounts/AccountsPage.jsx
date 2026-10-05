import { useState, useEffect } from 'react';
import { getAccounts, deleteAccount } from '../../services/accountService';
import { AccountCard } from '../../components/ui/AccountCard';
import { AccountFormModal } from '../../components/ui/AccountFormModal';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';
import { SkeletonCard } from '../../components/ui/SkeletonCard';
import AddOutlined from '@mui/icons-material/AddOutlined';
import SavingsOutlined from '@mui/icons-material/SavingsOutlined';

export function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal de formulário
  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  // Modal de confirmação de exclusão
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      setLoading(true);
      setError('');
      const data = await getAccounts();
      setAccounts(data || []);
    } catch {
      setError('Não foi possível carregar as contas.');
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setEditingAccount(null);
    setFormOpen(true);
  }

  function handleOpenEdit(account) {
    setEditingAccount(account);
    setFormOpen(true);
  }

  function handleOpenDelete(account) {
    setDeletingAccount(account);
    setDeleteOpen(true);
  }

  async function handleConfirmDelete() {
    if (!deletingAccount) return;
    try {
      setDeleteLoading(true);
      setError('');
      await deleteAccount(deletingAccount.id);
      setAccounts(prev => prev.filter(a => a.id !== deletingAccount.id));
      setDeleteOpen(false);
      setDeletingAccount(null);
    } catch (err) {
      setDeleteOpen(false);
      setError(
        err.response?.data?.message || 'Não foi possível excluir a conta.'
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  function handleFormSuccess(savedAccount, isEdit) {
    if (!savedAccount || !savedAccount.id) {
      loadAccounts();
    } else if (isEdit) {
      setAccounts(prev => prev.map(a => (a.id === savedAccount.id ? savedAccount : a)));
    } else {
      setAccounts(prev => [...prev, savedAccount]);
    }
    setFormOpen(false);
    setEditingAccount(null);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-center w-full relative mt-5">
        <h2 className="font-bold text-gray-700">Minhas contas</h2>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="text-primary-500 text-sm flex items-center font-semibold absolute right-0 gap-1 opacity-75 p-2 bg-primary-100/90 rounded-md
          hover:opacity-100 hover:cursor-pointer hover:bg-primary-100 hover:shadow-xs ease-in-out duration-200"
        >
          <AddOutlined fontSize="small" />
          Adicionar
        </button>
      </div>

      {loading && (
        <div className="flex flex-col gap-3">
          <SkeletonCard height="h-20" />
          <SkeletonCard height="h-20" />
          <SkeletonCard height="h-20" />
        </div>
      )}

      {!loading && accounts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <SavingsOutlined className="text-gray-300" style={{ fontSize: 64 }} />
          <p className="text-gray-500 font-medium">Nenhuma conta cadastrada</p>
          <p className="text-gray-400 text-sm">Adicione sua primeira conta para começar.</p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-2 px-5 py-2 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:cursor-pointer hover:bg-primary-600 transition-colors"
          >
            Adicionar conta
          </button>
        </div>
      )}

      {!loading && accounts.length > 0 && (
        <div className="flex flex-col gap-3">
          {accounts.map(account => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={() => handleOpenEdit(account)}
              onDelete={() => handleOpenDelete(account)}
            />
          ))}
        </div>
      )}

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <AccountFormModal
        open={formOpen}
        account={editingAccount}
        onClose={() => { setFormOpen(false); setEditingAccount(null); }}
        onSuccess={handleFormSuccess}
      />

      <ConfirmDeleteModal
        open={deleteOpen}
        accountName={deletingAccount?.name}
        loading={deleteLoading}
        onClose={() => { setDeleteOpen(false); setDeletingAccount(null); }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}