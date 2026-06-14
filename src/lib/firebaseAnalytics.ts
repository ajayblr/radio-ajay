// Firebase Realtime Database REST analytics — no SDK needed.
// Set VITE_FIREBASE_DB_URL in your Vercel env vars to enable.

const DB = import.meta.env.VITE_FIREBASE_DB_URL as string | undefined;

const SESSION_KEY = 'radio_sid';
function sid() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) { id = `${Date.now()}-${Math.random().toString(36).slice(2)}`; sessionStorage.setItem(SESSION_KEY, id); }
  return id;
}

async function dbPut(path: string, data: object) {
  if (!DB) return;
  fetch(`${DB}/${path}.json`, { method: 'PUT', body: JSON.stringify(data) }).catch(() => {});
}
async function dbPost(path: string, data: object) {
  if (!DB) return;
  fetch(`${DB}/${path}.json`, { method: 'POST', body: JSON.stringify(data) }).catch(() => {});
}
async function dbDel(path: string) {
  if (!DB) return;
  fetch(`${DB}/${path}.json`, { method: 'DELETE' }).catch(() => {});
}
export async function dbGet<T>(path: string): Promise<T | null> {
  if (!DB) return null;
  try {
    const r = await fetch(`${DB}/${path}.json`);
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

/* ── Session tracking ──────────────────────────────────────── */

let heartbeat: ReturnType<typeof setInterval> | null = null;

async function getCountry(): Promise<string> {
  try {
    const r = await fetch('https://ipapi.co/country_name/');
    if (r.ok) return (await r.text()).trim();
  } catch { /* ignore */ }
  return 'Unknown';
}

export async function startSession(): Promise<() => void> {
  if (!DB) return () => {};
  const id = sid();
  const country = await getCountry();

  const upsert = () => dbPut(`sessions/${id}`, { ts: Date.now(), country });
  upsert();
  heartbeat = setInterval(upsert, 60_000);

  const cleanup = () => {
    if (heartbeat) clearInterval(heartbeat);
    dbDel(`sessions/${id}`);
  };
  window.addEventListener('beforeunload', cleanup);
  return cleanup;
}

/* ── Click tracking ────────────────────────────────────────── */

export function recordAppPlay(station: { stationuuid: string; name: string; country?: string }) {
  if (!DB) return;
  dbPost('clicks', {
    ts: Date.now(),
    sid: sid(),
    id: station.stationuuid,
    name: station.name,
    country: station.country ?? 'Unknown',
  });
}

/* ── Feedback / contact form ───────────────────────────────── */

export async function submitFeedback(data: { name?: string; email?: string; message: string }): Promise<boolean> {
  if (!DB) return false;
  try {
    const r = await fetch(`${DB}/feedback.json`, {
      method: 'POST',
      body: JSON.stringify({ ...data, ts: Date.now(), sid: sid() }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/* ── Stats queries (admin only) ────────────────────────────── */

export interface AppStats {
  clicksLastHour: number;
  clicksLast24h: number;
  activeSessions: number;
  topCountries: { country: string; count: number }[];
  recentPlays: { name: string; country: string; ts: number }[];
  configured: boolean;
}

export async function getAppStats(): Promise<AppStats> {
  if (!DB) return { clicksLastHour: 0, clicksLast24h: 0, activeSessions: 0, topCountries: [], recentPlays: [], configured: false };

  const now = Date.now();
  const hourAgo  = now - 3_600_000;
  const dayAgo   = now - 86_400_000;
  const activeWindow = now - 120_000; // 2-min heartbeat window

  const [rawClicks, rawSessions] = await Promise.all([
    dbGet<Record<string, { ts: number; name: string; country: string }>>('clicks'),
    dbGet<Record<string, { ts: number; country: string }>>('sessions'),
  ]);

  const clicks   = Object.values(rawClicks   ?? {});
  const sessions = Object.values(rawSessions ?? {});

  const recentClicks = clicks.filter(c => c.ts > dayAgo);
  const countryMap: Record<string, number> = {};
  for (const c of recentClicks) {
    if (c.country) countryMap[c.country] = (countryMap[c.country] ?? 0) + 1;
  }

  return {
    configured: true,
    clicksLastHour: clicks.filter(c => c.ts > hourAgo).length,
    clicksLast24h:  recentClicks.length,
    activeSessions: sessions.filter(s => s.ts > activeWindow).length,
    topCountries: Object.entries(countryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([country, count]) => ({ country, count })),
    recentPlays: clicks
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 8)
      .map(c => ({ name: c.name, country: c.country, ts: c.ts })),
  };
}
