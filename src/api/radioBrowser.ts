import type { Station } from '../types';

const SERVERS = [
  'https://de1.api.radio-browser.info',
  'https://de2.api.radio-browser.info',
  'https://all.api.radio-browser.info',
];

let activeServer = SERVERS[0];

// localStorage cache, stale-while-revalidate: within the TTL an entry is used
// without touching the network; past it, callers can still show it instantly
// (peek*) while a fresh copy is fetched, and fall back to it if the fetch fails.
const CACHE_TTL_MS = {
  countries: 24 * 60 * 60 * 1000,  // 24 h — country list barely changes
  tags:      24 * 60 * 60 * 1000,  // 24 h
  stats:      5 * 60 * 1000,        // 5 min
  stations:  15 * 60 * 1000,        // 15 min for first pages
};
// Stale entries older than this are too out of date to show at all
const MAX_STALE_MS = 7 * 24 * 60 * 60 * 1000;

function lsRead<T>(key: string): { data: T; age: number } | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw) as { ts: number; data: T };
    const age = Date.now() - ts;
    return age > MAX_STALE_MS ? null : { data, age };
  } catch { return null; }
}

function lsGet<T>(key: string, ttlMs: number): T | null {
  const hit = lsRead<T>(key);
  return hit && hit.age <= ttlMs ? hit.data : null;
}

function lsSet(key: string, data: unknown): void {
  try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch {}
}

/** Fetch with cache: fresh hit skips the network; on network failure, serve stale. */
async function cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>, shouldStore: (d: T) => boolean): Promise<T> {
  const fresh = lsGet<T>(key, ttlMs);
  if (fresh) return fresh;
  try {
    const data = await fetcher();
    if (shouldStore(data)) lsSet(key, data);
    return data;
  } catch (err) {
    const stale = lsRead<T>(key);
    if (stale) return stale.data;
    throw err;
  }
}

// ── First-page station cache ─────────────────────────────────────────────────
// Default list plus country/genre first pages; name searches aren't cached.
// Kept to a handful of pages (LRU) and trimmed to the fields the app uses,
// so localStorage stays well under quota.
const PAGE_INDEX_KEY = 'radio_page_keys';
const MAX_CACHED_PAGES = 6;

function pageKey(country?: string, tag?: string) {
  return !country && !tag ? 'radio_stations_p0' : `radio_stations_p0_${country ?? ''}|${tag ?? ''}`;
}

function trimStation(s: Station): Station {
  return {
    stationuuid: s.stationuuid, name: s.name, url: s.url, url_resolved: s.url_resolved,
    favicon: s.favicon, tags: s.tags, country: s.country, countrycode: s.countrycode,
    state: s.state, language: s.language, codec: s.codec, bitrate: s.bitrate,
    votes: s.votes, clickcount: s.clickcount,
  };
}

function storePage(key: string, data: Station[]) {
  if (!data.length) return;
  lsSet(key, data.map(trimStation));
  try {
    const keys: string[] = JSON.parse(localStorage.getItem(PAGE_INDEX_KEY) || '[]');
    const next = [key, ...keys.filter((k) => k !== key)];
    next.slice(MAX_CACHED_PAGES).forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(PAGE_INDEX_KEY, JSON.stringify(next.slice(0, MAX_CACHED_PAGES)));
  } catch { /* quota or private mode — cache is best-effort */ }
}

/** Cached first page for a filter, even if stale — for instant display. */
export function peekStationsPage(filter: { country?: string; tag?: string }): { data: Station[]; fresh: boolean } | null {
  const hit = lsRead<Station[]>(pageKey(filter.country, filter.tag));
  return hit && hit.data.length ? { data: hit.data, fresh: hit.age <= CACHE_TTL_MS.stations } : null;
}

export function peekCountries() { return lsRead<{ name: string; stationcount: number }[]>('radio_countries')?.data ?? null; }
export function peekTags(limit = 80) { return lsRead<{ name: string; stationcount: number }[]>(`radio_tags_${limit}`)?.data ?? null; }
export function peekStats() { return lsRead<{ stations: number }>('radio_stats')?.data ?? null; }

async function tryServers<T>(path: string): Promise<{ data: T; empty: boolean } | null> {
  let emptyResult: T | undefined;
  for (const server of [activeServer, ...SERVERS.filter((s) => s !== activeServer)]) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(`${server}/json${path}`, {
        headers: { 'User-Agent': 'RadioAjay/1.0' },
        signal: controller.signal,
      });
      if (!res.ok) continue;
      const data = await res.json();
      // A 200 with an empty array can mean this mirror hasn't synced the
      // query's data yet — keep trying other servers for a real result,
      // but remember it in case every server comes back empty.
      if (Array.isArray(data) && data.length === 0) {
        if (emptyResult === undefined) emptyResult = data as T;
        continue;
      }
      activeServer = server;
      return { data: data as T, empty: false };
    } catch {
      // try next server
    } finally {
      clearTimeout(timeout);
    }
  }
  return emptyResult !== undefined ? { data: emptyResult, empty: true } : null;
}

