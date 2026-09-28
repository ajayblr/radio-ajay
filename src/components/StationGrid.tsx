import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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
  /** Content above the grid that scrolls with it (e.g. the home shelves) */
  header?: ReactNode;
  onRetry?: () => void;
}

// Card size matches the home shelves (StationShelf: w-36 / sm:w-44, gap-1 / sm:gap-2)
// so every list shows the same size artwork. Columns = however many cards of
// that width fit, rounded to the nearest whole number, then stretched to fill.
const SM = 640;
function layoutFor(containerWidth: number) {
  const wide = window.innerWidth >= SM;
  const cardWidth = wide ? 176 : 144;
  const gap = wide ? 8 : 4;
  const cols = Math.max(2, Math.round((containerWidth + gap) / (cardWidth + gap)));
  return { cols, gap };
}

function useGridLayout(el: HTMLElement | null) {
  const [layout, setLayout] = useState(() => layoutFor(0));
  useLayoutEffect(() => {
    if (!el) return;
    const measure = () => {
      const cs = getComputedStyle(el);
      const width = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      setLayout((prev) => {
        const next = layoutFor(width);
        return next.cols === prev.cols && next.gap === prev.gap ? prev : next;
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return layout;
}

export default function StationGrid({
  stations, loading, loadingMore, hasMore, onLoadMore,
  activeStation, isPlaying, isFavorite, onPlay, onFavorite, title, header, onRetry,
}: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  // Root element (skeleton or list) — measured to work out how many columns fit
  const [rootEl, setRootEl] = useState<HTMLDivElement | null>(null);
  const rootRef = useCallback((node: HTMLDivElement | null) => {
    scrollRef.current = node;
    setRootEl(node);
  }, []);
  const { cols, gap } = useGridLayout(rootEl);
  const rowCount = Math.ceil(stations.length / cols);

  // Offset of the grid inside the scroll container — the header/title above it
  // can change height (shelves filling in, images loading), so track it live
  const [scrollMargin, setScrollMargin] = useState(0);
  const isEmpty = stations.length === 0;
  useLayoutEffect(() => {
    const list = listRef.current;
    const head = headRef.current;
    if (!list) return;
    const update = () => setScrollMargin(list.offsetTop);
    update();
    if (!head) return;
    const ro = new ResizeObserver(update);
    ro.observe(head);
    return () => ro.disconnect();
  }, [loading, isEmpty]);

  // Only the rows near the viewport are rendered, so the DOM stays small
  // no matter how many pages infinite scroll has pulled in.
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 260,
    gap,
    overscan: 3,
    scrollMargin,
  });
  const virtualRows = virtualizer.getVirtualItems();
  const lastRowIndex = virtualRows.length ? virtualRows[virtualRows.length - 1].index : -1;

  // Infinite scroll: fetch the next page once the rendered rows reach the end
  useEffect(() => {
    if (loading || loadingMore || !hasMore || rowCount === 0) return;
    if (lastRowIndex >= rowCount - 1) onLoadMore();
  }, [lastRowIndex, rowCount, hasMore, loadingMore, loading, onLoadMore]);

  const headBlock = (
    <div ref={headRef} className="pt-1 sm:pt-2">
      {header}
      {title && (
        <h2 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 px-1" style={{ color: 'var(--sp-text)' }}>{title}</h2>
      )}
    </div>
  );

  if (loading) {
    // Skeleton cards in the grid's own shape read as faster than a spinner
    return (
      <div ref={rootRef} className="flex-1 overflow-hidden px-3 sm:px-6" aria-busy="true" aria-label="Loading stations">
        {headBlock}
        <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap }}>
          {Array.from({ length: cols * 3 }, (_, i) => (
            <div key={i} className="p-3">
              <div className="skeleton w-full aspect-square rounded-md mb-4" />
              <div className="skeleton h-3.5 rounded w-4/5 mb-2" />
              <div className="skeleton h-3 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stations.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <Radio size={48} style={{ color: 'var(--sp-subtle)' }} />
        <div className="text-center">
          <p className="font-semibold mb-1" style={{ color: 'var(--sp-text)' }}>No stations found</p>
          <p className="text-sm" style={{ color: 'var(--sp-muted)' }}>Try a different search or filter</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-1.5 text-xs font-semibold rounded-full transition-opacity hover:opacity-90"
            style={{ background: 'var(--sp-green)', color: '#000' }}
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative flex-1 overflow-y-auto px-3 sm:px-6 pb-4 sm:pb-6">
      {headBlock}

      <div ref={listRef} className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualRows.map((row) => {
          const rowStations = stations.slice(row.index * cols, row.index * cols + cols);
          return (
            <div
              key={row.key}
              data-index={row.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 top-0 w-full grid"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap,
                transform: `translateY(${row.start - scrollMargin}px)`,
              }}
            >
              {rowStations.map((station) => (
                <StationCard
                  key={station.stationuuid}
                  station={station}
                  isActive={activeStation?.stationuuid === station.stationuuid}
                  // Only the active card cares about play state — keeps the rest memo-stable
                  isPlaying={isPlaying && activeStation?.stationuuid === station.stationuuid}
                  isFavorite={isFavorite(station.stationuuid)}
                  onPlay={onPlay}
                  onFavorite={onFavorite}
                />
              ))}
            </div>
          );
        })}
      </div>

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
