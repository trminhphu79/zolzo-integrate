function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }

export function formatReqTime(d = new Date()): string {
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const HH = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  const tzMin = -d.getTimezoneOffset(); 
  const sign = tzMin >= 0 ? '+' : '-';
  const abs = Math.abs(tzMin);
  const tzh = pad(Math.floor(abs / 60));
  const tzm = pad(abs % 60);
  return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}${sign}${tzh}${tzm}`;
}