import { useNavigate, useLocation } from 'react-router-dom';
import HomeOutlined from '@mui/icons-material/HomeOutlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AddIcon from '@mui/icons-material/Add';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import CurrencyBitcoinIcon from '@mui/icons-material/CurrencyBitcoin';

const navItems = [
    { label: 'Home',        icon: <HomeOutlined />,     path: '/dashboard'      },
    { label: 'Transações',  icon: <ReceiptLongIcon />,  path: '/transactions'   },
    { label: 'FAB',         icon: null,                 path: null              },
    { label: 'Metas',      icon: <EmojiEventsOutlinedIcon />,     path: '/goals'          },
    { label: 'Ações',       icon: <CurrencyBitcoinIcon />,     path: '/actions'        }
];

export function BottomNav({ onFabClick }){
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-transparent z-40 border-t border-gray-200 shadow-lg">
         <div className="flex items-center justify-around px-2 py-1 bg-gray-900 ">
        {navItems.map((item) => {

        // FAB central
        if (item.label === 'FAB') {
            return (
            <button
                key="fab"
                onClick={onFabClick}
                className="
                flex items-center justify-center
                w-18 h-18 rounded-full
                bg-primary-500 text-white shadow-xl border-2
                hover:bg-primary-600 ease-in-out duration-300
                -translate-y-6 hover:cursor-pointer
                "
            >
                <AddIcon fontSize="large" />
            </button>
            );
        }

        const isActive = location.pathname === item.path;

        return (
            <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`group rounded-md flex flex-col items-center gap-0.5 px-3 py-1 font-semibold hover:cursor-pointer hover:text-gray-100 ease-in-out duration-300
                  ${isActive ? 'bg-black' : ''}`}
            >
            <span className={`${isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-100 ease-in-out duration-200'}`}>
                {item.icon}
            </span>
            <span className={`text-sm ${isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-100 ease-in-out duration-200 '}`}>
                {item.label}
            </span>
            </button>
        );
        })}
    </div>
    </nav>
  );
}