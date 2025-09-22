export function formatReqTime(date = new Date()) {
  const pad = (n: number, l = 2) => String(n).padStart(l, '0');
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const HH = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  const tz = -date.getTimezoneOffset();
  const sign = tz >= 0 ? '+' : '-';
  const hh = pad(Math.floor(Math.abs(tz) / 60));
  const mins = pad(Math.abs(tz) % 60);
  return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}${sign}${hh}${mins}`;
}
