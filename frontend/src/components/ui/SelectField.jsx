import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined';

const LIST_MAX_HEIGHT = 224; // equivale a max-h-56

/**
 * Select customizado com animação.
 * A lista é renderizada no <body> (portal) para não ser cortada pelo
 * overflow de modais e abre para cima quando falta espaço embaixo.
 *
 * options: [{ value: string, label: string }]
 */
export function SelectField({
  label,
  options,
  value,
  onChange,
  error,
  placeholder = 'Selecione...',
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);

  function updatePosition() {
    if (buttonRef.current) setRect(buttonRef.current.getBoundingClientRect());
  }

  function toggle() {
    if (disabled) return;
    if (!isOpen) updatePosition();
    setIsOpen((o) => !o);
  }

  // Fecha ao clicar fora (botão ou lista)
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        buttonRef.current?.contains(e.target) ||
        listRef.current?.contains(e.target)
      ) {
        return;
      }
      setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reposiciona se a tela/modal rolar ou redimensionar enquanto aberto
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  const selected = options.find((o) => o.value === value);

  // Abre para cima se não couber embaixo e houver mais espaço em cima
  const spaceBelow = rect ? window.innerHeight - rect.bottom : 0;
  const openUp =
    !!rect && spaceBelow < LIST_MAX_HEIGHT + 8 && rect.top > spaceBelow;

  const positionStyle = rect
    ? openUp
      ? { bottom: window.innerHeight - rect.top + 4 }
      : { top: rect.bottom + 4 }
    : {};

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}

      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={toggle}
        className={`w-full flex items-center justify-between gap-3 pl-3 pr-4 py-2 rounded-lg border bg-white text-sm
                    focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed
                    hover:cursor-pointer ${error ? 'border-red-400' : 'border-gray-300'}`}
      >
        <span className={selected ? 'text-gray-700' : 'text-gray-400'}>
          {selected?.label ?? placeholder}
        </span>
        <ExpandMoreOutlined
          fontSize="small"
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {rect &&
        createPortal(
          <ul
            ref={listRef}
            role="listbox"
            style={{
              position: 'fixed',
              left: rect.left,
              width: rect.width,
              maxHeight: LIST_MAX_HEIGHT,
              ...positionStyle,
            }}
            className={`z-[60] bg-white border border-gray-200 rounded-lg shadow-lg overflow-y-auto
                        transition-all duration-200 ease-out
                        ${openUp ? 'origin-bottom' : 'origin-top'}
                        ${
                          isOpen
                            ? 'opacity-100 translate-y-0 scale-100'
                            : `opacity-0 scale-95 pointer-events-none ${openUp ? 'translate-y-2' : '-translate-y-2'}`
                        }`}
          >
            {options.map((opt) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-4 py-2 text-sm hover:cursor-pointer transition-colors
                            ${
                              opt.value === value
                                ? 'bg-primary-50 text-primary-600 font-semibold'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
              >
                {opt.label}
              </li>
            ))}
          </ul>,
          document.body
        )}

      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}