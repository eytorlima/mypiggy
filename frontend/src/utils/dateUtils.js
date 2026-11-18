const pad = (n) => String(n).padStart(2, '0');

// Date -> "2026-10-07T14:30:00"
export function toLocalDateTime(date) {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());

  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// "2026-10-07" -> "2026-10-07T00:00:00"
export function dateInputToLocalDateTime(dateStr) {
  return `${dateStr}T00:00:00`;
}

// "2026-10-07T14:30:00" -> "2026-10-07"
export function localDateTimeToDateInput(dateTimeStr) {
  return dateTimeStr.slice(0, 10);
}

// Primeiro e último instante de um mês
export function monthRange(year, month) {
  const lastDay = new Date(year, month, 0).getDate();

  const startDate = `${year}-${pad(month)}-01T00:00:00`;
  const endDate = `${year}-${pad(month)}-${pad(lastDay)}T23:59:59`;

  return {
    startDate,
    endDate
  };
}