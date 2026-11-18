import { formatBRL } from '../../utils/formatCurrency';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import TrendingDownOutlined from '@mui/icons-material/TrendingDownOutlined';

export function BalanceCard({
  totalBalance = 0,
  monthlyIncome = 0,
  monthlyExpense = 0
}) {
  return (
    <div className="bg-white border border-black/20 rounded-2xl p-4 sm:p-5 text-black shadow-xl flex flex-col items-center w-full">

      {/* Cabeçalho */}
      <div className="flex items-center justify-center w-full relative mb-5">

        <div className="flex items-center gap-2">
          <h2 className="font-bold text-gray-700">Saldo total</h2>
        </div>

      </div>

      {/* Saldo */}
      <p className="text-2xl sm:text-3xl font-bold mb-4 break-words max-w-full text-center">
        {formatBRL(totalBalance)}
      </p>

      {/* Entradas e saídas */}
      <div className="flex justify-evenly w-full gap-3 sm:gap-6">

        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1 bg-primary-300/30 w-full min-w-0 rounded-lg">
          <TrendingUpOutlined
            fontSize="medium"
            aria-hidden="true"
            className="text-green-700"
          />

          <div className="flex flex-col items-center min-w-0">
            <p className="text-xs sm:text-sm text-green-800 font-semibold">
              ENTRADAS
            </p>

            <p className="text-sm sm:text-base text-black font-bold break-words max-w-full text-center">
              {formatBRL(monthlyIncome)}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1 bg-red-300/30 w-full min-w-0 rounded-lg">
          <TrendingDownOutlined
            fontSize="medium"
            aria-hidden="true"
            className="text-red-700"
          />

          <div className="flex flex-col items-center min-w-0">
            <p className="text-xs sm:text-sm text-red-800 font-semibold">
              SAÍDAS
            </p>

            <p className="text-sm sm:text-base text-black font-bold break-words max-w-full text-center">
              {formatBRL(monthlyExpense)}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}