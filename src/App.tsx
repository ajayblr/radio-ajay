import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StationGrid from './components/StationGrid';
import Player from './components/Player';
import BottomNav from './components/BottomNav';
import { usePlayer } from './hooks/usePlayer';
import { useFavorites } from './hooks/useFavorites';
import { useRecent } from './hooks/useRecent';
import { useTheme } from './hooks/useTheme';
import {
  searchStations,
  getStations,
  getStats,
  getCountries,
  getTags,
  getIndiaStates,
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
  const { state: playerState, loading: playerLoading, error: playerError, play, togglePlay, setVolume, toggleMute } = usePlayer();
  const { favorites, toggle: toggleFavorite, isFavorite } = useFavorites();
  const { recent, addRecent } = useRecent();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [activeSection, setActiveSection] = useState<SidebarSection | null>(null);
  const [search, setSearch] = useState('');

  const [stations, setStations] = useState<Station[]>([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState<number | undefined>();
  const offsetRef = useRef(0);

  const [countries, setCountries] = useState<{ name: string; stationcount: number }[]>([]);
  const [states, setStates] = useState<{ name: string; stationcount: number }[]>([]);
  const [genres, setGenres] = useState<{ name: string; stationcount: number }[]>([]);

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  useEffect(() => {
    getCountries().then(setCountries).catch(() => {});
    getIndiaStates().then(setStates).catch(() => {});
    getTags(80).then(setGenres).catch(() => {});
    getStats().then((s) => setTotalCount(s.stations)).catch(() => {});
  }, []);

  const buildParams = useCallback(() => ({
    name: search.trim() || undefined,
    country: selectedCountry || undefined,
    state: selectedState || undefined,
    tag: selectedGenre || undefined,
  }), [search, selectedCountry, selectedState, selectedGenre]);

  useEffect(() => {
    const params = buildParams();
    const filterKey = JSON.stringify(params);
    offsetRef.current = 0;
    setStations([]);
    setHasMore(true);
    setStationsLoading(true);

    const isFiltered = params.name || params.country || params.state || params.tag;

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
  }, [search, selectedCountry, selectedState, selectedGenre]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || stationsLoading) return;
    setLoadingMore(true);
    const params = buildParams();
    const isFiltered = params.name || params.country || params.state || params.tag;
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
    setSelectedState(null);
    setSelectedGenre(null);
    setSearch('');
  }, []);

  const handleCountry = useCallback((country: string) => {
    setSelectedCountry(country); setSelectedState(null); setSelectedGenre(null);
    setSearch(''); setActiveTab('all'); setActiveSection(null); setSidebarOpen(false);
  }, []);

  const handleState = useCallback((state: string) => {
    setSelectedState(state); setSelectedCountry(null); setSelectedGenre(null);
    setSearch(''); setActiveTab('all'); setActiveSection(null); setSidebarOpen(false);
  }, []);

  const handleGenre = useCallback((genre: string) => {
    setSelectedGenre(genre); setSelectedCountry(null); setSelectedState(null);
    setSearch(''); setActiveTab('all'); setActiveSection(null); setSidebarOpen(false);
  }, []);

  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    if (v) {
      setSelectedCountry(null); setSelectedState(null); setSelectedGenre(null);
      setActiveTab('all'); setActiveSection(null);
    }
  }, []);

  const displayedStations = useMemo(() => {
    if (activeTab === 'favorites') return favorites;
    if (activeTab === 'recent') return recent;
    return stations;
  }, [activeTab, favorites, recent, stations]);

  const gridTitle = useMemo(() => {
    if (activeTab === 'favorites') return 'Liked Stations';
    if (activeTab === 'recent') return 'Recently Played';
    if (search) return `Search results for "${search}"`;
    if (selectedCountry) return selectedCountry;
    if (selectedState) return `${selectedState}, India`;
    if (selectedGenre) return selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1);
    return greeting();
  }, [activeTab, search, selectedCountry, selectedState, selectedGenre]);

  const isGridLoading = activeTab === 'all' && stationsLoading;
  const showHasMore = activeTab === 'all' ? hasMore : false;
  const showLoadingMore = activeTab === 'all' ? loadingMore : false;
  const displayTotal = activeTab === 'all' && !search && !selectedCountry && !selectedState && !selectedGenre
    ? totalCount : undefined;

  // Derive a bg accent color for the top gradient from active station or section
  const accentBg = selectedCountry || selectedState || selectedGenre
    ? '#1a3a2a'
    : activeTab === 'favorites'
    ? '#3a1a2a'
    : '#1a1a3a';

  // Close sidebar when a filter is selected on mobile
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--sp-bg)' }}>
      <div className="flex flex-1 min-h-0 gap-0 lg:gap-2 lg:p-2">

        <Sidebar
          open={sidebarOpen}
          onClose={closeSidebar}
          activeSection={activeSection}
          onSection={handleSection}
          activeTab={activeTab}
          onTab={handleTab}
          countries={countries}
          states={states}
          genres={genres}
          selectedCountry={selectedCountry}
          selectedState={selectedState}
          selectedGenre={selectedGenre}
          onCountry={handleCountry}
          onState={handleState}
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
            />

            <div className="px-4 sm:px-6 pb-4 sm:pb-5">
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
            onFavorite={toggleFavorite}
            totalCount={displayTotal}
          />
        </main>
      </div>

      {/* Bottom nav — mobile only */}
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
        onVolume={setVolume}
        onToggleMute={toggleMute}
        isFavorite={playerState.station ? isFavorite(playerState.station.stationuuid) : false}
        onFavorite={() => playerState.station && toggleFavorite(playerState.station)}
      />
    </div>
  );
}
