import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function SettingsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex items-center justify-center h-screen bg-primary-50">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-2xl font-bold text-primary-700">
          Tela de Configs(user) (todo)
        </h1>

        <button
          onClick={handleLogout}
          className="px-6 py-3 rounded-lg bg-black text-white font-semibold shadow-md hover:bg-gray-900 transition-colors"
        >
          Sair
        </button>
      </div>
    </div>
  );
}