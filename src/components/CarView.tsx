import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Radio, Loader2, Heart, X } from 'lucide-react';
import type { Station, PlayerState } from '../types';

interface Props {
  playerState: PlayerState;
  loading: boolean;
  error: string | null;
  stations: Station[];
  isFavorite: (id: string) => boolean;
  onPlay: (s: Station) => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onVolume: (v: number) => void;
  onToggleMute: () => void;
  onFavorite: () => void;
  onExitCarMode: () => void;
}

export default function CarView({
  playerState, loading, error, stations,
  isFavorite, onPlay, onTogglePlay, onNext, onPrev,
  onVolume, onToggleMute, onFavorite, onExitCarMode,
}: Props) {
  const { station, isPlaying, volume, isMuted } = playerState;
  const displayVolume = isMuted ? 0 : volume;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0a0a0a' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 shrink-0" style={{ borderBottom: '1px solid #222' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--sp-green)' }}>
            <Radio size={16} className="text-black" />
          </div>
          <span className="text-white font-bold text-lg">RadioAjay</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#1a3a1a', color: 'var(--sp-green)' }}>CAR MODE</span>
        </div>
        <button
          onClick={onExitCarMode}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors"
          style={{ background: '#222', color: '#aaa' }}
        >
          <X size={15} /> Exit
        </button>
      </div>

      {/* Main area */}
      <div className="flex flex-1 min-h-0">

        {/* Station list — left panel */}
        <div className="w-72 shrink-0 flex flex-col border-r overflow-hidden" style={{ borderColor: '#1e1e1e' }}>
          <p className="text-xs font-bold uppercase tracking-widest px-5 py-3 shrink-0" style={{ color: '#555' }}>Stations</p>
          <div className="flex-1 overflow-y-auto">
            {stations.map((s) => {
              const active = station?.stationuuid === s.stationuuid;
              return (
                <button
                  key={s.stationuuid}
                  onClick={() => onPlay(s)}
                  className="w-full flex items-center gap-4 px-4 py-4 text-left transition-colors"
                  style={{ background: active ? '#1a2a1a' : 'transparent', borderLeft: active ? '3px solid var(--sp-green)' : '3px solid transparent' }}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: '#1e1e1e' }}>
                    {s.favicon
                      ? <img src={s.favicon} alt={s.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      : <Radio size={18} style={{ color: '#444' }} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: active ? 'var(--sp-green)' : 'white' }}>{s.name}</p>
                    <p className="text-xs truncate mt-0.5" style={{ color: '#555' }}>{s.country}</p>
                  </div>
                  {active && isPlaying && !loading && (
                    <div className="flex items-end gap-0.5 h-4 ml-auto shrink-0">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="eq-bar w-1 rounded-sm" style={{ height: 4, background: 'var(--sp-green)' }} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Now playing — right panel */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8">

          {/* Artwork */}
          <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#1e1e1e' }}>
            {station?.favicon
              ? <img src={station.favicon} alt={station.name} className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              : <div className="w-full h-full flex items-center justify-center"><Radio size={56} style={{ color: '#333' }} /></div>}
          </div>

          {/* Station info */}
          <div className="text-center">
            <p className="text-3xl font-bold text-white truncate max-w-sm">
              {station?.name ?? 'No station selected'}
            </p>
            <p className="text-base mt-2" style={{ color: '#666' }}>
              {error ? <span style={{ color: '#f55' }}>Stream unavailable</span>
                : station ? [station.country, station.codec, station.bitrate ? `${station.bitrate}kbps` : ''].filter(Boolean).join(' · ')
                : 'Select a station from the list'}
            </p>
            {/* Live badge */}
            {isPlaying && !loading && (
              <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-bold" style={{ background: '#3a0a0a', color: '#ff4444' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
              </div>
            )}
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-6">
            <button onClick={onFavorite} className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95"
              style={{ background: '#1e1e1e', color: isFavorite(station?.stationuuid ?? '') ? 'var(--sp-green)' : '#555' }}>
              <Heart size={24} fill={isFavorite(station?.stationuuid ?? '') ? 'currentColor' : 'none'} />
            </button>

            <button onClick={onPrev} className="w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95"
              style={{ background: '#1e1e1e' }}>
              <SkipBack size={32} className="text-white" fill="currentColor" />
            </button>

            <button
              onClick={onTogglePlay}
              disabled={!station || !!error}
              className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 disabled:opacity-40"
              style={{ background: 'var(--sp-green)' }}
            >
              {loading ? <Loader2 size={36} className="animate-spin text-black" />
                : isPlaying ? <Pause size={36} className="text-black" fill="currentColor" />
                : <Play size={36} className="text-black ml-1" fill="currentColor" />}
            </button>

            <button onClick={onNext} className="w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95"
              style={{ background: '#1e1e1e' }}>
              <SkipForward size={32} className="text-white" fill="currentColor" />
            </button>

            <button onClick={onToggleMute} className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95"
              style={{ background: '#1e1e1e', color: isMuted ? '#f55' : '#aaa' }}>
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
          </div>

          {/* Volume slider */}
          <div className="flex items-center gap-4 w-72">
            <VolumeX size={18} style={{ color: '#444' }} />
            <div className="flex-1 relative h-12 flex items-center group cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                onVolume(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)));
              }}>
              {/* Track */}
              <div className="absolute inset-x-0 h-2 rounded-full" style={{ background: '#2a2a2a' }}>
                <div className="h-full rounded-full" style={{ width: `${displayVolume * 100}%`, background: 'var(--sp-green)' }} />
              </div>
              {/* Thumb */}
              <div className="absolute w-6 h-6 rounded-full -translate-x-1/2 pointer-events-none"
                style={{ left: `${displayVolume * 100}%`, background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }} />
              <input type="range" min={0} max={1} step={0.02} value={displayVolume}
                onChange={(e) => onVolume(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                onClick={(e) => e.stopPropagation()} />
            </div>
            <Volume2 size={18} style={{ color: '#444' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
