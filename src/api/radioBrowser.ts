import type { Station } from '../types';

const SERVERS = [
  'https://de1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
];

let activeServer = SERVERS[0];

async function apiFetch<T>(path: string): Promise<T> {
  for (const server of [activeServer, ...SERVERS.filter((s) => s !== activeServer)]) {
    try {
      const res = await fetch(`${server}/json${path}`, {
        headers: { 'User-Agent': 'RadioAjay/1.0' },
      });
      if (!res.ok) continue;
      activeServer = server;
      return res.json();
    } catch {
      // try next server
    }
  }
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

export async function getStats(): Promise<{ stations: number }> {
  return apiFetch<{ stations: number }>('/stats');
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
