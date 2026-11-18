import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined';

const LIST_MAX_HEIGHT = 224; // equivale a max-h-56

/**
 * Select customizado com animação.
 * A lista é renderizada no <body> (portal) para não ser cortada pelo
 * overflow de modais e abre para cima quando falta espaço embaixo.
 * Teclado: setas, Home/End, Enter/Espaço (escolhe), Esc e Tab (fecham).
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
  const [activeIndex, setActiveIndex] = useState(-1);
  const buttonRef = useRef(null);
  const listRef = useRef(null);

  const uid = useId();
  const buttonId = `${uid}-button`;
  const labelId = `${uid}-label`;
  const listId = `${uid}-list`;
  const errorId = `${uid}-error`;
  const optionId = (i) => `${uid}-option-${i}`;

  function updatePosition() {
    if (buttonRef.current) setRect(buttonRef.current.getBoundingClientRect());
  }

  function openList() {
    if (disabled) return;
    updatePosition();
    const current = options.findIndex((o) => o.value === value);
    setActiveIndex(current >= 0 ? current : 0);
    setIsOpen(true);
  }

  function choose(index) {
    const opt = options[index];
    if (!opt) return;
    onChange(opt.value);
    setIsOpen(false);
    buttonRef.current?.focus();
  }

  function handleKeyDown(e) {
    const last = options.length - 1;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openList();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(last, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(last);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        choose(activeIndex);
        break;
      case 'Escape':
        // Fecha só a lista: não deixa o ESC chegar ao modal que está por baixo
        e.stopPropagation();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
    }
  }

  // Evita que o Espaço dispare um clique extra ao soltar a tecla
  function handleKeyUp(e) {
    if (e.key === ' ') e.preventDefault();
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
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  // Reposiciona se a tela/modal rolar ou redimensionar enquanto aberto
  useEffect(() => {
    if (!isOpen) return undefined;
    function handleScroll(e) {
      if (listRef.current?.contains(e.target)) return; // rolagem da própria lista
      updatePosition();
    }
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  // Mantém a opção ativa (teclado) visível dentro da lista
  useEffect(() => {
    if (!isOpen || activeIndex < 0) return;
    document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeIndex]);

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
        <label id={labelId} htmlFor={buttonId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        aria-activedescendant={isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        aria-labelledby={label ? `${labelId} ${buttonId}` : undefined}
        aria-describedby={error ? errorId : undefined}
        onClick={() => (isOpen ? setIsOpen(false) : openList())}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        className={`w-full min-h-[40px] flex items-center justify-between gap-3 pl-3 pr-4 py-2 rounded-lg border bg-white text-sm
                    focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed
                    hover:cursor-pointer ${error ? 'border-red-400' : 'border-gray-300'}`}
      >
        <span className={`truncate text-left ${selected ? 'text-gray-700' : 'text-gray-500'}`}>
          {selected?.label ?? placeholder}
        </span>
        <ExpandMoreOutlined
          fontSize="small"
          aria-hidden="true"
          className={`shrink-0 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {rect &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-labelledby={label ? labelId : undefined}
            aria-hidden={!isOpen}
            style={{
              position: 'fixed',
              left: rect.left,
              width: rect.width,
              maxHeight: LIST_MAX_HEIGHT,
              ...positionStyle,
            }}
            className={`z-[60] bg-white border border-gray-200 rounded-lg shadow-lg overflow-y-auto overscroll-contain
                        transition-all duration-200 ease-out
                        ${openUp ? 'origin-bottom' : 'origin-top'}
                        ${
                          isOpen
                            ? 'opacity-100 translate-y-0 scale-100'
                            : `invisible opacity-0 scale-95 pointer-events-none ${openUp ? 'translate-y-2' : '-translate-y-2'}`
                        }`}
          >
            {options.map((opt, i) => (
              <li
                key={opt.value}
                id={optionId(i)}
                role="option"
                aria-selected={opt.value === value}
                onClick={() => choose(i)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`px-4 py-2.5 sm:py-2 text-sm hover:cursor-pointer transition-colors
                            ${
                              opt.value === value
                                ? 'bg-primary-50 text-primary-700 font-semibold'
                                : i === activeIndex
                                  ? 'bg-gray-100 text-gray-700'
                                  : 'text-gray-700'
                            }`}
              >
                {opt.label}
              </li>
            ))}
          </ul>,
          document.body
        )}

      {error && (
        <p id={errorId} role="alert" className="text-red-600 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}