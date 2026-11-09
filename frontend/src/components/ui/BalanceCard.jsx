import { formatBRL } from '../../utils/formatCurrency';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import TrendingDownOutlined from '@mui/icons-material/TrendingDownOutlined';
import { useNavigate } from 'react-router-dom';

export function BalanceCard({
  totalBalance = 0,
  monthlyIncome = 0,
  monthlyExpense = 0
}) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-black/20 rounded-2xl p-5 text-black shadow-xl flex flex-col items-center w-full">

      {/* Cabeçalho */}
      <div className="flex items-center justify-center w-full relative mb-5">
        
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-gray-700">Saldo total</h1>
        </div>

        <button
          onClick={() => navigate('/goals')}
          className="text-primary-500 text-sm flex items-center font-semibold absolute right-0 gap-1 opacity-75 p-2 bg-primary-100/90 rounded-md
          hover:opacity-100 hover:cursor-pointer hover:bg-primary-100 hover:shadow-xs ease-in-out duration-200"
        >
          Ver metas
        </button>

      </div>

      {/* Saldo */}
      <p className="text-3xl font-bold mb-4">
        {formatBRL(totalBalance)}
      </p>

      {/* Entradas e saídas */}
      <div className="flex justify-evenly w-full gap-6">
        
        <div className="flex items-center justify-center gap-2 py-2 bg-primary-300/30 w-full rounded-lg">
          <TrendingUpOutlined
            fontSize="medium"
            className="text-green-700"
          />

          <div className="flex flex-col items-center">
            <p className="text-sm text-green-700 font-semibold">
              ENTRADAS
            </p>

            <p className="text-md text-black font-bold">
              {formatBRL(monthlyIncome)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 py-2 bg-red-300/30 w-full rounded-lg">
          <TrendingDownOutlined
            fontSize="medium"
            className="text-red-700"
          />

          <div className="flex flex-col items-center">
            <p className="text-sm text-red-700 font-semibold">
              SAÍDAS
            </p>

            <p className="text-md text-black font-bold">
              {formatBRL(monthlyExpense)}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}