import { useEffect, useId, useRef, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { searchTickers } from '../../services/stockService';
import { formatPercent, getTrend, isValidTicker, normalizeTicker } from '../../utils/stockUtils';
import StockLogo from '../Stocks/StockLogo';

const TREND_TEXT = {
  up: 'text-green-700',
  down: 'text-red-600',
  flat: 'text-gray-500',
};

/**
 * Campo de busca por ticker com sugestões (autocomplete).
 * Enter / botão "Buscar" consulta o ticker digitado; clicar numa sugestão consulta aquele ativo.
 *
 * @param onSelect  (symbol: string) => void
 */
export default function StockSearch({ onSelect }) {
  const [term, setTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);

  const uid = useId();
  const listId = `${uid}-list`;
  const errorId = `${uid}-error`;
  const optionId = (i) => `${uid}-option-${i}`;

  // Sugestões: espera 400 ms sem digitar e só busca com 2+ caracteres.
  // A falha é silenciosa (o autocomplete é um extra; a busca por ticker continua funcionando).
  useEffect(() => {
    const text = term.trim();

    if (text.length < 2) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    let cancelled = false;
    setLoadingSuggestions(true);

    const timer = setTimeout(() => {
      searchTickers(text)
        .then((list) => {
          if (!cancelled) setSuggestions(list);
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        })
        .finally(() => {
          if (!cancelled) setLoadingSuggestions(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term]);

  // Fecha a lista ao clicar/tocar fora
  useEffect(() => {
    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  // A opção destacada acompanha a lista de sugestões
  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

  useEffect(() => {
    if (activeIndex >= 0) {
      document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: 'nearest' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  function handleSubmit(event) {
    event.preventDefault();

    // Enter com uma sugestão destacada escolhe aquela sugestão
    if (open && activeIndex >= 0 && suggestions[activeIndex]) {
      handleSelect(suggestions[activeIndex].symbol);
      return;
    }

    const symbol = normalizeTicker(term);

    if (!isValidTicker(symbol)) {
      setFormError('Digite um ticker válido, como PETR4 ou VALE3.');
      return;
    }

    setFormError('');
    setOpen(false);
    onSelect(symbol);
  }

  function handleSelect(symbol) {
    setTerm(symbol);
    setFormError('');
    setOpen(false);
    onSelect(symbol);
  }

  function handleClear() {
    setTerm('');
    setFormError('');
    setSuggestions([]);
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(suggestions.length - 1, i + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => Math.max(-1, i - 1));
    }
  }

  const showDropdown = open && term.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2" role="search">
        <div className="relative flex-1 min-w-0">
          <SearchIcon
            fontSize="small"
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            role="combobox"
            aria-label="Buscar ação por ticker ou empresa"
            aria-expanded={showDropdown}
            aria-controls={showDropdown ? listId : undefined}
            aria-autocomplete="list"
            aria-activedescendant={showDropdown && activeIndex >= 0 ? optionId(activeIndex) : undefined}
            aria-invalid={formError ? true : undefined}
            aria-describedby={formError ? errorId : undefined}
            value={term}
            maxLength={50}
            onChange={(event) => {
              setTerm(event.target.value);
              setFormError('');
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar por ticker ou empresa (ex.: PETR4)"
            autoComplete="off"
            className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-10 text-sm text-gray-800 shadow-sm outline-none transition focus:border-primary-500 ${
              formError ? 'border-red-400' : 'border-gray-200'
            }`}
          />
          {term && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Limpar busca"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-gray-500 transition-colors hover:cursor-pointer hover:text-gray-700"
            >
              <CloseIcon fontSize="small" />
            </button>
          )}
        </div>

        <button
          type="submit"
          className="rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:cursor-pointer hover:bg-primary-600"
        >
          Buscar
        </button>
      </form>

      {formError && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">{formError}</p>
      )}

      {showDropdown && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Sugestões"
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg"
        >
          {loadingSuggestions && suggestions.length === 0 && (
            <li role="presentation" className="px-4 py-3 text-sm text-gray-500">Buscando...</li>
          )}

          {!loadingSuggestions && suggestions.length === 0 && (
            <li role="presentation" className="px-4 py-3 text-sm text-gray-500">
              Nenhuma sugestão. Pressione Enter para consultar &quot;{normalizeTicker(term)}&quot;.
            </li>
          )}

          {suggestions.map((item, index) => (
            <li
              key={item.symbol}
              id={optionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              onClick={() => handleSelect(item.symbol)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:cursor-pointer ${
                index === activeIndex ? 'bg-gray-50' : ''
              }`}
            >
              <StockLogo key={item.symbol} src={item.logoUrl} symbol={item.symbol} size="h-8 w-8" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800">{item.symbol}</p>
                <p className="truncate text-xs text-gray-500">{item.name}</p>
              </div>
              {item.changePercent != null && (
                <span
                  className={`flex-shrink-0 text-xs font-semibold ${
                    TREND_TEXT[getTrend(item.changePercent)]
                  }`}
                >
                  {formatPercent(item.changePercent)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}