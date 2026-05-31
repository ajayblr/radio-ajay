import { useRef, useState, useCallback, useEffect } from 'react';
import type { Station, PlayerState } from '../types';
import { recordClick } from '../api/radioBrowser';

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

  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = state.volume;
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
    if (state.isPlaying) {
      audio.pause();
      setState((s) => ({ ...s, isPlaying: false }));
    } else if (state.station) {
      audio.play().catch(() => {});
      setState((s) => ({ ...s, isPlaying: true }));
    }
  }, [state.isPlaying, state.station]);

  const setVolume = useCallback((volume: number) => {
    audioRef.current.volume = volume;
    setState((s) => ({ ...s, volume, isMuted: volume === 0 }));
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    const muted = !state.isMuted;
    audio.muted = muted;
    setState((s) => ({ ...s, isMuted: muted }));
  }, [state.isMuted]);

  return { state, loading, error, play, togglePlay, setVolume, toggleMute };
}
