import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories, deleteCategory } from '../../services/categoryService';
import { getTransactions } from '../../services/transactionService';
import { CategoryItem } from '../../components/categories/CategoryItem';
import { CategoryFormModal } from '../../components/categories/CategoryFormModal';
import { CategoryDeleteModal } from '../../components/categories/CategoryDeleteModal';
import { SkeletonCard } from '../../components/ui/SkeletonCard';
import AddOutlined from '@mui/icons-material/AddOutlined';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import CategoryOutlined from '@mui/icons-material/CategoryOutlined';

export function CategoriesPage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal de formulário
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Modal de exclusão
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [linkedCount, setLinkedCount] = useState(null); // transações da categoria (null = desconhecido)
  const [checkingUsage, setCheckingUsage] = useState(false);
  const usageRequestRef = useRef(0); // descarta respostas de consultas antigas

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      setError('');
      setCategories((await getCategories()) || []);
    } catch {
      setError('Não foi possível carregar as categorias.');
    } finally {
      setLoading(false);
    }
  }

  /* Separação: personalizadas (editáveis) x padrão (somente leitura).
     A categoria de transferência é de sistema e fica oculta. */
  const { custom, defaults } = useMemo(() => {
    const byName = (a, b) => a.name.localeCompare(b.name, 'pt-BR');
    return {
      custom: categories.filter((c) => !c.isDefault).sort(byName),
      defaults: categories
        .filter((c) => c.isDefault && c.icon !== 'transfer')
        .sort(byName),
    };
  }, [categories]);

  /* Formulário */
  function handleOpenCreate() {
    setEditingCategory(null);
    setFormOpen(true);
  }

  function handleOpenEdit(category) {
    setEditingCategory(category);
    setFormOpen(true);
  }

  function handleCloseForm() {
    setFormOpen(false);
    setEditingCategory(null);
  }

  function handleFormSuccess(saved, isEdit) {
    if (!saved || saved.id == null) {
      loadCategories();
    } else if (isEdit) {
      setCategories((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
    } else {
      setCategories((prev) => [...prev, saved]);
    }
    handleCloseForm();
  }

  /* Exclusão */
  async function handleOpenDelete(category) {
    const requestId = ++usageRequestRef.current; // invalida consultas anteriores
    setDeletingCategory(category);
    setDeleteError('');
    setLinkedCount(null);
    setCheckingUsage(true);
    setDeleteOpen(true);

    try {
      // O back-end já filtra por categoria: basta contar o que voltar
      const linked = await getTransactions({ categoryId: category.id });
      if (requestId === usageRequestRef.current) setLinkedCount((linked || []).length);
    } catch {
      // Sem a contagem, o modal mostra um aviso genérico (linkedCount continua null)
    } finally {
      if (requestId === usageRequestRef.current) setCheckingUsage(false);
    }
  }

  function handleCloseDelete() {
    usageRequestRef.current++; // uma consulta ainda em andamento deixa de valer
    setDeleteOpen(false);
    setDeletingCategory(null);
    setDeleteError('');
    setLinkedCount(null);
    setCheckingUsage(false);
  }

  async function handleConfirmDelete() {
    if (!deletingCategory) return;
    try {
      setDeleteLoading(true);
      setDeleteError('');
      await deleteCategory(deletingCategory.id);
      setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
      handleCloseDelete();
    } catch (err) {
      // Mantém o modal aberto para o usuário ler o motivo (ex: transações vinculadas)
      setDeleteError(
        err.response?.data?.message || 'Não foi possível excluir a categoria.'
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-center w-full relative mt-5">
        <button
          type="button"
          // Rota fixa em vez de navigate(-1): funciona mesmo se a página for aberta direto pela URL
          onClick={() => navigate('/settings')}
          aria-label="Voltar"
          className="absolute left-0 p-2 text-gray-500 hover:text-gray-700 hover:cursor-pointer"
        >
          <ArrowBackOutlined fontSize="small" />
        </button>

        <h2 className="font-bold text-gray-700">Categorias</h2>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="text-primary-500 text-sm flex items-center font-semibold absolute right-0 gap-1 opacity-75 p-2 bg-primary-100/90 rounded-md
          hover:opacity-100 hover:cursor-pointer hover:bg-primary-100 hover:shadow-xs ease-in-out duration-200"
        >
          <AddOutlined fontSize="small" />
          Nova
        </button>
      </div>

      {loading && (
        <div className="flex flex-col gap-3">
          <SkeletonCard height="h-20" />
          <SkeletonCard height="h-20" />
          <SkeletonCard height="h-20" />
        </div>
      )}

      {!loading && (
        <>
          {/* Minhas categorias */}
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-gray-500 px-1">Minhas categorias</h3>

            {custom.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <CategoryOutlined className="text-gray-300" style={{ fontSize: 56 }} />
                <p className="text-gray-500 font-medium">Nenhuma categoria personalizada</p>
                <p className="text-gray-400 text-sm">
                  Crie categorias com o ícone e a cor que quiser.
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="mt-1 px-5 py-2 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:cursor-pointer hover:bg-primary-600 transition-colors"
                >
                  Criar categoria
                </button>
              </div>
            ) : (
              custom.map((c) => (
                <CategoryItem
                  key={c.id}
                  category={c}
                  onEdit={() => handleOpenEdit(c)}
                  onDelete={() => handleOpenDelete(c)}
                />
              ))
            )}
          </section>

          {/* Padrão (somente leitura: sem onEdit/onDelete) */}
          {defaults.length > 0 && (
            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-gray-500 px-1">Padrão</h3>
              {defaults.map((c) => (
                <CategoryItem key={c.id} category={c} />
              ))}
            </section>
          )}
        </>
      )}

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <CategoryFormModal
        open={formOpen}
        category={editingCategory}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
      />

      <CategoryDeleteModal
        open={deleteOpen}
        category={deletingCategory}
        loading={deleteLoading}
        error={deleteError}
        checking={checkingUsage}
        transactionCount={linkedCount}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
