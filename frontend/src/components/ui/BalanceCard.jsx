import { formatBRL } from '../../utils/formatCurrency';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import TrendingDownOutlined from '@mui/icons-material/TrendingDownOutlined';
import AccountBalanceWalletOutlined from '@mui/icons-material/AccountBalanceWalletOutlined';

export function BalanceCard({ totalBalance = 0, monthlyIncome = 0, monthlyExpense = 0 }) {
  return (

    <div className="bg-white border border-black/20 rounded-2xl p-5 text-black shadow-xl flex flex-col items-center w-full">
      {/* Saldo total */}
      <div className="flex items-center gap-2 mb-1 w-auto">
        <AccountBalanceWalletOutlined fontSize="small" className="opacity-80" />
        <span className="text-sm">Saldo total</span>
      </div>
      <p className="text-3xl font-bold mb-4">{formatBRL(totalBalance)}</p>

      <div className="flex justify-evenly w-full gap-6">
        <div className="flex items-center justify-center gap-2 py-2 bg-primary-300/30 w-full rounded-lg">
          <TrendingUpOutlined fontSize="medium" className="text-green-700" />
          <div className="flex flex-col items-center">
            <p className="text-sm text-green-700 font-semibold">ENTRADAS</p>
            <p className="text-md text-black font-bold">{formatBRL(monthlyIncome)}</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 py-2 bg-red-300/30 w-full rounded-lg">
          <TrendingDownOutlined fontSize="medium" className="text-red-700" />
          <div className="flex flex-col items-center">
            <p className="text-sm text-red-700 font-semibold">SAÍDAS</p>
            <p className="text-md text-black font-bold">{formatBRL(monthlyExpense)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}