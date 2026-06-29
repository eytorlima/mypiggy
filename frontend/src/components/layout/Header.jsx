import { useNavigate } from 'react-router-dom';
import { PiggyLogo } from '../ui/PiggyLogo';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';

export function Header() {
const navigate = useNavigate();

    return(
        <header className="fixed top-0 left-0 right-0 z-40 bg-primary-600 px-4 py-3 flex items-center justify-between shadow-md">
            <PiggyLogo size={45} />
            <span className="text-white font-semibold text-xl tracking-wide">MyPiggy</span>
            <button
                onClick={() => navigate('/settings')}
                className=" w-10 h-10 rounded-full mr-2 text-white ease-in-out duration-300 hover:cursor-pointer hover:bg-primary-900"
            >
                <SettingsOutlined />
            </button>
        </header>
    );
}