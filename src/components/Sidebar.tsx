import { Heart, Clock, Globe, Music, Home, Library, ChevronDown, Plus } from 'lucide-react';
import Logo from './Logo';
import type { SidebarSection, Tab } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  activeSection: SidebarSection | null;
  onSection: (s: SidebarSection) => void;
  activeTab: Tab;
  onTab: (t: Tab) => void;
  countries: { name: string; stationcount: number }[];
  genres: { name: string; stationcount: number }[];
  selectedCountry: string | null;
  selectedGenre: string | null;
  onCountry: (c: string) => void;
  onGenre: (g: string) => void;
}

const browseItems = [
  { id: 'country' as SidebarSection, icon: Globe, label: 'By Country' },
  { id: 'genre' as SidebarSection, icon: Music, label: 'By Genre' },
];

export default function Sidebar({
  open, onClose,
  activeSection, onSection, activeTab, onTab,
  countries, genres,
  selectedCountry, selectedGenre,
  onCountry, onGenre,
}: Props) {
  return (
    <>
      {/* Mobile overlay backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72
        lg:relative lg:z-auto lg:w-60 lg:translate-x-0
        flex flex-col gap-2 p-2 overflow-hidden
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ background: 'var(--sp-bg)' }}>

        {/* Top nav block */}
        <div className="rounded-lg px-3 py-4 flex flex-col gap-1 shrink-0" style={{ background: 'var(--sp-surface)' }}>
          <div className="px-1 mb-3">
            <Logo size={36} variant="full" />
          </div>
          <NavBtn icon={Home} label="Home" active={activeTab === 'all' && !activeSection} onClick={() => { onTab('all'); onClose(); }} />
        </div>

        {/* Library block */}
        <div className="rounded-lg flex flex-col flex-1 overflow-hidden min-h-0" style={{ background: 'var(--sp-surface)' }}>
          <div className={`flex items-center justify-between px-4 pt-4 pb-2 shrink-0 ${activeSection ? 'hidden lg:flex' : ''}`}>
            <button className="flex items-center gap-3 text-sm font-semibold hover:text-white transition-colors" style={{ color: 'var(--sp-muted)' }}>
              <Library size={22} />
              Your Library
            </button>
            <button className="p-1 rounded-full hover:bg-white/10 transition-colors" style={{ color: 'var(--sp-muted)' }}>
              <Plus size={18} />
            </button>
          </div>

          {/* Fixed items — hidden on mobile when a browse section is open to maximise list space */}
          <div className={`shrink-0 px-2 pt-0 pb-1 space-y-0.5 ${activeSection ? 'hidden lg:block' : ''}`}>
            <LibBtn icon={Heart} label="Favourite" sub="Playlist" active={activeTab === 'favorites'} onClick={() => { onTab('favorites'); onClose(); }} />
            <LibBtn icon={Clock} label="Recently Played" sub="Stations" active={activeTab === 'recent'} onClick={() => { onTab('recent'); onClose(); }} />
            <div className="h-px my-2" style={{ background: 'var(--sp-border)' }} />
            <p className="text-xs font-bold uppercase tracking-widest px-2 py-1" style={{ color: 'var(--sp-subtle)' }}>Browse</p>
          </div>

          {/* Browse items — each section expands to fill remaining space when open */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 px-2 pb-2">
            {browseItems.map(({ id, icon: Icon, label }) => {
              const isOpen = activeSection === id;
              const isSelected =
                (id === 'country' && selectedCountry) ||
                (id === 'genre' && selectedGenre);
              return (
                <div key={id} className={`flex flex-col min-h-0 ${isOpen ? 'flex-1 overflow-hidden' : 'shrink-0'}`}>
                  <button
                    onClick={() => onSection(id)}
                    className="w-full flex items-center justify-between gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors shrink-0"
                    style={{ color: isOpen || isSelected ? 'var(--sp-text)' : 'var(--sp-muted)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--sp-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span className="flex items-center gap-3"><Icon size={16} />{label}</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--sp-subtle)' }} />
                  </button>
                  {isOpen && id === 'country' && <SubList items={countries} selected={selectedCountry} onSelect={onCountry} />}
                  {isOpen && id === 'genre' && <SubList items={genres} selected={selectedGenre} onSelect={onGenre} capitalize />}
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}

function NavBtn({ icon: Icon, label, active, onClick }: { icon: React.ElementType; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 px-1 py-2 rounded-md text-sm font-semibold transition-colors w-full text-left"
      style={{ color: active ? 'var(--sp-text)' : 'var(--sp-muted)' }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--sp-text)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--sp-muted)'; }}
    >
      <Icon size={24} />
      {label}
    </button>
  );
}

function LibBtn({ icon: Icon, label, sub, active, onClick }: {
  icon: React.ElementType; label: string; sub: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-2 py-2 rounded-md transition-colors text-left"
      style={{ background: active ? 'var(--sp-elevated)' : 'transparent' }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--sp-elevated)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = active ? 'var(--sp-elevated)' : 'transparent'; }}
    >
      <div className="w-10 h-10 rounded flex items-center justify-center shrink-0"
        style={{ background: active ? 'var(--sp-green)' : 'var(--sp-elevated)' }}>
        <Icon size={18} className={active ? 'text-black' : ''} style={{ color: active ? undefined : 'var(--sp-muted)' }} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate text-white">{label}</p>
        <p className="text-xs truncate" style={{ color: 'var(--sp-muted)' }}>{sub}</p>
      </div>
    </button>
  );
}

function SubList({ items, selected, onSelect, capitalize }: {
  items: { name: string; stationcount: number }[];
  selected: string | null;
  onSelect: (v: string) => void;
  capitalize?: boolean;
}) {
  return (
    <ul className="ml-4 mt-0.5 mb-1 flex-1 overflow-y-auto min-h-0 space-y-0.5">
      {items.map((item) => (
        <li key={item.name}>
          <button
            onClick={() => onSelect(item.name)}
            className={`w-full text-left text-xs px-3 py-1.5 rounded-md transition-colors ${capitalize ? 'capitalize' : ''}`}
            style={{ color: selected === item.name ? 'var(--sp-green)' : 'var(--sp-muted)', fontWeight: selected === item.name ? 600 : 400 }}
            onMouseEnter={(e) => { if (selected !== item.name) e.currentTarget.style.color = 'var(--sp-text)'; }}
            onMouseLeave={(e) => { if (selected !== item.name) e.currentTarget.style.color = 'var(--sp-muted)'; }}
          >
            {item.name}<span className="ml-1 opacity-40">({item.stationcount})</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
