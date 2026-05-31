export interface Station {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  favicon: string;
  tags: string;
  country: string;
  countrycode: string;
  state: string;
  language: string;
  codec: string;
  bitrate: number;
  votes: number;
  clickcount: number;
}

export type Tab = 'all' | 'favorites' | 'recent';

export type SidebarSection = 'favorites' | 'recent' | 'country' | 'state' | 'genre';

export interface PlayerState {
  station: Station | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
}