// The radio-browser mirror network occasionally has brief, network-wide
// hiccups where every server returns nothing. Retry a couple of times with
// backoff before giving up, rather than failing the whole page load.
async function apiFetch<T>(path: string): Promise<T> {
  let lastEmpty: T | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await tryServers<T>(path);
    if (result) {
      if (!result.empty) return result.data;
      lastEmpty = result.data;
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
  }
  if (lastEmpty !== undefined) return lastEmpty;
  throw new Error('All radio-browser servers unreachable');
}

export interface SearchParams {
  name?: string;
  country?: string;
  state?: string;
  tag?: string;
  limit?: number;
  offset?: number;
  order?: string;
  reverse?: boolean;
  hidebroken?: boolean;
}

export async function searchStations(params: SearchParams): Promise<Station[]> {
  const query = new URLSearchParams();
  if (params.name) query.set('name', params.name);
  if (params.country) query.set('country', params.country);
  if (params.state) query.set('state', params.state);
  if (params.tag) query.set('tag', params.tag);
  query.set('limit', String(params.limit ?? 100));
  query.set('offset', String(params.offset ?? 0));
  query.set('order', params.order ?? 'clickcount');
  query.set('reverse', params.reverse !== false ? 'true' : 'false');
  query.set('hidebroken', params.hidebroken !== false ? 'true' : 'false');
  const cacheable = !params.name && !params.state && (params.offset ?? 0) === 0;
  if (!cacheable) return apiFetch<Station[]>(`/stations/search?${query.toString()}`);
  const key = pageKey(params.country, params.tag);
  return cached(key, CACHE_TTL_MS.stations,
    async () => {
      const data = await apiFetch<Station[]>(`/stations/search?${query.toString()}`);
      storePage(key, data);
      return data;
    },
    () => false); // storePage handles storage + LRU
}

export async function getStations(params: { limit?: number; offset?: number } = {}): Promise<Station[]> {
  const limit = params.limit ?? 100;
  const offset = params.offset ?? 0;
  const query = new URLSearchParams();
  query.set('limit', String(limit));
  query.set('offset', String(offset));
  query.set('order', 'votes');
  query.set('reverse', 'true');
  query.set('hidebroken', 'true');
  if (offset !== 0) return apiFetch<Station[]>(`/stations?${query.toString()}`);
  const key = pageKey();
  return cached(key, CACHE_TTL_MS.stations,
    async () => {
      const data = await apiFetch<Station[]>(`/stations?${query.toString()}`);
      storePage(key, data);
      return data;
    },
    () => false);
}

export interface GlobalStats {
  stations: number;
  stations_broken: number;
  tags: number;
  clicks_last_hour: number;
  clicks_last_day: number;
  languages: number;
  countries: number;
}
export async function getStats(): Promise<{ stations: number }> {
  return cached('radio_stats', CACHE_TTL_MS.stats,
    async () => ({ stations: (await apiFetch<{ stations: number }>('/stats')).stations }),
    (d) => d.stations > 0);
}
export async function getGlobalStats(): Promise<GlobalStats> {
  return apiFetch<GlobalStats>('/stats');
}
export async function getTopStations(limit = 10): Promise<Station[]> {
  return apiFetch<Station[]>(`/stations/topclick?limit=${limit}&hidebroken=true`);
}

export async function getCountries(): Promise<{ name: string; stationcount: number }[]> {
  return cached('radio_countries', CACHE_TTL_MS.countries, async () => {
    const data = await apiFetch<{ name: string; stationcount: number }[]>('/countries?order=stationcount&reverse=true');
    // Keep only the two fields used — the raw payload also carries iso codes etc.
    return data.filter((c) => c.name && c.stationcount > 0).map(({ name, stationcount }) => ({ name, stationcount }));
  }, (d) => d.length > 0);
}

export async function getTags(limit = 80): Promise<{ name: string; stationcount: number }[]> {
  return cached(`radio_tags_${limit}`, CACHE_TTL_MS.tags, async () => {
    const data = await apiFetch<{ name: string; stationcount: number }[]>(
      `/tags?order=stationcount&reverse=true&limit=${limit}`
    );
    return data.filter((t) => t.name && t.stationcount > 10).map(({ name, stationcount }) => ({ name, stationcount }));
  }, (d) => d.length > 0);
}

export async function getIndiaStates(): Promise<{ name: string; stationcount: number }[]> {
  const data = await apiFetch<{ name: string; stationcount: number }[]>('/states/India');
  return data.filter((s) => s.stationcount > 0);
}

export function recordClick(stationuuid: string): void {
  fetch(`${activeServer}/json/url/${stationuuid}`).catch(() => {});
}
