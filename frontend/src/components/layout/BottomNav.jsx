import { useNavigate, useLocation } from 'react-router-dom';
import HomeOutlined from '@mui/icons-material/HomeOutlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AddIcon from '@mui/icons-material/Add';
import BarChart from '@mui/icons-material/BarChart';
import CurrencyBitcoinIcon from '@mui/icons-material/CurrencyBitcoin';

const navItems = [
    { label: 'Início',        icon: <HomeOutlined />,     path: '/dashboard'      },
    { label: 'Transações',  icon: <ReceiptLongIcon />,  path: '/transactions'   },
    { label: 'FAB',         icon: null,                 path: null              },
    { label: 'Relatórios',      icon: <BarChart />,     path: '/reports'          },
    { label: 'Ações',       icon: <CurrencyBitcoinIcon />,     path: '/stocks'        }
];

export function BottomNav({ onFabClick }){
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <nav
            aria-label="Navegação principal"
            className="fixed bottom-0 left-0 right-0 bg-gray-900 z-40 border-t border-gray-200 shadow-lg pb-[env(safe-area-inset-bottom)]"
        >

        <div className="flex items-center justify-between px-2 sm:px-4 py-1 bg-gray-900 gap-1 sm:gap-4">
        {navItems.map((item) => {

        // FAB central
       if (item.label === 'FAB') {
            return (
                <div key="fab" className="w-16 sm:w-20 shrink-0" aria-hidden="true">
                <button
                    type="button"
                    onClick={onFabClick}
                    aria-label="Nova transação"
                    aria-hidden="false"
                    className="
                    absolute left-1/2 -translate-x-1/2 -translate-y-12
                    w-18 h-18 rounded-full
                    bg-primary-500 text-white shadow-xl border-2
                    flex items-center justify-center
                    hover:bg-primary-600 hover:cursor-pointer ease-in-out duration-300
                    active:scale-95
                    "
                >
                    <AddIcon fontSize="large" />
                </button>
                </div>
            );
        }

        const isActive = location.pathname === item.path;

        return (
            <button
            type="button"
            key={item.path}
            onClick={() => navigate(item.path)}
            aria-current={isActive ? 'page' : undefined}
            className={`group rounded-md flex-1 flex flex-col items-center gap-0.5 px-3 py-1 font-semibold hover:cursor-pointer hover:text-gray-100 ease-in-out duration-300
                  ${isActive ? 'bg-black' : ''}`}
            >
            <span className={`${isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-100 ease-in-out duration-200'}`}>
                {item.icon}
            </span>
            <span className={`text-[11px] sm:text-sm ${isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-100 ease-in-out duration-200 '}`}>
                {item.label}
            </span>
            </button>
        );
        })}
    </div>
    </nav>
  );
}