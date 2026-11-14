import { useState } from 'react';

/**
 * Logo da empresa (vem da brapi). Se a imagem não existir ou falhar ao carregar,
 * mostra um círculo com as 2 primeiras letras do ticker.
 *
 * Use `key={symbol}` onde o ativo puder mudar, para o estado de erro reiniciar.
 */
export default function StockLogo({ src, symbol, size = 'h-10 w-10' }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`${size} flex flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700`}
      >
        {symbol?.slice(0, 2)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={symbol}
      onError={() => setFailed(true)}
      className={`${size} flex-shrink-0 rounded-full border border-gray-100 bg-white object-contain`}
    />
  );
}