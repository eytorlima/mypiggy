import { useEffect, useId, useRef, useState } from 'react';

// Lista suspensa com caixas de seleção. Nenhum item marcado = "todos" (sem filtro).
// options: [{ value, label }]   selected: array de values   onChange(novoArray)
export default function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
  allLabel = 'Todas',
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  const uid = useId();
  const labelId = `${uid}-label`;
  const buttonId = `${uid}-button`;
  const panelId = `${uid}-panel`;

  // Fecha ao clicar fora, tabular para fora ou apertar ESC (só escuta enquanto está aberto)
  useEffect(() => {
    if (!open) return undefined;

    function closeIfOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false);
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', closeIfOutside);
    document.addEventListener('focusin', closeIfOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', closeIfOutside);
      document.removeEventListener('focusin', closeIfOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function toggle(value) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  let summary = allLabel;
  if (selected.length === 1) {
    summary = options.find((o) => o.value === selected[0])?.label ?? '1 selecionado';
  } else if (selected.length > 1) {
    summary = `${selected.length} selecionados`;
  }

  return (
    <div className="relative" ref={containerRef}>
      <span id={labelId} className="mb-1 block text-xs font-medium text-gray-600">{label}</span>

      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-labelledby={`${labelId} ${buttonId}`}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-sm transition hover:cursor-pointer hover:border-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={`truncate ${selected.length === 0 ? 'text-gray-500' : ''}`}>{summary}</span>
        <span aria-hidden="true" className="ml-2 text-xs text-gray-500">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div
          id={panelId}
          role="group"
          aria-label={label}
          className="absolute z-20 mt-1 w-full rounded-lg border border-gray-300 bg-white shadow-lg"
        >
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full border-b border-gray-300 px-3 py-2.5 text-left text-xs font-medium text-gray-600 transition hover:cursor-pointer hover:bg-gray-100"
            >
              Limpar seleção ({allLabel.toLowerCase()})
            </button>
          )}

          <ul className="max-h-56 overflow-y-auto overscroll-contain py-1">
            {options.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500">Nenhuma opção disponível.</li>
            )}
            {options.map((option) => (
              <li key={option.value}>
                <label className="flex cursor-pointer items-center gap-2 px-3 py-2.5 sm:py-2 text-sm text-gray-800 transition hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={selected.includes(option.value)}
                    onChange={() => toggle(option.value)}
                    className="h-4 w-4 cursor-pointer accent-primary-500"
                  />
                  <span className="truncate">{option.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}