import { formatBRL } from '../../utils/formatCurrency';
import AccountBalanceOutlined from '@mui/icons-material/AccountBalanceOutlined';
import AccountBalanceWalletOutlined from '@mui/icons-material/AccountBalanceWalletOutlined';
import SavingsOutlined from '@mui/icons-material/SavingsOutlined';

const iconMap = {
  BANK_ACCOUNT: <AccountBalanceOutlined />,
  CHECKING_ACCOUNT: <AccountBalanceOutlined />,
  SAVINGS_ACCOUNT: <SavingsOutlined />,
  WALLET: <AccountBalanceWalletOutlined />,
};

export function AccountCard({ account }) {
  const { name, balance_in_cents, account_type, color } = account;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">

      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0"
        style={{ backgroundColor: color || '#22c55e' }}
      >
        {iconMap[account_type] || <AccountBalanceWalletOutlined />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 truncate">{name}</p>
        <p className="text-xs text-gray-400 capitalize">
          {account_type?.replace('_', ' ').toLowerCase()}
        </p>
      </div>

      <p className={`font-bold text-sm flex-shrink-0 ${balance_in_cents >= 0 ? 'text-primary-600' : 'text-red-500'}`}>
        {formatBRL(balance_in_cents)}
      </p>
    </div>
  );
}