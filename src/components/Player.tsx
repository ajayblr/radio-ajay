import { Play, Pause, Volume2, VolumeX, Radio, Loader2, Heart, SkipBack, SkipForward, AlertCircle } from 'lucide-react';
import StationArt from './StationArt';
import type { PlayerState } from '../types';

interface Props {
  playerState: PlayerState;
  loading: boolean;
  error: string | null;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onVolume: (v: number) => void;
  onToggleMute: () => void;
  isFavorite?: boolean;
  onFavorite?: () => void;
}

export default function Player({ playerState, loading, error, onTogglePlay, onNext, onPrev, onVolume, onToggleMute, isFavorite, onFavorite }: Props) {
  const { station, isPlaying, volume, isMuted } = playerState;

  return (
    <div className="border-t shrink-0" style={{
      background: 'var(--sp-surface)',
      borderColor: 'var(--sp-border)',
      // Keep controls clear of the iPhone home indicator / Android gesture bar
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>

      {/* Mobile layout — two rows */}
      <div className="flex sm:hidden flex-col px-3 pt-2 pb-1 gap-1">
        {/* Row 1: artwork + name + heart */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded shrink-0 overflow-hidden" style={{ background: '#333' }}>
            {station
              ? <StationArt station={station} iconSize={14} eager />
              : <div className="w-full h-full flex items-center justify-center"><Radio size={14} style={{ color: 'var(--sp-muted)' }} /></div>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--sp-text)' }}>{station?.name ?? 'No station'}</p>
            <p className="text-xs truncate" style={{ color: 'var(--sp-muted)' }}>
              {error
                ? <span style={{ color: '#f55' }}>Unavailable</span>
                : station ? [station.country, station.codec].filter(Boolean).join(' · ') : 'Select a station'}
            </p>
          </div>
          <button onClick={onFavorite} disabled={!station}
            aria-label={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
            className="shrink-0 w-10 h-10 -mr-2 flex items-center justify-center disabled:opacity-40"
            style={{ color: isFavorite ? 'var(--sp-green)' : 'var(--sp-subtle)' }}>
            <Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Row 2: playback controls */}
        <div className="flex items-center justify-center gap-6 py-1">
          <CtrlBtn icon={SkipBack} onClick={onPrev} label="Previous station" large />
          <button
            onClick={onTogglePlay}
            disabled={!station || !!error}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-40"
            style={{ background: 'var(--sp-text)', color: 'var(--sp-surface)' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" />
              : isPlaying ? <Pause size={16} fill="currentColor" />
              : <Play size={16} fill="currentColor" className="ml-0.5" />}
          </button>
          <CtrlBtn icon={SkipForward} onClick={onNext} label="Next station" large />
        </div>
      </div>

      {/* Tablet / Desktop layout — 3-column Spotify style */}
      <div className="hidden sm:flex items-center h-[90px] px-4 gap-4">

        {/* Left — Station info */}
        <div className="w-[30%] flex items-center gap-3 min-w-0">
          {station ? (
            <>
              <div className="w-14 h-14 rounded-sm overflow-hidden shrink-0 shadow-md" style={{ background: '#333' }}>
                <StationArt station={station} iconSize={20} eager />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--sp-text)' }}>{station.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--sp-muted)' }}>
                  {error
                    ? <span className="flex items-center gap-1" style={{ color: '#f55' }}><AlertCircle size={11} /> Unavailable</span>
                    : [station.country, station.codec].filter(Boolean).join(' · ')}
                </p>
              </div>
              <button onClick={onFavorite} aria-label={isFavorite ? 'Remove from favourites' : 'Add to favourites'} className="ml-2 shrink-0 transition-all hover:scale-110" style={{ color: isFavorite ? 'var(--sp-green)' : 'var(--sp-subtle)' }}>
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
            <CtrlBtn icon={SkipBack} onClick={onPrev} label="Previous station" />
            <button
              onClick={onTogglePlay}
              disabled={!station || !!error}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--sp-text)', color: 'var(--sp-surface)' }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" />
                : isPlaying ? <Pause size={16} fill="currentColor" />
                : <Play size={16} fill="currentColor" className="ml-0.5" />}
            </button>
            <CtrlBtn icon={SkipForward} onClick={onNext} label="Next station" />
          </div>

          {/* Stream status — radio has no timeline, so no fake progress bar */}
          <div className="h-4 flex items-center" aria-live="polite">
            {station && !error && (
              loading ? (
                <span className="text-[10px] font-semibold tracking-wider" style={{ color: 'var(--sp-subtle)' }}>CONNECTING…</span>
              ) : isPlaying ? (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider"
                  style={{ background: 'color-mix(in srgb, var(--sp-green) 18%, transparent)', color: 'var(--sp-green)' }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--sp-green)' }} />
                  LIVE
                </span>
              ) : (
                <span className="text-[10px] font-semibold tracking-wider" style={{ color: 'var(--sp-subtle)' }}>PAUSED</span>
              )
            )}
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
            <button onClick={onToggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'} className="shrink-0 transition-colors hover:text-[var(--sp-text)]" style={{ color: 'var(--sp-muted)' }}>
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <div className="flex-1 range-wrap">
              <input type="range" min={0} max={1} step={0.02} aria-label="Volume"
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolume(Number(e.target.value))} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CtrlBtn({ icon: Icon, onClick, className = '', label, large }: {
  icon: React.ElementType; onClick?: () => void; className?: string; label?: string; large?: boolean;
}) {
  return (
    <button onClick={onClick} aria-label={label}
      className={`transition-colors hover:text-[var(--sp-text)] ${large ? 'w-10 h-10 flex items-center justify-center' : ''} ${className}`}
      style={{ color: 'var(--sp-muted)' }}>
      <Icon size={large ? 20 : 16} />
    </button>
  );
}
