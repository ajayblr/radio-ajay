import StationCard from './StationCard';
import type { Station } from '../types';

interface Props {
  title: string;
  stations: Station[];
  activeStation: Station | null;
  isPlaying: boolean;
  isFavorite: (id: string) => boolean;
  onPlay: (s: Station) => void;
  onFavorite: (s: Station) => void;
  onShowAll?: () => void;
}

/** A titled, horizontally scrolling row of station cards for the home screen. */
export default function StationShelf({ title, stations, activeStation, isPlaying, isFavorite, onPlay, onFavorite, onShowAll }: Props) {
  if (!stations.length) return null;
  return (
    <section className="mb-4 sm:mb-6">
      <div className="flex items-baseline justify-between mb-1 sm:mb-2 px-1">
        <h2 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--sp-text)' }}>{title}</h2>
        {onShowAll && (
          <button onClick={onShowAll}
            className="text-xs font-semibold hover:underline"
            style={{ color: 'var(--sp-muted)' }}>
            Show all
          </button>
        )}
      </div>
      <div className="no-scrollbar flex gap-1 sm:gap-2 overflow-x-auto snap-x snap-mandatory -mx-3 px-3 sm:-mx-6 sm:px-6">
        {stations.map((station) => (
          <div key={station.stationuuid} className="w-36 sm:w-44 shrink-0 snap-start">
            <StationCard
              station={station}
              isActive={activeStation?.stationuuid === station.stationuuid}
              isPlaying={isPlaying && activeStation?.stationuuid === station.stationuuid}
              isFavorite={isFavorite(station.stationuuid)}
              onPlay={onPlay}
              onFavorite={onFavorite}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
