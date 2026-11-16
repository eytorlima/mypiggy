import { useState, useEffect } from 'react';
import { getAccounts, deleteAccount } from '../../services/accountService';
import { AccountCard } from '../../components/ui/AccountCard';
import { AccountFormModal } from '../../components/ui/AccountFormModal';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';
import { SkeletonCard } from '../../components/ui/SkeletonCard';
import { useToast } from '../../contexts/ToastContext';
import AddOutlined from '@mui/icons-material/AddOutlined';
import SavingsOutlined from '@mui/icons-material/SavingsOutlined';

export function AccountsPage() {
  const toast = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // só erro de carregamento (inline)

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
      await deleteAccount(deletingAccount.id);
      setAccounts(prev => prev.filter(a => a.id !== deletingAccount.id));
      setDeleteOpen(false);
      setDeletingAccount(null);
      toast.success('Conta excluída.');
    } catch (err) {
      setDeleteOpen(false);
      toast.error(err.response?.data?.message || 'Não foi possível excluir a conta.');
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
    <div className="flex flex-col gap-4 p-4 w-full max-w-3xl mx-auto" aria-busy={loading}>
      <div className="flex items-center justify-center w-full relative mt-5">
        <h1 className="font-bold text-gray-700">Minhas contas</h1>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="text-primary-700 text-sm flex items-center font-semibold absolute right-0 gap-1 p-2 bg-primary-100/90 rounded-md
          hover:cursor-pointer hover:bg-primary-100 hover:shadow-xs ease-in-out duration-200"
        >
          <AddOutlined fontSize="small" aria-hidden="true" />
          Adicionar
        </button>
      </div>

      {loading && (
        <div className="flex flex-col gap-3">
          <p className="sr-only" role="status">Carregando contas...</p>
          <SkeletonCard height="h-20" />
          <SkeletonCard height="h-20" />
          <SkeletonCard height="h-20" />
        </div>
      )}

      {!loading && !error && accounts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <SavingsOutlined className="text-gray-300" style={{ fontSize: 64 }} aria-hidden="true" />
          <p className="text-gray-500 font-medium">Nenhuma conta cadastrada</p>
          <p className="text-gray-500 text-sm">Adicione sua primeira conta para começar.</p>
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

      {error && (
        <p role="alert" className="text-red-600 text-sm text-center">{error}</p>
      )}

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