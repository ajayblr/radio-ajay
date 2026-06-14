import { Home, Heart, Globe, Search, X } from 'lucide-react';
import type { Tab } from '../types';

interface Props {
  activeTab: Tab;
  onTab: (t: Tab) => void;
  selectedCountry: string | null;
  favoriteCountry: string | null;
  onSelectFavoriteCountry: () => void;
  searchOpen: boolean;
  onToggleSearch: () => void;
}

export default function BottomNav({
  activeTab, onTab, selectedCountry, favoriteCountry, onSelectFavoriteCountry, searchOpen, onToggleSearch,
}: Props) {
  const homeActive = activeTab === 'all' && !selectedCountry && !searchOpen;
  const countryActive = activeTab === 'all' && !!favoriteCountry && selectedCountry === favoriteCountry;

  return (
    <nav className="lg:hidden flex items-center border-t shrink-0"
      style={{ background: 'var(--sp-surface)', borderColor: 'var(--sp-border)' }}>
      <NavItem icon={Home} label="Home" active={homeActive} onClick={() => onTab('all')} fillWhenActive />
      <NavItem icon={Heart} label="Liked" active={activeTab === 'favorites'} onClick={() => onTab('favorites')} fillWhenActive />
      {favoriteCountry && (
        <NavItem icon={Globe} label={favoriteCountry} active={countryActive} onClick={onSelectFavoriteCountry} />
      )}
      <NavItem icon={searchOpen ? X : Search} label="Search" active={searchOpen} onClick={onToggleSearch} />
    </nav>
  );
}

function NavItem({ icon: Icon, label, active, onClick, fillWhenActive }: {
  icon: React.ElementType; label: string; active: boolean; onClick: () => void; fillWhenActive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-1 py-2.5 px-1 min-w-0 transition-colors"
      style={{ color: active ? 'var(--sp-text)' : 'var(--sp-subtle)' }}
    >
      <Icon size={20} fill={fillWhenActive && active ? 'currentColor' : 'none'}
        style={{ color: active ? 'var(--sp-green)' : undefined }} />
      <span className="text-[10px] font-medium truncate max-w-full">{label}</span>
    </button>
  );
}
