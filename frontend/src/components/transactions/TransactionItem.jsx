import { formatBRL } from '../../utils/formatCurrency';
import { colorMap } from '../../utils/accountUtils';
import { categoryIconMap } from '../../utils/categoryUtils';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import RepeatOutlined from '@mui/icons-material/RepeatOutlined';
import StopCircleOutlined from '@mui/icons-material/StopCircleOutlined';

// amountInCents vem SEMPRE positivo do back-end: o sinal depende do tipo
const typeStyle = {
  CREDIT:   { sign: '+', className: 'text-primary-600' },
  DEBIT:    { sign: '-', className: 'text-red-600' },
  TRANSFER: { sign: '',  className: 'text-gray-500' },
};

const recurrenceLabel = {
  DAILY: 'Diária',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
  ANNUAL: 'Anual',
};

export function TransactionItem({ transaction, onEdit, onDelete, onEndRecurrence }) {
  const {
    description,
    categoryName,
    categoryColor,
    categoryIcon,
    accountName,
    destinationAccountName,
    amountInCents = 0,
    transactionType,
    recurrencyType,
    recurrenceSeriesId,
    recurrenceActive,
  } = transaction;

  const isTransfer = transactionType === 'TRANSFER';
  const style = typeStyle[transactionType] || typeStyle.TRANSFER;

  // Qualquer transação de uma série (original ou gerada) tem recurrenceSeriesId
  const inSeries = Boolean(recurrenceSeriesId);
  const seriesActive = inSeries && recurrenceActive !== false;
  const seriesEnded = inSeries && recurrenceActive === false;

  const bgColor = colorMap[categoryColor] || colorMap.gray;
  const iconElement =
    categoryIconMap[categoryIcon] ||
    (isTransfer ? categoryIconMap.transfer : categoryIconMap.other);

  const title =
    description || categoryName || (isTransfer ? 'Transferência' : 'Transação');

  const subtitle = isTransfer
    ? `${accountName} → ${destinationAccountName ?? '—'}`
    : [categoryName, accountName].filter(Boolean).join(' · ');

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0"
        style={{ backgroundColor: bgColor }}
      >
        {iconElement}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 truncate">{title}</p>
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-xs text-gray-400 truncate">{subtitle}</p>

          {seriesActive && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded flex-shrink-0">
              <RepeatOutlined style={{ fontSize: 12 }} />
              {recurrenceLabel[recurrencyType] || 'Recorrente'}
            </span>
          )}

          {seriesEnded && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
              <StopCircleOutlined style={{ fontSize: 12 }} />
              Recorrência encerrada
            </span>
          )}
        </div>
      </div>

      <p className={`font-bold text-sm flex-shrink-0 ${style.className}`}>
        {style.sign}
        {formatBRL(amountInCents)}
      </p>

      {(onEdit || onDelete || (onEndRecurrence && seriesActive)) && (
        <div className="flex gap-1 flex-shrink-0">
          {onEndRecurrence && seriesActive && (
            <button
              type="button"
              onClick={onEndRecurrence}
              title="Encerrar recorrência"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50
                         border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors hover:cursor-pointer"
            >
              <StopCircleOutlined style={{ fontSize: 16 }} />
              <span className="hidden sm:inline">Encerrar recorrência</span>
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              aria-label="Editar transação"
              className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors hover:cursor-pointer"
            >
              <EditOutlined fontSize="small" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label="Excluir transação"
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors hover:cursor-pointer"
            >
              <DeleteOutlineOutlined fontSize="small" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}