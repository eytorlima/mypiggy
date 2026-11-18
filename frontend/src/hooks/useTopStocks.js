import { useEffect, useState } from 'react';
import { getTopStocks } from '../services/stockService';

/**
 * Carrega uma vez as principais ações (preço + variação). O resultado alimenta a lista
 * e a faixa rolante, então a página inteira gasta no máximo 1 requisição (0 se houver cache).
 */
export function useTopStocks() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    getTopStocks()
      .then((data) => {
        if (!cancelled) setStocks(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { stocks, loading, error };
}