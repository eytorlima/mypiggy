import { AccountCard } from './AccountCard';
import { SkeletonCard } from './SkeletonCard';
import AddOutlined from '@mui/icons-material/AddOutlined';
import SavingsOutlined from '@mui/icons-material/SavingsOutlined';

export function AccountsSection({ accounts}) {
  return (
    <div className="bg-white border border-black/20 rounded-2xl p-5 text-black shadow-xl flex flex-col items-center w-full">
      <div className="flex items-center justify-center w-full relative mb-5">
        <h2 className="font-bold text-gray-700">Minhas contas</h2>
        <button className="text-primary-500 text-sm flex items-center font-semibold absolute right-0 gap-1 opacity-75 p-2 bg-primary-100/90 rounded-md
        hover:opacity-100 hover:cursor-pointer hover:bg-primary-100 hover:shadow-xs ease-in-out duration-200">
          <AddOutlined fontSize="small" />
          Adicionar
        </button>
      </div>

      {(accounts.length === 0) ?
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
          <SavingsOutlined className="text-gray-300" style={{ fontSize: 56 }} />
          <p className="text-gray-500 font-medium">Nenhuma conta cadastrada</p>
          <p className="text-gray-400 text-sm ">Adicione sua primeira conta para começar.</p>
          <button className="mt-2 px-5 py-2 bg-primary-500 text-white text-sm font-semibold rounded-lg 
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