import { useNavigate } from 'react-router-dom';
import SavingsOutlined from '@mui/icons-material/SavingsOutlined';
import { formatBRL } from '../../utils/formatCurrency';
import { GOLD, colorOf, getPiggyIcon } from '../../utils/piggyBankUtils';

const MAX_ITEMS = 4;

// Versão compacta do card, para o Dashboard
function PiggyBankMiniCard({ piggy }) {
  const hasGoal = piggy.goalInCents != null;
  const reached = !!piggy.goalReached;
  const accent = reached ? GOLD : colorOf(piggy);
  const percent = Math.min(100, piggy.progressPercent ?? 0);

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl border border-black/10 bg-white w-full"
      style={reached ? { borderColor: GOLD, backgroundColor: '#fffbeb' } : undefined}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
        style={{ backgroundColor: accent }}
      >
        {getPiggyIcon(piggy.icon)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-gray-800 text-sm truncate">
            {piggy.name}{reached && ' 🎉'}
          </p>
          <p className="font-bold text-gray-800 text-sm whitespace-nowrap">
            {formatBRL(piggy.totalInCents)}
          </p>
        </div>

        {hasGoal ? (
          <>
            <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden mt-1.5">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${percent}%`, backgroundColor: accent }}
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              {(piggy.progressPercent ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% de{' '}
              {formatBRL(piggy.goalInCents)}
            </p>
          </>
        ) : (
          <p className="text-[11px] text-gray-500 mt-0.5">Sem meta</p>
        )}
      </div>
    </div>
  );
}

export function PiggyBanksSection({ piggyBanks }) {
  const navigate = useNavigate();
  const visible = piggyBanks.slice(0, MAX_ITEMS);
  const hidden = piggyBanks.length - visible.length;

  return (
    <div className="bg-white border border-black/20 rounded-2xl p-5 text-black shadow-xl flex flex-col items-center w-full">
      <div className="flex items-center justify-center w-full relative mb-5">
        <h2 className="font-bold text-gray-700">Meus porquinhos</h2>
        <button
          onClick={() => navigate('/goals')}
          className="text-primary-500 text-sm flex items-center font-semibold absolute right-0 gap-1 opacity-75 p-2 bg-primary-100/90 rounded-md
          hover:opacity-100 hover:cursor-pointer hover:bg-primary-100 hover:shadow-xs ease-in-out duration-200"
        >
          Gerenciar
        </button>
      </div>

      {piggyBanks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
          <SavingsOutlined className="text-gray-300" style={{ fontSize: 56 }} />
          <p className="text-gray-500 font-medium">Nenhum porquinho ainda</p>
          <p className="text-gray-400 text-sm">Crie metas e guarde dinheiro aos poucos.</p>
          <button
            onClick={() => navigate('/goals')}
            className="mt-2 px-5 py-2 bg-primary-500 text-white text-sm font-semibold rounded-lg
            hover:bg-primary-600 transition-colors hover:cursor-pointer duration-200 ease-in-out"
          >
            Criar porquinho
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 w-full">
          {visible.map((piggy) => (
            <PiggyBankMiniCard key={piggy.id} piggy={piggy} />
          ))}
          {hidden > 0 && (
            <button
              onClick={() => navigate('/goals')}
              className="text-sm text-primary-500 font-semibold hover:underline hover:cursor-pointer"
            >
              Ver mais {hidden} {hidden === 1 ? 'porquinho' : 'porquinhos'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}