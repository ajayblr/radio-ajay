import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StationGrid from './components/StationGrid';
import Player from './components/Player';
import BottomNav from './components/BottomNav';
import CarView from './components/CarView';
import { usePlayer } from './hooks/usePlayer';
import { useFavorites } from './hooks/useFavorites';
import { useFavoriteCountry, getFavoriteCountry } from './hooks/useFavoriteCountry';
import { useRecent } from './hooks/useRecent';
import { useTheme } from './hooks/useTheme';
import { useCarEnvironment } from './hooks/useCarEnvironment';
import { useNotifications } from './hooks/useNotifications';
import { useGeoCountry } from './hooks/useGeoCountry';
import { startSession, recordAppPlay } from './lib/firebaseAnalytics';
import { logAnalyticsEvent } from './lib/firebase';
import {
  searchStations,
  getStations,
  getStats,
  getCountries,
  getTags,
  getTopStations,
} from './api/radioBrowser';
import type { Station, Tab, SidebarSection } from './types';

const PAGE_SIZE = 100;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function App() {
  const { dark, toggle: toggleTheme } = useTheme();
  const { state: playerState, loading: playerLoading, error: playerError, play, togglePlay, setVolume, toggleMute, registerMediaSessionHandlers } = usePlayer();
  const { favorites, toggle: toggleFavorite, isFavorite } = useFavorites();
  const { favoriteCountry, toggle: toggleFavoriteCountry } = useFavoriteCountry();
  const { recent, addRecent } = useRecent();

  const { isCarEnvironment } = useCarEnvironment();
  const { notifications, unreadCount, readIds, markAllRead } = useNotifications();
  const geoCountry = useGeoCountry();
  const [carModeExited, setCarModeExited] = useState(false);
  const carMode = isCarEnvironment && !carModeExited;

  const hasFavorites = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('radio_favorites') || '[]');
      return saved.length > 0;
    } catch {
      return false;
    }
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Default view: favourite country > favourite stations > all stations
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (getFavoriteCountry()) return 'all';
    return hasFavorites() ? 'favorites' : 'all';
  });
  const [activeSection, setActiveSection] = useState<SidebarSection | null>(null);
  const [search, setSearch] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const [stations, setStations] = useState<Station[]>([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState<number | undefined>();
  const offsetRef = useRef(0);

  const [countries, setCountries] = useState<{ name: string; stationcount: number }[]>([]);
  const [genres, setGenres] = useState<{ name: string; stationcount: number }[]>([]);

  const [selectedCountry, setSelectedCountry] = useState<string | null>(() => getFavoriteCountry());
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const [topStations, setTopStations] = useState<Station[]>([]);
  const [topLoading, setTopLoading] = useState(false);

  const [reloadNonce, setReloadNonce] = useState(0);
  const retry = useCallback(() => setReloadNonce((n) => n + 1), []);

  useEffect(() => {
    getCountries().then(setCountries).catch(() => {});
    getTags(80).then(setGenres).catch(() => {});
    getStats().then((s) => setTotalCount(s.stations)).catch(() => {});
  }, [reloadNonce]);

  // Fetch the top-played stations once, the first time that tab is opened.
  useEffect(() => {
    if (activeTab !== 'top' || topStations.length > 0) return;
    setTopLoading(true);
    getTopStations(20)
      .then(setTopStations)
      .catch(() => setTopStations([]))
      .finally(() => setTopLoading(false));
  }, [activeTab, topStations.length]);

  const buildParams = useCallback(() => ({
    name: search.trim() || undefined,
    country: selectedCountry || undefined,
    tag: selectedGenre || undefined,
  }), [search, selectedCountry, selectedGenre]);

  useEffect(() => {
    const params = buildParams();
    const filterKey = JSON.stringify(params);
    offsetRef.current = 0;
    setStations([]);
    setHasMore(true);
    setStationsLoading(true);

    const isFiltered = params.name || params.country || params.tag;

    const timer = setTimeout(async () => {
      if (JSON.stringify(buildParams()) !== filterKey) return;
      try {
        const data = isFiltered
          ? await searchStations({ ...params, limit: PAGE_SIZE, offset: 0 })
          : await getStations({ limit: PAGE_SIZE, offset: 0 });
        if (JSON.stringify(buildParams()) !== filterKey) return;
        setStations(data);
        offsetRef.current = data.length;
        setHasMore(data.length === PAGE_SIZE);
      } catch {
        setStations([]);
        setHasMore(false);
      } finally {
        setStationsLoading(false);
      }
    }, params.name ? 400 : 0);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedCountry, selectedGenre, reloadNonce]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || stationsLoading) return;
    setLoadingMore(true);
    const params = buildParams();
    const isFiltered = params.name || params.country || params.tag;
    const offset = offsetRef.current;
    try {
      const data = isFiltered
        ? await searchStations({ ...params, limit: PAGE_SIZE, offset })
        : await getStations({ limit: PAGE_SIZE, offset });
      setStations((prev) => {
        const seen = new Set(prev.map((s) => s.stationuuid));
        return [...prev, ...data.filter((s) => !seen.has(s.stationuuid))];
      });
      offsetRef.current = offset + data.length;
      setHasMore(data.length === PAGE_SIZE);
    } catch { /* silent */ } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, stationsLoading, buildParams]);

  const handlePlay = useCallback((station: Station) => {
    if (playerState.station?.stationuuid === station.stationuuid) {
      togglePlay();
    } else {
      play(station);
      addRecent(station);
      recordAppPlay(station);
      logAnalyticsEvent('play_station', {
        station_name: station.name,
        country: station.country,
        genre: station.tags,
      });
    }
  }, [playerState.station, play, togglePlay, addRecent]);

  const handleFavorite = useCallback((station: Station) => {
    const willBeFavorite = !isFavorite(station.stationuuid);
    toggleFavorite(station);
    logAnalyticsEvent(willBeFavorite ? 'add_to_favorites' : 'remove_from_favorites', {
      station_name: station.name,
      country: station.country,
    });
  }, [toggleFavorite, isFavorite]);

  const handleSection = useCallback((section: SidebarSection) => {
    setActiveSection((prev) => prev === section ? null : section);
    if (section === 'favorites') { setActiveTab('all'); }
    else if (section === 'recent') { setActiveTab('all'); }
    else setActiveTab('all');
    logAnalyticsEvent('screen_view', { firebase_screen: section });
  }, []);

  const handleTab = useCallback((tab: Tab) => {
    setActiveTab(tab);
    setActiveSection(null);
    setSelectedCountry(null);

    setSelectedGenre(null);
    setSearch('');
    setMobileSearchOpen(false);
    logAnalyticsEvent('screen_view', { firebase_screen: tab });
  }, []);

  const handleCountry = useCallback((country: string) => {
    setSelectedCountry(country); setSelectedGenre(null);
    setSearch(''); setActiveTab('all'); setActiveSection(null); setSidebarOpen(false);
    setMobileSearchOpen(false);
    logAnalyticsEvent('screen_view', { firebase_screen: 'country', country });
  }, []);

  const handleToggleFavoriteCountry = useCallback((country: string) => {
    const willBeFavorite = favoriteCountry !== country;
    toggleFavoriteCountry(country);
    if (willBeFavorite) handleCountry(country);
    logAnalyticsEvent(willBeFavorite ? 'set_favorite_country' : 'unset_favorite_country', { country });
  }, [favoriteCountry, toggleFavoriteCountry, handleCountry]);

  const handleGenre = useCallback((genre: string) => {
    setSelectedGenre(genre); setSelectedCountry(null);
    setSearch(''); setActiveTab('all'); setActiveSection(null); setSidebarOpen(false);
    setMobileSearchOpen(false);
    logAnalyticsEvent('screen_view', { firebase_screen: 'genre', genre });
  }, []);

  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    if (v) {
      setSelectedCountry(null); setSelectedGenre(null);
      setActiveTab('all'); setActiveSection(null);
    }
  }, []);

  const toggleMobileSearch = useCallback(() => {
    setMobileSearchOpen((open) => {
      if (open) handleSearch('');
      return !open;
    });
  }, [handleSearch]);

  const displayedStations = useMemo(() => {
    if (activeTab === 'favorites') return favorites;
    if (activeTab === 'recent') return recent;
    if (activeTab === 'top') return topStations;
    return stations;
  }, [activeTab, favorites, recent, topStations, stations]);

  // Refs so next/prev callbacks stay stable and never re-render Player
  const displayedStationsRef = useRef(displayedStations);
  useEffect(() => { displayedStationsRef.current = displayedStations; }, [displayedStations]);
  const currentStationRef = useRef(playerState.station);
  useEffect(() => { currentStationRef.current = playerState.station; }, [playerState.station]);

  const handleNext = useCallback(() => {
    const list = displayedStationsRef.current;
    const current = currentStationRef.current;
    if (!current || !list.length) return;
    const idx = list.findIndex(s => s.stationuuid === current.stationuuid);
    const next = list[(idx + 1) % list.length];
    play(next);
    addRecent(next);
  }, [play, addRecent]);

  const handlePrev = useCallback(() => {
    const list = displayedStationsRef.current;
    const current = currentStationRef.current;
    if (!current || !list.length) return;
    const idx = list.findIndex(s => s.stationuuid === current.stationuuid);
    const prev = list[(idx - 1 + list.length) % list.length];
    play(prev);
    addRecent(prev);
  }, [play, addRecent]);

  // Register next/prev with Media Session so steering-wheel buttons work
  useEffect(() => {
    registerMediaSessionHandlers(handleNext, handlePrev);
  }, [registerMediaSessionHandlers, handleNext, handlePrev]);

  // Start anonymous session tracking (country heartbeat)
  useEffect(() => {
    let cleanup = () => {};
    startSession().then(fn => { cleanup = fn; });
    return () => cleanup();
  }, []);

  const gridTitle = useMemo(() => {
    if (activeTab === 'favorites') return 'Favourite';
    if (activeTab === 'recent') return 'Recently Played';
    if (activeTab === 'top') return 'Top 20';
    if (search) return `Search results for "${search}"`;
    if (selectedCountry) return selectedCountry;
    if (selectedGenre) return selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1);
    return geoCountry ? `${greeting()}, ${geoCountry}` : greeting();
  }, [activeTab, search, selectedCountry, selectedGenre, geoCountry]);

  const isGridLoading = (activeTab === 'all' && stationsLoading) || (activeTab === 'top' && topLoading);
  const showHasMore = activeTab === 'all' ? hasMore : false;
  const showLoadingMore = activeTab === 'all' ? loadingMore : false;

  // Stations-available count for whatever is currently displayed.
  const displayTotal = useMemo(() => {
    if (activeTab === 'favorites') return favorites.length || undefined;
    if (activeTab === 'recent') return recent.length || undefined;
    if (activeTab === 'top') return topStations.length || undefined;
    if (search) return stations.length || undefined;
    if (selectedCountry) return countries.find((c) => c.name === selectedCountry)?.stationcount;
    if (selectedGenre) return genres.find((g) => g.name === selectedGenre)?.stationcount;
    return totalCount;
  }, [activeTab, search, selectedCountry, selectedGenre, favorites.length, recent.length, topStations.length, stations.length, countries, genres, totalCount]);

  // Derive a bg accent color for the top gradient from active station or section
  const accentBg = selectedCountry || selectedGenre
    ? '#1a3a2a'
    : activeTab === 'favorites'
    ? '#3a1a2a'
    : '#1a1a3a';

  // Close sidebar when a filter is selected on mobile
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--sp-bg)' }}>
      {carMode && (
        <CarView
          playerState={playerState}
          loading={playerLoading}
          error={playerError}
          stations={displayedStations}
          isFavorite={isFavorite}
          onPlay={handlePlay}
          onTogglePlay={togglePlay}
          onNext={handleNext}
          onPrev={handlePrev}
          onVolume={setVolume}
          onToggleMute={toggleMute}
          onFavorite={() => playerState.station && handleFavorite(playerState.station)}
          onExitCarMode={() => setCarModeExited(true)}
        />
      )}
      <div className="flex flex-1 min-h-0 gap-0 lg:gap-2 lg:p-2">

        <Sidebar
          open={sidebarOpen}
          onClose={closeSidebar}
          activeSection={activeSection}
          onSection={handleSection}
          activeTab={activeTab}
          onTab={handleTab}
          countries={countries}
          genres={genres}
          selectedCountry={selectedCountry}
          selectedGenre={selectedGenre}
          onCountry={handleCountry}
          onGenre={handleGenre}
          favoriteCountry={favoriteCountry}
          onToggleFavoriteCountry={handleToggleFavoriteCountry}
        />

        {/* Main content */}
        <main className="flex-1 lg:rounded-lg flex flex-col overflow-hidden min-w-0"
          style={{ background: 'var(--sp-surface)' }}>

          {/* Gradient top area */}
          <div className="relative shrink-0" style={{
            background: `linear-gradient(to bottom, ${accentBg} 0%, var(--sp-surface) 100%)`,
          }}>
            <Header
              search={search}
              onSearch={handleSearch}
              onOpenSidebar={() => setSidebarOpen(true)}
              dark={dark}
              onToggleTheme={toggleTheme}
              notifications={notifications}
              unreadCount={unreadCount}
              readIds={readIds}
              onMarkAllRead={markAllRead}
            />

            <div className="px-4 sm:px-6 pb-4 sm:pb-5">
              {/* Mobile: tapping Search in the bottom nav shows this input above the greeting/title */}
              {mobileSearchOpen && (
                <div className="relative lg:hidden mb-3">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--sp-subtle)' }} />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search stations..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 text-sm rounded-full focus:outline-none transition-all"
                    style={{ background: 'var(--sp-elevated)', color: 'var(--sp-text)', border: '1px solid transparent' }}
                    onFocus={(e) => { e.currentTarget.style.border = '1px solid white'; e.currentTarget.style.background = '#3e3e3e'; }}
                    onBlur={(e) => { e.currentTarget.style.border = '1px solid transparent'; e.currentTarget.style.background = 'var(--sp-elevated)'; }}
                  />
                  {search && (
                    <button onClick={() => handleSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-white"
                      style={{ color: 'var(--sp-subtle)' }}>
                      <X size={13} />
                    </button>
                  )}
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{gridTitle}</h1>
              {displayTotal && (
                <p className="text-sm mt-1" style={{ color: 'var(--sp-muted)' }}>
                  {displayTotal.toLocaleString()} stations available
                </p>
              )}
            </div>
          </div>

          {/* Station grid */}
          <StationGrid
            stations={displayedStations}
            loading={isGridLoading}
            loadingMore={showLoadingMore}
            hasMore={showHasMore}
            onLoadMore={loadMore}
            activeStation={playerState.station}
            isPlaying={playerState.isPlaying}
            isFavorite={isFavorite}
            onPlay={handlePlay}
            onFavorite={handleFavorite}
            totalCount={displayTotal}
            onRetry={retry}
          />
        </main>
      </div>

      {/* Bottom nav â€” mobile only */}
      <BottomNav
        activeTab={activeTab}
        onTab={handleTab}
        selectedCountry={selectedCountry}
        favoriteCountry={favoriteCountry}
        onSelectFavoriteCountry={() => favoriteCountry && handleCountry(favoriteCountry)}
        searchOpen={mobileSearchOpen}
        onToggleSearch={toggleMobileSearch}
      />

      {/* Player */}
      <Player
        playerState={playerState}
        loading={playerLoading}
        error={playerError}
        onTogglePlay={togglePlay}
        onNext={handleNext}
        onPrev={handlePrev}
        onVolume={setVolume}
        onToggleMute={toggleMute}
        isFavorite={playerState.station ? isFavorite(playerState.station.stationuuid) : false}
        onFavorite={() => playerState.station && handleFavorite(playerState.station)}
      />
    </div>
  );
}
