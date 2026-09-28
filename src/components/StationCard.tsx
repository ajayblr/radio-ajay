import { memo } from 'react';
import { Play, Pause, Heart } from 'lucide-react';
import StationArt from './StationArt';
import type { Station } from '../types';

interface Props {
  station: Station;
  isPlaying: boolean;
  isActive: boolean;
  isFavorite: boolean;
  onPlay: (s: Station) => void;
  onFavorite: (s: Station) => void;
}

function StationCard({ station, isPlaying, isActive, isFavorite, onPlay, onFavorite }: Props) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${isActive && isPlaying ? 'Pause' : 'Play'} ${station.name}`}
      aria-pressed={isActive && isPlaying}
      className={`station-card group relative flex flex-col rounded-md p-3 cursor-pointer transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[var(--sp-green)] ${isActive ? 'is-active' : ''}`}
      onClick={() => onPlay(station)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return; // let the inner buttons handle their own keys
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPlay(station); }
      }}
    >
      {/* Artwork */}
      <div className="relative w-full aspect-square rounded-md overflow-hidden mb-4 shadow-lg">
        <StationArt station={station} backdrop />

        {/* Favorite — 36px hit area around a smaller visible pill */}
        <button
          onClick={(e) => { e.stopPropagation(); onFavorite(station); }}
          aria-label={isFavorite ? `Remove ${station.name} from favourites` : `Add ${station.name} to favourites`}
          className="absolute top-0 right-0 w-9 h-9 flex items-center justify-center group/fav"
        >
          <span className="p-1.5 rounded-full transition-transform duration-150 group-hover/fav:scale-110"
            style={{ color: isFavorite ? 'var(--sp-green)' : 'white', background: 'rgba(0,0,0,0.45)' }}>
            <Heart size={15} fill={isFavorite ? 'currentColor' : 'none'} />
          </span>
        </button>

        {/* Play button */}
        <button
          onClick={(e) => { e.stopPropagation(); onPlay(station); }}
          // Visual affordance only — the card itself is the accessible play control
          tabIndex={-1}
          aria-hidden
          className="card-play-btn absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-xl"
          style={{ background: 'var(--sp-green)' }}
        >
          {isActive && isPlaying ? (
            <Pause size={16} className="text-black" fill="currentColor" />
          ) : (
            <Play size={16} className="text-black ml-0.5" fill="currentColor" />
          )}
        </button>

        {/* Equalizer on active */}
        {isActive && isPlaying && (
          <div className="absolute bottom-3 left-3 flex items-end gap-0.5 h-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="eq-bar w-1 rounded-sm" style={{ height: 4, background: 'var(--sp-green)' }} />
            ))}
          </div>
        )}
      </div>

      {/* Text */}
      <p className="text-sm font-semibold line-clamp-2 leading-snug mb-1 min-h-[2.5em]" style={{ color: isActive ? 'var(--sp-green)' : 'var(--sp-text)' }}>
        {station.name}
      </p>
      <p className="text-xs line-clamp-1 leading-relaxed capitalize" style={{ color: 'var(--sp-muted)' }}>
        {station.tags
          ? station.tags.split(',').slice(0, 2).map(t => t.trim()).filter(Boolean).join(', ')
          : station.country || 'Radio Station'}
      </p>
    </div>
  );
}

// Memoized: the grid can hold hundreds of cards, and App re-renders on every
// player change (volume, loading, play/pause). Callbacks must be stable.
export default memo(StationCard);
