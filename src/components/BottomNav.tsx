import { Home, Heart, Clock, Search } from 'lucide-react';
import type { Tab } from '../types';

interface Props {
  activeTab: Tab;
  onTab: (t: Tab) => void;
  search: string;
  onOpenSidebar: () => void;
}

const tabs = [
  { id: 'all' as Tab, icon: Home, label: 'Home' },
  { id: 'favorites' as Tab, icon: Heart, label: 'Liked' },
  { id: 'recent' as Tab, icon: Clock, label: 'Recent' },
];

export default function BottomNav({ activeTab, onTab, onOpenSidebar }: Props) {
  return (
    <nav className="sm:hidden flex items-center border-t shrink-0"
      style={{ background: 'var(--sp-surface)', borderColor: 'var(--sp-border)' }}>
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onTab(id)}
          className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors"
          style={{ color: activeTab === id ? 'var(--sp-text)' : 'var(--sp-subtle)' }}
        >
          <Icon size={20} fill={activeTab === id ? 'currentColor' : 'none'}
            style={{ color: activeTab === id ? 'var(--sp-green)' : undefined }} />
          <span className="text-[10px] font-medium">{label}</span>
        </button>
      ))}
      <button
        onClick={onOpenSidebar}
        className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors"
        style={{ color: 'var(--sp-subtle)' }}
      >
        <Search size={20} />
        <span className="text-[10px] font-medium">Browse</span>
      </button>
    </nav>
  );
}
