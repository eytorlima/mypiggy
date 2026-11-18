import { formatBRL } from '../../utils/formatCurrency';
import { colorMap } from '../../utils/accountUtils';
import { categoryIconMap } from '../../utils/categoryUtils';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import RepeatOutlined from '@mui/icons-material/RepeatOutlined';
import StopCircleOutlined from '@mui/icons-material/StopCircleOutlined';
import SavingsOutlined from '@mui/icons-material/SavingsOutlined';

// amountInCents vem SEMPRE positivo do back-end: o sinal depende do tipo
const typeStyle = {
  CREDIT:   { sign: '+', className: 'text-primary-700' },
  DEBIT:    { sign: '-', className: 'text-red-600' },
  TRANSFER: { sign: '',  className: 'text-gray-500' },
  PIGGY_DEPOSIT:    { sign: '', className: 'text-gray-500' },
  PIGGY_WITHDRAWAL: { sign: '', className: 'text-gray-500' },
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
    const isPiggy = transactionType === 'PIGGY_DEPOSIT' || transactionType === 'PIGGY_WITHDRAWAL';
  const style = typeStyle[transactionType] || typeStyle.TRANSFER;

  // Qualquer transação de uma série (original ou gerada) tem recurrenceSeriesId
  const inSeries = Boolean(recurrenceSeriesId);
  const seriesActive = inSeries && recurrenceActive !== false;
  const seriesEnded = inSeries && recurrenceActive === false;

    // Movimentações de porquinho: fundo neutro (cinza) e ícone de porquinho
  const bgColor = isPiggy ? colorMap.gray : colorMap[categoryColor] || colorMap.gray;
  const iconElement = isPiggy
    ? <SavingsOutlined />
    : categoryIconMap[categoryIcon] ||
      (isTransfer ? categoryIconMap.transfer : categoryIconMap.other);

  const title =
    description || categoryName || (isTransfer ? 'Transferência' : 'Transação');

   // Guardar: o dinheiro sai da conta (origem). Retirar: volta para a conta (destino).
  const subtitle = isPiggy
    ? `${transactionType === 'PIGGY_DEPOSIT' ? 'Origem' : 'Destino'}: ${accountName}`
    : isTransfer
      ? `${accountName} → ${destinationAccountName ?? '—'}`
      : [categoryName, accountName].filter(Boolean).join(' · ');

  const hasActions = !isPiggy && (onEdit || onDelete || (onEndRecurrence && seriesActive));

  return (
    // No celular as ações descem para uma linha própria; do sm em diante ficam ao lado
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap sm:flex-nowrap items-center gap-x-3 sm:gap-x-4 gap-y-2">
      <div
        aria-hidden="true"
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white flex-shrink-0"
        style={{ backgroundColor: bgColor }}
      >
        {iconElement}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 truncate">{title}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
          <p className="text-xs text-gray-500 truncate max-w-full">{subtitle}</p>

          {seriesActive && (
            <span className="flex items-center gap-0.5 text-[11px] font-bold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded flex-shrink-0">
              <RepeatOutlined style={{ fontSize: 12 }} aria-hidden="true" />
              {recurrenceLabel[recurrencyType] || 'Recorrente'}
            </span>
          )}

          {seriesEnded && (
            <span className="flex items-center gap-0.5 text-[11px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
              <StopCircleOutlined style={{ fontSize: 12 }} aria-hidden="true" />
              Recorrência encerrada
            </span>
          )}
        </div>
      </div>

      <p className={`font-bold text-sm flex-shrink-0 whitespace-nowrap ${style.className}`}>
        {style.sign}
        {formatBRL(amountInCents)}
      </p>

      {hasActions && (
        <div className="flex gap-1 flex-shrink-0 w-full justify-end sm:w-auto">
          {onEndRecurrence && seriesActive && (
            <button
              type="button"
              onClick={onEndRecurrence}
              className="flex items-center gap-1 px-2.5 py-2 sm:py-1.5 text-xs font-semibold text-amber-700 bg-amber-50
                         border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors hover:cursor-pointer"
            >
              <StopCircleOutlined style={{ fontSize: 16 }} aria-hidden="true" />
              Encerrar recorrência
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Editar transação ${title}`}
              className="p-2 sm:p-1.5 text-gray-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors hover:cursor-pointer"
            >
              <EditOutlined fontSize="small" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Excluir transação ${title}`}
              className="p-2 sm:p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors hover:cursor-pointer"
            >
              <DeleteOutlineOutlined fontSize="small" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}