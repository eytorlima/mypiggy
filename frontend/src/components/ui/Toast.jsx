import { useEffect, useState } from 'react';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';

// Cores com contraste WCAG AA (texto escuro sobre fundo claro)
const VARIANTS = {
  success: {
    icon: CheckCircleOutlined,
    box: 'bg-primary-50 border-primary-600 text-primary-900',
    iconColor: 'text-primary-700',
  },
  error: {
    icon: ErrorOutlineOutlined,
    box: 'bg-red-50 border-red-600 text-red-900',
    iconColor: 'text-red-700',
  },
  warning: {
    icon: WarningAmberOutlined,
    box: 'bg-amber-50 border-amber-600 text-amber-900',
    iconColor: 'text-amber-700',
  },
  info: {
    icon: InfoOutlined,
    box: 'bg-blue-50 border-blue-600 text-blue-900',
    iconColor: 'text-blue-700',
  },
};

/**
 * Um único toast. A animação de entrada/saída usa o mesmo padrão
 * dos modais (mounted/visible): entra com fade + deslocamento, sai com fade.
 */
export function Toast({ id, message, type = 'info', onClose }) {
  const [visible, setVisible] = useState(false);
  const variant = VARIANTS[type] || VARIANTS.info;
  const Icon = variant.icon;

  // Dispara a transição de entrada logo após montar
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(() => onClose(id), 200); // espera a transição de saída
  }

  return (
    <div
        role={type === 'error' ? 'alert' : 'status'}
        className={`
        pointer-events-auto flex items-center gap-3 w-full
        rounded-xl border-l-4 px-4 py-3 shadow-lg
        transition-all duration-200 ease-out
        ${variant.box}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
    `}>
            
        <Icon
            className={`${variant.iconColor}`}
            fontSize="small"
            aria-hidden="true"
        />

        <p className="flex-1 text-sm flex items-center font-medium leading-snug break-words">
            {message}
        </p>

        <button
            type="button"
            onClick={handleClose}
            aria-label="Fechar notificação"
            className="shrink-0 -mr-1 w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors cursor-pointer"
        >
            <CloseIcon fontSize="small" />
        </button>
    </div>
  );
}