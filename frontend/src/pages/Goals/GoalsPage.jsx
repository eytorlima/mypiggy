import { useCallback, useEffect, useState } from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import SavingsOutlined from '@mui/icons-material/SavingsOutlined';
import { getAccounts } from '../../services/accountService';
import { deletePiggyBank, getPiggyBanks } from '../../services/PiggyBankService';
import { SkeletonCard } from '../../components/ui/SkeletonCard';
import { PiggyBankCard } from '../../components/piggybank/PiggyBankCard';
import { PiggyBankFormModal } from '../../components/piggybank/PiggyBankFormModal';
import { DepositWithdrawModal } from '../../components/piggybank/DepositWithdrawModal';
import { PiggyBankDeleteModal } from '../../components/piggybank/PiggyBankDeleteModal';
import { formatBRL } from '../../utils/formatCurrency';

export function GoalsPage() {
  const [piggyBanks, setPiggyBanks] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal de criar/editar
  const [formOpen, setFormOpen] = useState(false);
  const [editingPiggy, setEditingPiggy] = useState(null);

  // Modal de guardar/retirar
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveMode, setMoveMode] = useState('deposit');
  const [movingPiggy, setMovingPiggy] = useState(null);

  // Modal de exclusão
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingPiggy, setDeletingPiggy] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Guardar/retirar/excluir mexem no saldo das contas: recarrega só as contas, sem tela de loading
  const refreshAccounts = useCallback(async () => {
    try {
      setAccounts((await getAccounts()) || []);
    } catch {
      // mantém as contas atuais; a próxima abertura da tela recarrega
    }
  }, []);

  useEffect(() => {
    let cancelled = false; // evita que uma resposta antiga sobrescreva a nova

    async function load() {
      try {
        setError('');
        const [piggyData, accountData] = await Promise.all([getPiggyBanks(), getAccounts()]);
        if (cancelled) return;
        setPiggyBanks(piggyData || []);
        setAccounts(accountData || []);
      } catch {
        if (!cancelled) setError('Não foi possível carregar os porquinhos.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- Criar / editar ---------- */

  function openCreate() {
    setEditingPiggy(null);
    setFormOpen(true);
  }

  function openEdit(piggy) {
    setEditingPiggy(piggy);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingPiggy(null);
  }

  function handleFormSuccess(saved, isEdit) {
    setPiggyBanks((prev) =>
      isEdit ? prev.map((p) => (p.id === saved.id ? saved : p)) : [...prev, saved]
    );
    closeForm();
  }

  /* ---------- Guardar / retirar ---------- */

  function openMove(piggy, mode) {
    setMovingPiggy(piggy);
    setMoveMode(mode);
    setMoveOpen(true);
  }

  function closeMove() {
    setMoveOpen(false);
    setMovingPiggy(null);
  }

  // O backend devolve o porquinho já atualizado: a barra de progresso muda na hora
  function handleMoveSuccess(updated) {
    setPiggyBanks((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    refreshAccounts();
    closeMove();
  }

  /* ---------- Excluir ---------- */

  function openDelete(piggy) {
    setDeletingPiggy(piggy);
    setDeleteError('');
    setDeleteOpen(true);
  }

  function closeDelete() {
    setDeleteOpen(false);
    setDeletingPiggy(null);
  }

  async function handleConfirmDelete(returnAccountId) {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deletePiggyBank(deletingPiggy.id, returnAccountId);
      setPiggyBanks((prev) => prev.filter((p) => p.id !== deletingPiggy.id));
      refreshAccounts(); // o dinheiro devolvido mudou o saldo da conta
      closeDelete();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Não foi possível excluir o porquinho.');
    } finally {
      setDeleteLoading(false);
    }
  }

  /* ---------- Valores derivados ---------- */

  const totalSaved = piggyBanks.reduce((sum, p) => sum + (p.totalInCents || 0), 0);
  const goalsReached = piggyBanks.filter((p) => p.goalReached).length;
  // A reserva de emergência sempre existe: o estado vazio é "só ela, nenhum porquinho criado"
  const onlyEmergency = piggyBanks.length > 0 && piggyBanks.every((p) => p.isEmergency);

  return (
    <div className="mx-auto w-full max-w-6xl flex flex-col gap-4 p-4 pb-28">
      <div className="flex items-center justify-center w-full relative mt-5">
        <h2 className="font-bold text-gray-700">Meus porquinhos</h2>
        <button
          type="button"
          onClick={openCreate}
          className="text-primary-500 text-sm flex items-center font-semibold absolute right-0 gap-1 opacity-75 p-2 bg-primary-100/90 rounded-md
          hover:opacity-100 hover:cursor-pointer hover:bg-primary-100 hover:shadow-xs ease-in-out duration-200"
        >
          <AddOutlined fontSize="small" />
          Novo
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <SkeletonCard height="h-52" />
          <SkeletonCard height="h-52" />
        </div>
      )}

      {/* Resumo */}
      {!loading && piggyBanks.length > 0 && (
        <div className="rounded-2xl bg-white border border-black/10 shadow-md px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500">Total guardado</p>
            <p className="text-xl font-bold text-gray-800">{formatBRL(totalSaved)}</p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>
              {piggyBanks.length} {piggyBanks.length === 1 ? 'porquinho' : 'porquinhos'}
            </p>
            {goalsReached > 0 && (
              <p className="font-semibold" style={{ color: '#f59e0b' }}>
                🎉 {goalsReached} {goalsReached === 1 ? 'meta atingida' : 'metas atingidas'}
              </p>
            )}
          </div>
        </div>
      )}

      {!loading && piggyBanks.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
          {piggyBanks.map((piggy) => (
            <PiggyBankCard
              key={piggy.id}
              piggy={piggy}
              onDeposit={() => openMove(piggy, 'deposit')}
              onWithdraw={() => openMove(piggy, 'withdraw')}
              onEdit={() => openEdit(piggy)}
              onDelete={() => openDelete(piggy)}
            />
          ))}
        </div>
      )}

      {/* Estado vazio: só existe a reserva de emergência */}
      {!loading && onlyEmergency && (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
          <SavingsOutlined className="text-gray-300" style={{ fontSize: 64 }} />
          <p className="text-gray-500 font-medium">Crie seu primeiro porquinho</p>
          <p className="text-gray-400 text-sm">
            Guarde dinheiro para uma viagem, um objetivo ou só para ter uma caixinha.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-2 px-5 py-2 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:cursor-pointer hover:bg-primary-600 transition-colors"
          >
            Criar porquinho
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <PiggyBankFormModal
        open={formOpen}
        piggy={editingPiggy}
        onClose={closeForm}
        onSuccess={handleFormSuccess}
      />

      <DepositWithdrawModal
        open={moveOpen}
        mode={moveMode}
        piggy={movingPiggy}
        accounts={accounts}
        onClose={closeMove}
        onSuccess={handleMoveSuccess}
      />

      <PiggyBankDeleteModal
        open={deleteOpen}
        piggy={deletingPiggy}
        accounts={accounts}
        loading={deleteLoading}
        error={deleteError}
        onClose={closeDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}