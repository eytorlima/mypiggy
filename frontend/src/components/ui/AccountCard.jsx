import { formatBRL } from '../../utils/formatCurrency';
import { colorMap, accountIconMap } from '../../utils/accountUtils';
import AccountBalanceOutlined from '@mui/icons-material/AccountBalanceOutlined';
import AccountBalanceWalletOutlined from '@mui/icons-material/AccountBalanceWalletOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';

const typeIconMap = {
  BANK_ACCOUNT: <AccountBalanceOutlined />,
  WALLET: <AccountBalanceWalletOutlined />,
};

const typeLabelMap = {
  BANK_ACCOUNT: 'Conta Bancária',
  WALLET: 'Carteira',
};

export function AccountCard({ account, onEdit, onDelete }) {
  const { name, balanceInCents = 0, accountType, color, icon } = account;
  const isNegative = balanceInCents < 0;

  // color/icon guardam a chave escolhida no modal; se vier um hex, usa direto
  const bgColor = colorMap[color] || color || colorMap.green || '#22c55e';
  const iconElement =
    accountIconMap[icon] || typeIconMap[accountType] || <AccountBalanceWalletOutlined />;

  return (
    // No celular as ações descem para uma linha própria; do sm em diante ficam ao lado
    <div
      className={`bg-white rounded-2xl p-4 shadow-sm border flex flex-wrap sm:flex-nowrap items-center gap-x-3 sm:gap-x-4 gap-y-2
                  ${isNegative ? 'border-red-200' : 'border-gray-100'}`}
    >
      <div
        aria-hidden="true"
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white flex-shrink-0"
        style={{ backgroundColor: bgColor }}
      >
        {iconElement}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 truncate">{name}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p className="text-xs text-gray-500">
            {typeLabelMap[accountType] || accountType}
          </p>
          {isNegative && (
            <span className="text-[11px] font-bold uppercase tracking-wide text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
              Devedora
            </span>
          )}
        </div>
      </div>

      <p
        className={`font-bold text-sm flex-shrink-0 whitespace-nowrap ${
          isNegative ? 'text-red-600' : 'text-primary-700'
        }`}
      >
        {formatBRL(balanceInCents)}
      </p>

      {(onEdit || onDelete) && (
        <div className="flex gap-1 flex-shrink-0 w-full justify-end sm:w-auto">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Editar conta ${name}`}
              className="p-2 sm:p-1.5 text-gray-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors hover:cursor-pointer"
            >
              <EditOutlined fontSize="small" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Excluir conta ${name}`}
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