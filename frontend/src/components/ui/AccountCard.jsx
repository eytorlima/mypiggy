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
    <div
      className={`bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-4
                  ${isNegative ? 'border-red-200' : 'border-gray-100'}`}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0"
        style={{ backgroundColor: bgColor }}
      >
        {iconElement}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 truncate">{name}</p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-400">
            {typeLabelMap[accountType] || accountType}
          </p>
          {isNegative && (
            <span className="text-[10px] font-bold uppercase tracking-wide text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
              Devedora
            </span>
          )}
        </div>
      </div>

      <p
        className={`font-bold text-sm flex-shrink-0 ${
          isNegative ? 'text-red-600' : 'text-primary-600'
        }`}
      >
        {formatBRL(balanceInCents)}
      </p>

      {(onEdit || onDelete) && (
        <div className="flex gap-1 flex-shrink-0">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              aria-label="Editar conta"
              className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors hover:cursor-pointer"
            >
              <EditOutlined fontSize="small" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label="Excluir conta"
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