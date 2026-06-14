import type { Station } from '../types';

const SERVERS = [
  'https://de1.api.radio-browser.info',
  'https://de2.api.radio-browser.info',
  'https://all.api.radio-browser.info',
];

let activeServer = SERVERS[0];

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
  return apiFetch<Station[]>(`/stations/search?${query.toString()}`);
}

export async function getStations(params: { limit?: number; offset?: number } = {}): Promise<Station[]> {
  const query = new URLSearchParams();
  query.set('limit', String(params.limit ?? 100));
  query.set('offset', String(params.offset ?? 0));
  query.set('order', 'votes');
  query.set('reverse', 'true');
  query.set('hidebroken', 'true');
  return apiFetch<Station[]>(`/stations?${query.toString()}`);
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
  return apiFetch<{ stations: number }>('/stats');
}
export async function getGlobalStats(): Promise<GlobalStats> {
  return apiFetch<GlobalStats>('/stats');
}
export async function getTopStations(limit = 10): Promise<Station[]> {
  return apiFetch<Station[]>(`/stations/topclick?limit=${limit}&hidebroken=true`);
}

export async function getCountries(): Promise<{ name: string; stationcount: number }[]> {
  const data = await apiFetch<{ name: string; stationcount: number }[]>('/countries?order=stationcount&reverse=true');
  return data.filter((c) => c.name && c.stationcount > 0);
}

export async function getTags(limit = 80): Promise<{ name: string; stationcount: number }[]> {
  const data = await apiFetch<{ name: string; stationcount: number }[]>(
    `/tags?order=stationcount&reverse=true&limit=${limit}`
  );
  return data.filter((t) => t.name && t.stationcount > 10);
}

export async function getIndiaStates(): Promise<{ name: string; stationcount: number }[]> {
  const data = await apiFetch<{ name: string; stationcount: number }[]>('/states/India');
  return data.filter((s) => s.stationcount > 0);
}

export function recordClick(stationuuid: string): void {
  fetch(`${activeServer}/json/url/${stationuuid}`).catch(() => {});
}
