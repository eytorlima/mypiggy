import { categoryIconMap, resolveCategoryColor } from '../../utils/categoryUtils';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';

export function CategoryItem({ category, onEdit, onDelete }) {
  const { name, color, icon, isDefault } = category;

  const bgColor = resolveCategoryColor(color);
  const iconElement = categoryIconMap[icon] || categoryIconMap.other;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0"
        style={{ backgroundColor: bgColor }}
      >
        {iconElement}
      </div>

      <p className="flex-1 min-w-0 font-semibold text-gray-800 truncate">{name}</p>

      {/* Padrão: somente leitura, sem botões de editar/excluir */}
      {isDefault ? (
        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
          Padrão
        </span>
      ) : (
        <div className="flex gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onEdit}
            aria-label="Editar categoria"
            className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors hover:cursor-pointer"
          >
            <EditOutlined fontSize="small" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Excluir categoria"
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors hover:cursor-pointer"
          >
            <DeleteOutlineOutlined fontSize="small" />
          </button>
        </div>
      )}
    </div>
  );
}
