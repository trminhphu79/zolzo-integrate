export function urlDecode(v: string) {
  return decodeURIComponent(v);
}

export function toHeaderMap(
  h: Record<string, string | string[] | undefined>,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const k of Object.keys(h || {})) {
    const v = h[k];
    if (v == null) continue;
    out[k] = Array.isArray(v) ? v : [v];
  }
  return out;
}
export function parseComposedHeaderValue(
  value?: string,
): Record<string, string> | null {
  if (!value) return null;
  const map: Record<string, string> = {};
  for (const part of value.split(',')) {
    const kv = part.trim().split('=');
    if (kv.length === 2) map[kv[0].trim()] = kv[1].trim();
  }
  return map;
}

export function normalizeHeaders(
  h: Record<string, any>,
): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of Object.entries(h || {})) {
    const proper = k.replace(/(^|-)([a-z])/g, (m) => m.toUpperCase());
    out[proper] = v as any;
  }
  return out;
}
