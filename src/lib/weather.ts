export const OPEN_METEO =
  process.env.WEATHER_BASE || 'https://api.open-meteo.com/v1/forecast';

export async function safeFetchJSON<T = unknown>(url: string): Promise<{ data?: T; error?: string }> {
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) return { error: `HTTP ${r.status}` };
    const j = (await r.json()) as T;
    return { data: j };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}
