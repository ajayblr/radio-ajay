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
import { useRecent } from './hooks/useRecent';
import { useTheme } from './hooks/useTheme';
import { useCarEnvironment } from './hooks/useCarEnvironment';
import { useNotifications } from './hooks/useNotifications';
import { startSession, recordAppPlay } from './lib/firebaseAnalytics';
import {
  searchStations,
  getStations,
  getStats,
  getCountries,
  getTags,
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
  const { recent, addRecent } = useRecent();

  const { isCarEnvironment } = useCarEnvironment();
  const { notifications, unreadCount, readIds, markAllRead } = useNotifications();
  const [carModeExited, setCarModeExited] = useState(false);
  const carMode = isCarEnvironment && !carModeExited;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('radio_favorites') || '[]');
      return saved.length > 0 ? 'favorites' : 'all';
    } catch {
      return 'all';
    }
  });
  const [activeSection, setActiveSection] = useState<SidebarSection | null>(null);
  const [search, setSearch] = useState('');

  const [stations, setStations] = useState<Station[]>([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState<number | undefined>();
  const offsetRef = useRef(0);

  const [countries, setCountries] = useState<{ name: string; stationcount: number }[]>([]);
  const [genres, setGenres] = useState<{ name: string; stationcount: number }[]>([]);

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  useEffect(() => {
    getCountries().then(setCountries).catch(() => {});
    getTags(80).then(setGenres).catch(() => {});
    getStats().then((s) => setTotalCount(s.stations)).catch(() => {});
  }, []);

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
  }, [search, selectedCountry, selectedGenre]);

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
    }
  }, [playerState.station, play, togglePlay, addRecent]);

  const handleSection = useCallback((section: SidebarSection) => {
    setActiveSection((prev) => prev === section ? null : section);
    if (section === 'favorites') { setActiveTab('all'); }
    else if (section === 'recent') { setActiveTab('all'); }
    else setActiveTab('all');
  }, []);

  const handleTab = useCallback((tab: Tab) => {
    setActiveTab(tab);
    setActiveSection(null);
    setSelectedCountry(null);
    
    setSelectedGenre(null);
    setSearch('');
  }, []);

  const handleCountry = useCallback((country: string) => {
    setSelectedCountry(country); setSelectedGenre(null);
    setSearch(''); setActiveTab('all'); setActiveSection(null); setSidebarOpen(false);
  }, []);

  const handleGenre = useCallback((genre: string) => {
    setSelectedGenre(genre); setSelectedCountry(null); 
    setSearch(''); setActiveTab('all'); setActiveSection(null); setSidebarOpen(false);
  }, []);

  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    if (v) {
      setSelectedCountry(null); setSelectedGenre(null);
      setActiveTab('all'); setActiveSection(null);
    }
  }, []);

  const displayedStations = useMemo(() => {
    if (activeTab === 'favorites') return favorites;
    if (activeTab === 'recent') return recent;
    return stations;
  }, [activeTab, favorites, recent, stations]);

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
    if (search) return `Search results for "${search}"`;
    if (selectedCountry) return selectedCountry;
    if (selectedGenre) return selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1);
    return greeting();
  }, [activeTab, search, selectedCountry, selectedGenre]);

  // Show search input on mobile when in the all-stations view (keeps it visible while typing).
  const showMobileSearch = activeTab === 'all' && !selectedCountry && !selectedGenre;

  const isGridLoading = activeTab === 'all' && stationsLoading;
  const showHasMore = activeTab === 'all' ? hasMore : false;
  const showLoadingMore = activeTab === 'all' ? loadingMore : false;
  const displayTotal = activeTab === 'all' && !search && !selectedCountry && !selectedGenre
    ? totalCount : undefined;

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
          onFavorite={() => playerState.station && toggleFavorite(playerState.station)}
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
              {/* Mobile: search input replaces the greeting; tabs like Favorites/Recent still show their title */}
              {showMobileSearch ? (
                <div className="relative sm:hidden mb-0">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--sp-subtle)' }} />
                  <input
                    type="text"
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
              ) : (
                <h1 className="sm:hidden text-2xl font-bold text-white">{gridTitle}</h1>
              )}
              {/* sm+: always show title */}
              <h1 className="hidden sm:block text-2xl sm:text-3xl font-bold text-white">{gridTitle}</h1>
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
            onFavorite={toggleFavorite}
            totalCount={displayTotal}
          />
        </main>
      </div>

      {/* Bottom nav â€” mobile only */}
      <BottomNav
        activeTab={activeTab}
        onTab={handleTab}
        search={search}
        onOpenSidebar={() => setSidebarOpen(true)}
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
        onFavorite={() => playerState.station && toggleFavorite(playerState.station)}
      />
    </div>
  );
}
