import { useRef, useState, useCallback, useEffect } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import type { Station, PlayerState } from '../types';
import { recordClick } from '../api/radioBrowser';

interface NativeAudioPlugin {
  play(options: { url: string; stationName: string }): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
}

const NativeAudio = registerPlugin<NativeAudioPlugin>('Audio');
const isAndroid = Capacitor.getPlatform() === 'android';

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

  const handlersRef = useRef({ togglePlay: () => {}, next: () => {}, prev: () => {} });

  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = state.volume;

    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => handlersRef.current.togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => handlersRef.current.togglePlay());
      navigator.mediaSession.setActionHandler('nexttrack', () => handlersRef.current.next());
      navigator.mediaSession.setActionHandler('previoustrack', () => handlersRef.current.prev());
      // Chrome on Android ignores null for seek handlers on many versions and shows ±10s
      // buttons based on the audio element's seekable range. Wire them to prev/next instead
      // so the buttons are at least functional as station navigation.
      navigator.mediaSession.setActionHandler('seekbackward', () => handlersRef.current.prev());
      navigator.mediaSession.setActionHandler('seekforward', () => handlersRef.current.next());
    }

    return () => {
      audio.pause();
      audio.src = '';
      if (isAndroid) NativeAudio.stop().catch(() => {});
    };
  }, []);

  const play = useCallback((station: Station) => {
    const url = station.url_resolved || station.url;

    setLoading(true);
    setError(null);
    setState((s) => ({ ...s, station, isPlaying: true }));
    recordClick(station.stationuuid);
    updateMediaSession(station, true);

    if (isAndroid) {
      NativeAudio.play({ url, stationName: station.name })
        .then(() => {
          // Give the MediaPlayer a few seconds to buffer then clear the spinner
          setTimeout(() => setLoading(false), 3000);
        })
        .catch(() => {
          setLoading(false);
          setError('Stream unavailable. Try another station.');
          setState((s) => ({ ...s, isPlaying: false }));
        });
    } else {
      const audio = audioRef.current;
      audio.pause();
      audio.src = url;

      const onPlaying = () => setLoading(false);
      const onError = () => {
        setLoading(false);
        setError('Stream unavailable. Try another station.');
        setState((s) => ({ ...s, isPlaying: false }));
      };
      audio.addEventListener('playing', onPlaying, { once: true });
      audio.addEventListener('error', onError, { once: true });
      audio.play().catch(() => {});
    }
  }, []);

  const togglePlay = useCallback(() => {
    setState((prev) => {
      if (prev.isPlaying) {
        if (isAndroid) {
          NativeAudio.pause().catch(() => {});
        } else {
          audioRef.current.pause();
        }
        if (prev.station) updateMediaSession(prev.station, false);
        return { ...prev, isPlaying: false };
      } else if (prev.station) {
        if (isAndroid) {
          NativeAudio.resume().catch(() => {});
        } else {
          audioRef.current.play().catch(() => {});
        }
        updateMediaSession(prev.station, true);
        return { ...prev, isPlaying: true };
      }
      return prev;
    });
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (!isAndroid) audioRef.current.volume = volume;
    setState((s) => ({ ...s, volume, isMuted: volume === 0 }));
  }, []);

  const toggleMute = useCallback(() => {
    setState((prev) => {
      if (!isAndroid) audioRef.current.muted = !prev.isMuted;
      return { ...prev, isMuted: !prev.isMuted };
    });
  }, []);

  const registerMediaSessionHandlers = useCallback((next: () => void, prev: () => void) => {
    handlersRef.current.next = next;
    handlersRef.current.prev = prev;
    handlersRef.current.togglePlay = togglePlay;
  }, [togglePlay]);

  return { state, loading, error, play, togglePlay, setVolume, toggleMute, registerMediaSessionHandlers };
}
