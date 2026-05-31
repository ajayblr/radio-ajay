import { Play, Pause, Volume2, VolumeX, Radio, Loader2, Heart, Shuffle, SkipBack, SkipForward, Repeat, AlertCircle } from 'lucide-react';
import type { PlayerState } from '../types';

interface Props {
  playerState: PlayerState;
  loading: boolean;
  error: string | null;
  onTogglePlay: () => void;
  onVolume: (v: number) => void;
  onToggleMute: () => void;
  isFavorite?: boolean;
  onFavorite?: () => void;
}

export default function Player({ playerState, loading, error, onTogglePlay, onVolume, onToggleMute, isFavorite, onFavorite }: Props) {
  const { station, isPlaying, volume, isMuted } = playerState;

  return (
    <div className="border-t shrink-0" style={{ background: 'var(--sp-surface)', borderColor: 'var(--sp-border)' }}>

      {/* Mobile layout — single compact row */}
      <div className="flex sm:hidden items-center gap-3 px-3 py-2">
        {/* Artwork */}
        <div className="w-11 h-11 rounded shrink-0 overflow-hidden" style={{ background: '#333' }}>
          {station?.favicon
            ? <img src={station.favicon} alt={station.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            : <div className="w-full h-full flex items-center justify-center"><Radio size={16} style={{ color: 'var(--sp-muted)' }} /></div>}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{station?.name ?? 'No station'}</p>
          <p className="text-xs truncate" style={{ color: 'var(--sp-muted)' }}>
            {error
              ? <span style={{ color: '#f55' }}>Unavailable</span>
              : station ? [station.country, station.codec].filter(Boolean).join(' · ') : 'Select a station'}
          </p>
        </div>

        {/* Heart */}
        <button onClick={onFavorite} className="shrink-0 transition-all" style={{ color: isFavorite ? 'var(--sp-green)' : 'var(--sp-subtle)' }}>
          <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>

        {/* Play/Pause */}
        <button
          onClick={onTogglePlay}
          disabled={!station || !!error}
          className="w-9 h-9 rounded-full flex items-center justify-center text-black shrink-0 transition-all disabled:opacity-40"
          style={{ background: 'var(--sp-text)' }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" />
            : isPlaying ? <Pause size={16} fill="currentColor" />
            : <Play size={16} fill="currentColor" className="ml-0.5" />}
        </button>
      </div>

      {/* Tablet / Desktop layout — 3-column Spotify style */}
      <div className="hidden sm:flex items-center h-[90px] px-4 gap-4">

        {/* Left — Station info */}
        <div className="w-[30%] flex items-center gap-3 min-w-0">
          {station ? (
            <>
              <div className="w-14 h-14 rounded-sm overflow-hidden shrink-0 shadow-md" style={{ background: '#333' }}>
                {station.favicon
                  ? <img src={station.favicon} alt={station.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  : <div className="w-full h-full flex items-center justify-center"><Radio size={20} style={{ color: 'var(--sp-muted)' }} /></div>}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{station.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--sp-muted)' }}>
                  {error
                    ? <span className="flex items-center gap-1" style={{ color: '#f55' }}><AlertCircle size={11} /> Unavailable</span>
                    : [station.country, station.codec].filter(Boolean).join(' · ')}
                </p>
              </div>
              <button onClick={onFavorite} className="ml-2 shrink-0 transition-all hover:scale-110" style={{ color: isFavorite ? 'var(--sp-green)' : 'var(--sp-subtle)' }}>
                <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
            </>
          ) : (
            <p className="text-sm" style={{ color: 'var(--sp-subtle)' }}>No station selected</p>
          )}
        </div>

        {/* Center — Controls */}
        <div className="flex-1 flex flex-col items-center gap-2 max-w-[40%]">
          <div className="flex items-center gap-4 md:gap-6">
            <CtrlBtn icon={Shuffle} className="hidden md:block" />
            <CtrlBtn icon={SkipBack} />
            <button
              onClick={onTogglePlay}
              disabled={!station || !!error}
              className="w-8 h-8 rounded-full flex items-center justify-center text-black transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--sp-text)' }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" />
                : isPlaying ? <Pause size={16} fill="currentColor" />
                : <Play size={16} fill="currentColor" className="ml-0.5" />}
            </button>
            <CtrlBtn icon={SkipForward} />
            <CtrlBtn icon={Repeat} className="hidden md:block" />
          </div>

          {/* Live progress bar */}
          <div className="w-full flex items-center gap-2">
            <span className="text-[10px] w-10 text-right" style={{ color: 'var(--sp-subtle)' }}>
              {station && isPlaying && !loading ? 'LIVE' : ''}
            </span>
            <div className="flex-1 relative h-1 rounded-full" style={{ background: 'var(--sp-elevated)' }}>
              {station && isPlaying && !loading && (
                <div className="absolute left-0 inset-y-0 rounded-full animate-pulse w-full"
                  style={{ background: 'var(--sp-green)' }} />
              )}
            </div>
            <span className="text-[10px] w-10" style={{ color: 'var(--sp-subtle)' }}>∞</span>
          </div>
        </div>

        {/* Right — Volume */}
        <div className="w-[30%] flex items-center justify-end gap-3">
          {isPlaying && !loading && (
            <div className="hidden md:flex items-end gap-0.5 h-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="eq-bar w-0.5 rounded-sm" style={{ height: 4, background: 'var(--sp-green)' }} />
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 w-24 md:w-28 range-wrap">
            <button onClick={onToggleMute} className="shrink-0 transition-colors hover:text-white" style={{ color: 'var(--sp-muted)' }}>
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <div className="flex-1 range-wrap">
              <input type="range" min={0} max={1} step={0.02}
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolume(Number(e.target.value))} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CtrlBtn({ icon: Icon, className = '' }: { icon: React.ElementType; className?: string }) {
  return (
    <button className={`transition-colors hover:text-white ${className}`} style={{ color: 'var(--sp-muted)' }}>
      <Icon size={16} />
    </button>
  );
}
