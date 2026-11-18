import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import { formatBRL } from '../../utils/formatCurrency';
import CelebrationOutlined from '@mui/icons-material/CelebrationOutlined';
import {
  REACHED_BG,
  REACHED_BORDER,
  REACHED_TEXT,
  colorOf,
  daysUntil,
  formatDateBR,
  formatRate,
  getPiggyIcon,
} from '../../utils/piggyBankUtils';

// color: fundo (com transparência); textColor: tom escuro da mesma cor, para o contraste
function Badge({ children, color, textColor }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ color: textColor || color, backgroundColor: `${color}22` }}
    >
      {children}
    </span>
  );
}

// Texto do prazo da meta
function deadlineText(piggy) {
  if (!piggy.targetDate) return '';
  const days = daysUntil(piggy.targetDate);
  if (days < 0) return `Prazo vencido em ${formatDateBR(piggy.targetDate)}`;
  if (days === 0) return 'Prazo: hoje';
  return `Até ${formatDateBR(piggy.targetDate)} · ${days === 1 ? 'falta 1 dia' : `faltam ${days} dias`}`;
}

export function PiggyBankCard({ piggy, onDeposit, onWithdraw, onEdit, onDelete }) {
  const hasGoal = piggy.goalInCents != null;
  const reached = !!piggy.goalReached;
  const accent = colorOf(piggy);
  const percent = Math.min(100, piggy.progressPercent ?? 0);
  const remaining = hasGoal ? Math.max(0, piggy.goalInCents - piggy.totalInCents) : 0;
  const overdue = hasGoal && !reached && piggy.targetDate && daysUntil(piggy.targetDate) < 0;

  return (
    <div
      className="rounded-2xl border border-black/10 bg-white p-4 shadow-md flex flex-col gap-3
                 transition-shadow hover:shadow-lg"
      style={reached ? { borderColor: REACHED_BORDER, backgroundColor: REACHED_BG } : undefined}
    >
      {/* Cabeçalho */}
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="w-11 h-11 rounded-full flex items-center justify-center text-white flex-shrink-0"
          style={{ backgroundColor: accent }}
        >
          {getPiggyIcon(piggy.icon)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold text-gray-800 truncate max-w-full" title={piggy.name}>
              {piggy.name}
            </h2>
            {piggy.isEmergency && <Badge color="#3b82f6" textColor="#1d4ed8">Emergência</Badge>}
            {reached && (
              <Badge color={accent} textColor={REACHED_TEXT}>
                <CelebrationOutlined style={{ fontSize: 14 }} aria-hidden="true" />
                Meta atingida
              </Badge>
            )}
          </div>
          {piggy.description && (
            <p className="text-xs text-gray-500 truncate">{piggy.description}</p>
          )}
        </div>

        <div className="flex gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Editar porquinho ${piggy.name}`}
            className="p-2 sm:p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100
                       transition-colors hover:cursor-pointer"
          >
            <EditOutlined fontSize="small" />
          </button>
          {/* A reserva de emergência nunca pode ser excluída */}
          {!piggy.isEmergency && (
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Excluir porquinho ${piggy.name}`}
              className="p-2 sm:p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50
                         transition-colors hover:cursor-pointer"
            >
              <DeleteOutlineOutlined fontSize="small" />
            </button>
          )}
        </div>
      </div>

      {/* Valores */}
      <div>
        <p className="text-xl sm:text-2xl font-bold text-gray-800 break-words">{formatBRL(piggy.totalInCents)}</p>
        <p className="text-xs text-gray-500">
          Guardado {formatBRL(piggy.balanceInCents)}
          {piggy.estimatedYieldInCents > 0 && (
            <>
              {' '}· rendimento estimado{' '}
              <span className="text-green-700 font-medium">
                +{formatBRL(piggy.estimatedYieldInCents)}
              </span>
            </>
          )}
          {piggy.annualRate > 0 && <> · {formatRate(piggy.annualRate)} a.a.</>}
        </p>
      </div>

      {/* Meta: barra de progresso */}
      {hasGoal && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-gray-500">
              Meta <span className="font-semibold text-gray-700">{formatBRL(piggy.goalInCents)}</span>
            </span>
            <span className="font-semibold text-gray-700">
              {(piggy.progressPercent ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
            </span>
          </div>

          <div
            className="h-2.5 w-full rounded-full bg-gray-200 overflow-hidden"
            role="progressbar"
            aria-label={`Progresso de ${piggy.name}`}
            aria-valuenow={Math.round(percent)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${percent}%`, backgroundColor: accent }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-2 text-xs text-gray-500">
            <span className={overdue ? 'text-red-600 font-medium' : ''}>{deadlineText(piggy)}</span>
            {!reached && <span className="whitespace-nowrap">Faltam {formatBRL(remaining)}</span>}
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-2 mt-1">
        <button
          type="button"
          onClick={onDeposit}
          className="flex-1 py-2.5 sm:py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold
                     hover:bg-primary-600 active:scale-95 transition hover:cursor-pointer"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onWithdraw}
          disabled={piggy.balanceInCents <= 0}
          className="flex-1 py-2.5 sm:py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold
                     hover:bg-gray-100 active:scale-95 transition hover:cursor-pointer
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          Retirar
        </button>
      </div>
    </div>
  );
}