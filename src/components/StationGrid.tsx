import { useEffect, useRef } from 'react';
import { Loader2, Radio } from 'lucide-react';
import StationCard from './StationCard';
import type { Station } from '../types';

interface Props {
  stations: Station[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  activeStation: Station | null;
  isPlaying: boolean;
  isFavorite: (id: string) => boolean;
  onPlay: (s: Station) => void;
  onFavorite: (s: Station) => void;
  title?: string;
  totalCount?: number;
}

export default function StationGrid({
  stations, loading, loadingMore, hasMore, onLoadMore,
  activeStation, isPlaying, isFavorite, onPlay, onFavorite, title, totalCount,
}: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) onLoadMore();
      },
      { rootMargin: '400px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, onLoadMore]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--sp-green)' }} />
          <p className="text-sm" style={{ color: 'var(--sp-muted)' }}>Loading stations...</p>
        </div>
      </div>
    );
  }

  if (!stations.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <Radio size={48} style={{ color: 'var(--sp-subtle)' }} />
        <div className="text-center">
          <p className="font-semibold text-white mb-1">No stations found</p>
          <p className="text-sm" style={{ color: 'var(--sp-muted)' }}>Try a different search or filter</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 pb-4 sm:pb-6">
      {title && (
        <div className="flex items-baseline justify-between mb-3 sm:mb-4 pt-1 sm:pt-2">
          <h2 className="text-lg sm:text-2xl font-bold text-white">{title}</h2>
          {totalCount && (
            <span className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--sp-green)' }}>
              {stations.length.toLocaleString()} / {totalCount.toLocaleString()}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-4">
        {stations.map((station) => (
          <StationCard
            key={station.stationuuid}
            station={station}
            isActive={activeStation?.stationuuid === station.stationuuid}
            isPlaying={isPlaying}
            isFavorite={isFavorite(station.stationuuid)}
            onPlay={() => onPlay(station)}
            onFavorite={() => onFavorite(station)}
          />
        ))}
      </div>

      <div ref={sentinelRef} className="h-2 mt-4" />

      {loadingMore && (
        <div className="flex justify-center py-8">
          <Loader2 size={22} className="animate-spin" style={{ color: 'var(--sp-green)' }} />
        </div>
      )}

      {!hasMore && stations.length > 0 && (
        <p className="text-center text-xs py-6" style={{ color: 'var(--sp-subtle)' }}>
          All {stations.length.toLocaleString()} stations loaded
        </p>
      )}
    </div>
  );
}
