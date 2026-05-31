import { Search, X, Bell, User, Menu, Sun, Moon, Car } from 'lucide-react';

interface Props {
  search: string;
  onSearch: (v: string) => void;
  onOpenSidebar: () => void;
  dark: boolean;
  onToggleTheme: () => void;
  onCarMode: () => void;
}

export default function Header({ search, onSearch, onOpenSidebar, dark, onToggleTheme, onCarMode }: Props) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 shrink-0"
      style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)' }}>

      {/* Hamburger — mobile only */}
      <button
        onClick={onOpenSidebar}
        className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
        style={{ background: 'rgba(0,0,0,0.7)' }}
      >
        <Menu size={17} className="text-white" />
      </button>

      {/* Search bar — grows to fill space on mobile */}
      <div className="relative flex-1 sm:flex-none sm:w-72 md:w-80">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--sp-subtle)' }} />
        <input
          type="text"
          placeholder="Search stations..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full pl-9 pr-8 py-2 sm:py-2.5 text-sm rounded-full focus:outline-none transition-all"
          style={{ background: 'var(--sp-elevated)', color: 'var(--sp-text)', border: '1px solid transparent' }}
          onFocus={(e) => { e.currentTarget.style.border = '1px solid white'; e.currentTarget.style.background = '#3e3e3e'; }}
          onBlur={(e) => { e.currentTarget.style.border = '1px solid transparent'; e.currentTarget.style.background = 'var(--sp-elevated)'; }}
        />
        {search && (
          <button onClick={() => onSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-white"
            style={{ color: 'var(--sp-subtle)' }}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Right controls — hide less important ones on small screens */}
      <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
        {/* Car mode */}
        <button
          onClick={onCarMode}
          title="Car mode"
          className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center transition-all hover:scale-105"
          style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--sp-text)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
        >
          <Car size={15} />
        </button>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105"
          style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--sp-text)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <button className="hidden md:block text-sm font-semibold px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
          style={{ color: 'var(--sp-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--sp-text)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--sp-muted)')}>
          Explore Premium
        </button>
        <button className="hidden sm:flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-full border border-white/20 transition-colors hover:border-white"
          style={{ color: 'var(--sp-text)' }}>
          <Bell size={14} />
        </button>
        <button className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all hover:scale-105"
          style={{ background: '#535353', color: 'var(--sp-text)' }}>
          <User size={16} />
        </button>
      </div>
    </div>
  );
}
