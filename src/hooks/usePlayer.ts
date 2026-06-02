import { useRef, useState, useCallback, useEffect } from 'react';
import type { Station, PlayerState } from '../types';
import { recordClick } from '../api/radioBrowser';

function updateMediaSession(station: Station, isPlaying: boolean) {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: station.name,
    artist: [station.country, station.tags?.split(',')[0]].filter(Boolean).join(' · '),
    album: 'RadioAjay',
    artwork: station.favicon
      ? [{ src: station.favicon, sizes: '512x512', type: 'image/png' }]
      : [{ src: '/favicon.svg', sizes: '512x512', type: 'image/svg+xml' }],
  });
  navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
}

export function usePlayer() {
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const [state, setState] = useState<PlayerState>({
    station: null,
    isPlaying: false,
    volume: 0.8,
    isMuted: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expose handlers so Media Session can call them
  const handlersRef = useRef({ togglePlay: () => {}, next: () => {}, prev: () => {} });

  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = state.volume;

    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => handlersRef.current.togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => handlersRef.current.togglePlay());
      navigator.mediaSession.setActionHandler('nexttrack', () => handlersRef.current.next());
      navigator.mediaSession.setActionHandler('previoustrack', () => handlersRef.current.prev());
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
      navigator.mediaSession.setActionHandler('seekto', null);
    }

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const play = useCallback((station: Station) => {
    const audio = audioRef.current;
    audio.pause();
    audio.src = station.url_resolved || station.url;
    setLoading(true);
    setError(null);
    setState((s) => ({ ...s, station, isPlaying: true }));
    recordClick(station.stationuuid);
    updateMediaSession(station, true);

    const onPlaying = () => setLoading(false);
    const onError = () => {
      setLoading(false);
      setError('Stream unavailable. Try another station.');
      setState((s) => ({ ...s, isPlaying: false }));
    };

    audio.addEventListener('playing', onPlaying, { once: true });
    audio.addEventListener('error', onError, { once: true });
    audio.play().catch(() => {});
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    setState((prev) => {
      if (prev.isPlaying) {
        audio.pause();
        if (prev.station) updateMediaSession(prev.station, false);
        return { ...prev, isPlaying: false };
      } else if (prev.station) {
        audio.play().catch(() => {});
        updateMediaSession(prev.station, true);
        return { ...prev, isPlaying: true };
      }
      return prev;
    });
  }, []);

  const setVolume = useCallback((volume: number) => {
    audioRef.current.volume = volume;
    setState((s) => ({ ...s, volume, isMuted: volume === 0 }));
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    setState((prev) => {
      audio.muted = !prev.isMuted;
      return { ...prev, isMuted: !prev.isMuted };
    });
  }, []);

  // Let App wire up next/prev so Media Session steering-wheel buttons work
  const registerMediaSessionHandlers = useCallback((next: () => void, prev: () => void) => {
    handlersRef.current.next = next;
    handlersRef.current.prev = prev;
    handlersRef.current.togglePlay = togglePlay;
  }, [togglePlay]);

  return { state, loading, error, play, togglePlay, setVolume, toggleMute, registerMediaSessionHandlers };
}
