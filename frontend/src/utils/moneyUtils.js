export function toCents(text){
    if (!text) return 0;
    return Math.round(parseMoney(text) * 100);
}

export function parseMoney(str) {
  if (!str) return 0;
  let s = String(str).trim();
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  return Number(s);
}

export function formatMoney(value) {
  return Number(value || 0).toFixed(2).replace('.', ',');
}

// Só dígitos, um único separador (. ou ,) e no máximo 2 casas decimais
export function sanitizeMoney(str) {
  const s = str.replace(/[^\d.,]/g, '');
  const idx = s.search(/[.,]/);
  if (idx === -1) return s;

  const separator = s[idx];
  const intPart = s.slice(0, idx);
  const decPart = s.slice(idx + 1).replace(/[.,]/g, '').slice(0, 2);

  return `${intPart}${separator}${decPart}`;
}
