import { useEffect, useRef, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { searchTickers } from '../../services/stockService';
import { formatPercent, getTrend, isValidTicker, normalizeTicker } from '../../utils/stockUtils';
import StockLogo from './StockLogo';

const TREND_TEXT = {
  up: 'text-green-600',
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
  const containerRef = useRef(null);

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

  // Fecha a lista ao clicar fora ou apertar ESC
  useEffect(() => {
    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
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

  const showDropdown = open && term.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon
            fontSize="small"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
              setFormError('');
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar por ticker ou empresa (ex.: PETR4)"
            autoComplete="off"
            className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-9 text-sm text-gray-800 shadow-sm outline-none transition focus:border-primary-500 ${
              formError ? 'border-red-400' : 'border-gray-200'
            }`}
          />
          {term && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:cursor-pointer hover:text-gray-600"
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

      {formError && <p className="mt-1 text-xs text-red-600">{formError}</p>}

      {showDropdown && (
        <ul className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
          {loadingSuggestions && suggestions.length === 0 && (
            <li className="px-4 py-3 text-sm text-gray-500">Buscando...</li>
          )}

          {!loadingSuggestions && suggestions.length === 0 && (
            <li className="px-4 py-3 text-sm text-gray-500">
              Nenhuma sugestão. Pressione Enter para consultar &quot;{normalizeTicker(term)}&quot;.
            </li>
          )}

          {suggestions.map((item) => (
            <li key={item.symbol}>
              <button
                type="button"
                onClick={() => handleSelect(item.symbol)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:cursor-pointer hover:bg-gray-50"
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
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}