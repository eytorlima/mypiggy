import { useEffect, useMemo, useState } from 'react';
import { getAccounts } from '../../services/accountService';
import { getCategories } from '../../services/categoryService';
import { getTransactions, deleteTransaction } from '../../services/transactionService';
import { TransactionFilters, DEFAULT_FILTERS } from '../../components/transactions/TransactionFilters';
import { TransactionItem } from '../../components/transactions/TransactionItem';
import { TransactionFormModal } from '../../components/transactions/TransactionFormModal';
import { TransactionDeleteModal } from '../../components/transactions/TransactionDeleteModal';
import { SkeletonCard } from '../../components/ui/SkeletonCard';
import { formatBRL } from '../../utils/formatCurrency';
import { monthRange, toLocalDateTime } from '../../utils/dateUtils';
import AddOutlined from '@mui/icons-material/AddOutlined';
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';

// "2026-10-07" -> "Hoje · quarta-feira, 07 de outubro"
function dayLabel(dateStr) {
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const today = toLocalDateTime(now).slice(0, 10);
  const yest = toLocalDateTime(yesterday).slice(0, 10);

  // Monta a Date com partes locais (evita o deslocamento de fuso do UTC)
  const [y, m, d] = dateStr.split('-').map(Number);
  const pretty = new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  if (dateStr === today) return `Hoje · ${pretty}`;
  if (dateStr === yest) return `Ontem · ${pretty}`;
  return pretty;
}

export function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [reloadKey, setReloadKey] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal de formulário
  const [formOpen, setFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Modal de exclusão
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* Contas e categorias: carregadas uma vez */
  async function loadAccounts() {
    try {
      setAccounts((await getAccounts()) || []);
    } catch {
      setError('Não foi possível carregar as contas.');
    }
  }

  useEffect(() => {
    loadAccounts();
    getCategories()
      .then((data) => setCategories(data || []))
      .catch(() => setError('Não foi possível carregar as categorias.'));
  }, []);

  /* Transações: recarregadas quando os filtros mudam ou após salvar/excluir */
  useEffect(() => {
    let cancelled = false; // evita que uma resposta antiga sobrescreva a nova

    async function load() {
      try {
        setLoading(true);
        setError('');

        const params = {
          type: filters.type,
          accountId: filters.accountId,
          categoryId: filters.categoryId,
        };

        if (filters.month) {
          const [year, month] = filters.month.split('-').map(Number);
          Object.assign(params, monthRange(year, month));
        }

        const data = await getTransactions(params);
        if (!cancelled) setTransactions(data || []);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message || 'Não foi possível carregar as transações.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [filters, reloadKey]);

  /* Agrupamento por dia (mais recente primeiro) */
  const groups = useMemo(() => {
    const sorted = [...transactions].sort((a, b) =>
      b.transactionDate.localeCompare(a.transactionDate)
    );
    const map = new Map();
    for (const t of sorted) {
      const key = t.transactionDate.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    }
    return [...map.entries()].map(([date, items]) => ({ date, items }));
  }, [transactions]);

  /* Totais da lista filtrada (transferência não entra) */
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.transactionType === 'CREDIT') income += t.amountInCents;
      if (t.transactionType === 'DEBIT') expense += t.amountInCents;
    }
    return { income, expense, result: income - expense };
  }, [transactions]);

  /* Ações */
  function refresh() {
    setReloadKey((k) => k + 1); // recarrega a lista
    loadAccounts(); // saldos mudaram
  }

  function handleOpenCreate() {
    setEditingTransaction(null);
    setFormOpen(true);
  }

  function handleOpenEdit(transaction) {
    setEditingTransaction(transaction);
    setFormOpen(true);
  }

  function handleCloseForm() {
    setFormOpen(false);
    setEditingTransaction(null);
  }

  function handleFormSuccess() {
    handleCloseForm();
    refresh();
  }

  function handleOpenDelete(transaction) {
    setDeletingTransaction(transaction);
    setDeleteOpen(true);
  }

  function handleCloseDelete() {
    setDeleteOpen(false);
    setDeletingTransaction(null);
  }

  async function handleConfirmDelete() {
    if (!deletingTransaction) return;
    try {
      setDeleteLoading(true);
      setError('');
      await deleteTransaction(deletingTransaction.id);
      handleCloseDelete();
      refresh();
    } catch (err) {
      handleCloseDelete();
      setError(err.response?.data?.message || 'Não foi possível excluir a transação.');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-center w-full relative mt-5">
        <h2 className="font-bold text-gray-700">Transações</h2>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="text-primary-500 text-sm flex items-center font-semibold absolute right-0 gap-1 opacity-75 p-2 bg-primary-100/90 rounded-md
          hover:opacity-100 hover:cursor-pointer hover:bg-primary-100 hover:shadow-xs ease-in-out duration-200"
        >
          <AddOutlined fontSize="small" />
          Nova transação
        </button>
      </div>

      <TransactionFilters
        filters={filters}
        onChange={setFilters}
        accounts={accounts}
        categories={categories}
      />

      {/* Resumo da lista filtrada */}
      {!loading && transactions.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm text-center">
            <p className="text-xs text-gray-400">Receitas</p>
            <p className="font-bold text-sm text-primary-600">{formatBRL(totals.income)}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm text-center">
            <p className="text-xs text-gray-400">Despesas</p>
            <p className="font-bold text-sm text-red-600">{formatBRL(totals.expense)}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm text-center">
            <p className="text-xs text-gray-400">Resultado</p>
            <p
              className={`font-bold text-sm ${totals.result < 0 ? 'text-red-600' : 'text-primary-600'}`}
            >
              {formatBRL(totals.result)}
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col gap-3">
          <SkeletonCard height="h-20" />
          <SkeletonCard height="h-20" />
          <SkeletonCard height="h-20" />
        </div>
      )}

      {!loading && transactions.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <ReceiptLongOutlined className="text-gray-300" style={{ fontSize: 64 }} />
          <p className="text-gray-500 font-medium">Nenhuma transação encontrada</p>
          <p className="text-gray-400 text-sm">
            Ajuste os filtros ou registre uma nova transação.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-2 px-5 py-2 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:cursor-pointer hover:bg-primary-600 transition-colors"
          >
            Nova transação
          </button>
        </div>
      )}

      {!loading &&
        groups.map((group) => (
          <section key={group.date} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-gray-500 capitalize px-1">
              {dayLabel(group.date)}
            </h3>
            {group.items.map((t) => (
              <TransactionItem
                key={t.id}
                transaction={t}
                onEdit={() => handleOpenEdit(t)}
                onDelete={() => handleOpenDelete(t)}
              />
            ))}
          </section>
        ))}

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <TransactionFormModal
        open={formOpen}
        transaction={editingTransaction}
        accounts={accounts}
        categories={categories}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
      />

      <TransactionDeleteModal
        open={deleteOpen}
        transaction={deletingTransaction}
        loading={deleteLoading}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}