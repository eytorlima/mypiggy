import { AccountCard } from './AccountCard';
import { SkeletonCard } from './SkeletonCard';
import { useNavigate } from 'react-router-dom';
import AddOutlined from '@mui/icons-material/AddOutlined';
import SavingsOutlined from '@mui/icons-material/SavingsOutlined';

export function AccountsSection({ accounts}) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-black/20 rounded-2xl p-5 text-black shadow-xl flex flex-col items-center w-full">
      <div className="flex items-center justify-center w-full relative mb-5">
        <h2 className="font-bold text-gray-700">Minhas contas</h2>
        <button onClick={() => navigate('/accounts')} 
        className="text-primary-500 text-sm flex items-center font-semibold absolute right-0 gap-1 opacity-75 p-2 bg-primary-100/90 rounded-md
        hover:opacity-100 hover:cursor-pointer hover:bg-primary-100 hover:shadow-xs ease-in-out duration-200">
          {(accounts.length === 0) ? "Adicionar Contas" : "Gerenciar Contas"}
        </button>
      </div>

      {(accounts.length === 0) ?
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
          <SavingsOutlined className="text-gray-300" style={{ fontSize: 56 }} />
          <p className="text-gray-500 font-medium">Nenhuma conta cadastrada</p>
          <p className="text-gray-400 text-sm ">Adicione sua primeira conta para começar.</p>
          <button onClick={() => navigate('/accounts')} 
          className="mt-2 px-5 py-2 bg-primary-500 text-white text-sm font-semibold rounded-lg 
          hover:bg-primary-600 transition-colors hover:cursor-pointer duration-200 ease-in-out">
            Adicionar conta
          </button>
        </div>

        :

        <div className="flex flex-col gap-3 w-full">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      }
    </div>
  );
}