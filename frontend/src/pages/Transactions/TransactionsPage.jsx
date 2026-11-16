import { useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getAccounts } from '../../services/accountService';
import { getCategories } from '../../services/categoryService';
import { getTransactions, deleteTransaction, deactivateRecurrence } from '../../services/transactionService';
import { TransactionFilters, DEFAULT_FILTERS } from '../../components/transactions/TransactionFilters';
import { TransactionItem } from '../../components/transactions/TransactionItem';
import { TransactionFormModal } from '../../components/transactions/TransactionFormModal';
import { TransactionDeleteModal } from '../../components/transactions/TransactionDeleteModal';
import { RecurrenceEndModal } from '../../components/transactions/RecurrenceEndModal';
import { SkeletonCard } from '../../components/ui/SkeletonCard';
import { useToast } from '../../contexts/ToastContext';
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
  const { refreshKey } = useOutletContext();
  const toast = useToast();
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  // query = filtros "aplicados": é ela que dispara a busca (a digitação passa por debounce)
  const [query, setQuery] = useState(filters);
  const lastSearchRef = useRef(filters.search);
  const [reloadKey, setReloadKey] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // só erros de carregamento (inline)

  // Modal de formulário
  const [formOpen, setFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Modal de exclusão
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Modal de encerrar recorrência
  const [endOpen, setEndOpen] = useState(false);
  const [endingTransaction, setEndingTransaction] = useState(null);
  const [endLoading, setEndLoading] = useState(false);

  /* Contas e categorias */
  async function loadAccounts() {
    try {
      setAccounts((await getAccounts()) || []);
    } catch {
      setError('Não foi possível carregar as contas.');
    }
  }

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data || []))
      .catch(() => setError('Não foi possível carregar as categorias.'));
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [refreshKey]);

  /* Debounce: só a digitação espera 300ms; mês/tipo/conta/categoria aplicam na hora */
  useEffect(() => {
    if (filters.search === lastSearchRef.current) {
      setQuery(filters);
      return;
    }
    const t = setTimeout(() => {
      lastSearchRef.current = filters.search;
      setQuery(filters);
    }, 300);
    return () => clearTimeout(t);
  }, [filters]);

  /* Transações: recarregadas quando os filtros mudam ou após salvar/excluir */
  useEffect(() => {
    let cancelled = false; // evita que uma resposta antiga sobrescreva a nova

    async function load() {
      try {
        setLoading(true);
        setError('');

        const params = {
          type: query.type,
          accountId: query.accountId,
          categoryId: query.categoryId,
          search: query.search.trim(),
        };

        if (query.month) {
          const [year, month] = query.month.split('-').map(Number);
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
  }, [query, reloadKey, refreshKey]);

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

  async function handleConfirmDelete(scope = 'ONE') {
    if (!deletingTransaction) return;
    try {
      setDeleteLoading(true);
      await deleteTransaction(deletingTransaction.id, scope);
      handleCloseDelete();
      refresh();
      toast.success(scope === 'ONE' ? 'Transação excluída.' : 'Transações excluídas.');
    } catch (err) {
      handleCloseDelete();
      toast.error(err.response?.data?.message || 'Não foi possível excluir a transação.');
    } finally {
      setDeleteLoading(false);
    }
  }

  function handleOpenEnd(transaction) {
    setEndingTransaction(transaction);
    setEndOpen(true);
  }

  function handleCloseEnd() {
    setEndOpen(false);
    setEndingTransaction(null);
  }

  async function handleConfirmEnd() {
    if (!endingTransaction) return;
    try {
      setEndLoading(true);
      await deactivateRecurrence(endingTransaction.id);
      handleCloseEnd();
      refresh();
      toast.success('Recorrência encerrada.');
    } catch (err) {
      handleCloseEnd();
      toast.error(err.response?.data?.message || 'Não foi possível encerrar a recorrência.');
    } finally {
      setEndLoading(false);
    }
  }

  const isSearching = query.search.trim() !== '';

  return (
    <div className="flex flex-col gap-4 p-4 w-full max-w-4xl mx-auto" aria-busy={loading}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-center w-full relative mt-5">
        <h1 className="font-bold text-gray-700">Transações</h1>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="text-primary-700 text-sm flex items-center font-semibold absolute right-0 gap-1 p-2 bg-primary-100/90 rounded-md
          hover:cursor-pointer hover:bg-primary-100 hover:shadow-xs ease-in-out duration-200"
        >
          <AddOutlined fontSize="small" aria-hidden="true" />
          {/* No celular o título ocupa o centro: texto curto evita sobreposição */}
          <span className="sm:hidden">Nova</span>
          <span className="hidden sm:inline">Nova transação</span>
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
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-white border border-gray-100 rounded-2xl p-2 sm:p-3 shadow-sm text-center min-w-0">
            <p className="text-xs text-gray-500">Receitas</p>
            <p className="font-bold text-xs sm:text-sm text-primary-700 break-words">{formatBRL(totals.income)}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-2 sm:p-3 shadow-sm text-center min-w-0">
            <p className="text-xs text-gray-500">Despesas</p>
            <p className="font-bold text-xs sm:text-sm text-red-600 break-words">{formatBRL(totals.expense)}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-2 sm:p-3 shadow-sm text-center min-w-0">
            <p className="text-xs text-gray-500">Resultado</p>
            <p
              className={`font-bold text-xs sm:text-sm break-words ${totals.result < 0 ? 'text-red-600' : 'text-primary-700'}`}
            >
              {formatBRL(totals.result)}
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col gap-3">
          <p className="sr-only" role="status">Carregando transações...</p>
          <SkeletonCard height="h-20" />
          <SkeletonCard height="h-20" />
          <SkeletonCard height="h-20" />
        </div>
      )}

      {!loading && transactions.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <ReceiptLongOutlined className="text-gray-300" style={{ fontSize: 64 }} aria-hidden="true" />
          <p className="text-gray-500 font-medium">Nenhuma transação encontrada</p>
          <p className="text-gray-500 text-sm">
            {isSearching
              ? 'Nenhum resultado para a pesquisa. Tente outros termos.'
              : 'Ajuste os filtros ou registre uma nova transação.'}
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
            <h2 className="text-sm font-semibold text-gray-500 capitalize px-1">
              {dayLabel(group.date)}
            </h2>
            {group.items.map((t) => (
              <TransactionItem
                key={t.id}
                transaction={t}
                onEdit={() => handleOpenEdit(t)}
                onDelete={() => handleOpenDelete(t)}
                onEndRecurrence={() => handleOpenEnd(t)}
              />
            ))}
          </section>
        ))}

      {error && (
        <p role="alert" className="text-red-600 text-sm text-center">{error}</p>
      )}

      <TransactionFormModal
        open={formOpen}
        transaction={editingTransaction}
        accounts={accounts}
        categories={categories}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        onEndRecurrence={(t) => {
          handleCloseForm();
          handleOpenEnd(t);
        }}
      />

      <TransactionDeleteModal
        open={deleteOpen}
        transaction={deletingTransaction}
        loading={deleteLoading}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
      />

      <RecurrenceEndModal
        open={endOpen}
        transaction={endingTransaction}
        loading={endLoading}
        onClose={handleCloseEnd}
        onConfirm={handleConfirmEnd}
      />
    </div>
  );
}