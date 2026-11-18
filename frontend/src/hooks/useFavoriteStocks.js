import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'mypiggy:favorite-stocks';
const MAX_FAVORITES = 20;

// localStorage pode lançar erro (modo privado, dados bloqueados) ou conter lixo:
// qualquer problema vira simplesmente "sem favoritos".
function readFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function writeFavorites(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // sem espaço ou bloqueado: os favoritos continuam funcionando só nesta sessão
  }
}

/**
 * Lista de tickers favoritos persistida no localStorage.
 * @returns {{ favorites: string[], isFavorite: (s: string) => boolean,
 *             toggleFavorite: (s: string) => void, removeFavorite: (s: string) => void }}
 */
export function useFavoriteStocks() {
  const [favorites, setFavorites] = useState(readFavorites);

  // Persiste sempre que a lista muda
  useEffect(() => {
    writeFavorites(favorites);
  }, [favorites]);

  const isFavorite = useCallback((symbol) => favorites.includes(symbol), [favorites]);

  const toggleFavorite = useCallback((symbol) => {
    setFavorites((previous) =>
      previous.includes(symbol)
        ? previous.filter((item) => item !== symbol)
        : [symbol, ...previous].slice(0, MAX_FAVORITES)
    );
  }, []);

  const removeFavorite = useCallback((symbol) => {
    setFavorites((previous) => previous.filter((item) => item !== symbol));
  }, []);

  return { favorites, isFavorite, toggleFavorite, removeFavorite };
}