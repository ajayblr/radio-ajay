import { Play, Pause, Heart, Radio } from 'lucide-react';
import type { Station } from '../types';

interface Props {
  station: Station;
  isPlaying: boolean;
  isActive: boolean;
  isFavorite: boolean;
  onPlay: () => void;
  onFavorite: () => void;
}

const gradients = [
  ['#5038a0', '#3d2b7a'],
  ['#1e3a5f', '#0d2137'],
  ['#5c1d1d', '#3b1212'],
  ['#1a4731', '#0d2b1d'],
  ['#4a2060', '#2d1240'],
  ['#3d4a1e', '#252d10'],
  ['#1d3a4a', '#0d2130'],
  ['#4a3020', '#2d1c10'],
];

function hashColor(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return gradients[h % gradients.length];
}

export default function StationCard({ station, isPlaying, isActive, isFavorite, onPlay, onFavorite }: Props) {
  const [c1, c2] = hashColor(station.stationuuid);

  return (
    <div
      className="station-card group relative flex flex-col rounded-md p-3 cursor-pointer transition-colors duration-200"
      style={{ background: isActive ? 'var(--sp-hover)' : 'var(--sp-surface)' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--sp-elevated)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = isActive ? 'var(--sp-hover)' : 'var(--sp-surface)')}
      onClick={onPlay}
    >
      {/* Artwork */}
      <div className="relative w-full aspect-square rounded-md overflow-hidden mb-4 shadow-lg">
        {station.favicon ? (
          <>
            <img
              src={station.favicon}
              alt={station.name}
              className="card-img w-full h-full object-cover"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
                img.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-full h-full items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
              <Radio size={36} className="text-white/50" />
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
            <Radio size={36} className="text-white/50" />
          </div>
        )}

        {/* Favorite */}
        <button
          onClick={(e) => { e.stopPropagation(); onFavorite(); }}
          className="absolute top-2 right-2 p-1 rounded-full transition-all duration-150"
          style={{ color: isFavorite ? 'var(--sp-green)' : 'white', background: 'rgba(0,0,0,0.4)' }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>

        {/* Play button */}
        <button
          onClick={(e) => { e.stopPropagation(); onPlay(); }}
          className="card-play-btn absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-105"
          style={{ background: 'var(--sp-green)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--sp-green-hov)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--sp-green)')}
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
      <p className="text-sm font-semibold line-clamp-2 leading-snug mb-1" style={{ color: isActive ? 'var(--sp-green)' : 'var(--sp-text)' }}>
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
