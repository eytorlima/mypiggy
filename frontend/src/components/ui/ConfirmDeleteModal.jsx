import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';

export function ConfirmDeleteModal({ open, accountName, loading, onClose, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
         onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-2xl p-6"
           onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-red-500">
            <WarningAmberOutlined />
            <h2 className="font-bold text-gray-800">Excluir conta</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:cursor-pointer">
            <CloseOutlined fontSize="small" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-1">
          Tem certeza que deseja excluir a conta <strong>{accountName}</strong>?
        </p>
        <p className="text-xs text-gray-400 mb-6">
          Esta ação não pode ser desfeita. As transações associadas também serão excluídas.
        </p>

        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 hover:cursor-pointer transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 hover:cursor-pointer disabled:opacity-50 transition-colors">
            {loading ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  );
}