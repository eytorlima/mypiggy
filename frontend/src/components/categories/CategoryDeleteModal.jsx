import { useId, useRef } from 'react';
import { ModalShell } from '../ui/ModalShell';
import { useModalTransition } from '../../hooks/useModalTransition';

/**
 * Props extras de contagem:
 *  - checking: true enquanto a quantidade de transações vinculadas é consultada
 *  - transactionCount: nº de transações da categoria (null = não foi possível saber)
 */
export function CategoryDeleteModal({
  open,
  category,
  loading,
  error,
  checking,
  transactionCount,
  onClose,
  onConfirm,
}) {
  const titleId = useId();
  const { mounted, visible } = useModalTransition(open, onClose);

  // Guarda a última categoria: o pai zera `category` ao fechar, e sem isso
  // o nome sumiria do texto durante a animação de saída
  const lastCategory = useRef(category);
  if (category) lastCategory.current = category;

  if (!mounted) return null;

  const hasLinked = transactionCount > 0; // null > 0 é false
  const unknownUsage = !checking && transactionCount === null;
  const isSingle = transactionCount === 1;

  return (
    <ModalShell visible={visible} onClose={onClose} size="sm" titleId={titleId}>
      <h2 id={titleId} className="text-lg font-bold text-gray-800 mb-2">
        Excluir categoria
      </h2>
      <p className="text-sm text-gray-600 break-words">
        Tem certeza que deseja excluir{' '}
        <span className="font-semibold">{lastCategory.current?.name}</span>? Essa ação não
        pode ser desfeita.
      </p>

      {/* Consultando a quantidade de transações vinculadas */}
      {checking && (
        <p role="status" className="mt-3 text-sm text-gray-500">
          Verificando transações vinculadas...
        </p>
      )}

      {/* Aviso: categoria em uso */}
      {!checking && !error && hasLinked && (
        <p className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Esta categoria possui{' '}
          <span className="font-semibold">
            {transactionCount} {isSingle ? 'transação vinculada' : 'transações vinculadas'}
          </span>
          .{' '}
          {isSingle
            ? 'Ela continuará no seu extrato, mas ficará sem categoria.'
            : 'Elas continuarão no seu extrato, mas ficarão sem categoria.'}
        </p>
      )}

      {/* Aviso genérico: não foi possível consultar a quantidade */}
      {!error && unknownUsage && (
        <p className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Não foi possível verificar as transações vinculadas. Se houver alguma, ela
          ficará sem categoria.
        </p>
      )}

      {/* Falha ao excluir (resposta da API) */}
      {error && (
        <p
          role="alert"
          className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
        >
          {error}
        </p>
      )}

      <div className="flex gap-3 mt-5">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold
                     hover:bg-gray-50 disabled:opacity-50 transition-colors hover:cursor-pointer"
        >
          {error ? 'Fechar' : 'Cancelar'}
        </button>

        {!error && (
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || checking}
            className="flex-1 py-2.5 rounded-lg bg-red-500 text-white font-semibold
                       hover:bg-red-600 disabled:opacity-50 transition-colors hover:cursor-pointer"
          >
            {loading ? 'Excluindo...' : hasLinked ? 'Excluir mesmo assim' : 'Excluir'}
          </button>
        )}
      </div>
    </ModalShell>
  );
}