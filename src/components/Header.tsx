import { useState } from 'react';
import { Search, X, Bell, User, Menu, Sun, Moon } from 'lucide-react';
import NotificationPanel from './NotificationPanel';
import type { AppNotification } from '../hooks/useNotifications';

interface Props {
  search: string;
  onSearch: (v: string) => void;
  onOpenSidebar: () => void;
  dark: boolean;
  onToggleTheme: () => void;
  notifications: AppNotification[];
  unreadCount: number;
  readIds: Set<string>;
  onMarkAllRead: () => void;
  isAdmin: boolean;
  onUserClick: () => void;
}

export default function Header({
  search, onSearch, onOpenSidebar, dark, onToggleTheme,
  notifications, unreadCount, readIds, onMarkAllRead,
  isAdmin, onUserClick,
}: Props) {
  const [panelOpen, setPanelOpen] = useState(false);

  function openPanel() {
    setPanelOpen(true);
    if (unreadCount > 0) onMarkAllRead();
  }

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

      {/* Search bar — hidden on mobile (search lives in the gradient area there) */}
      <div className="hidden sm:relative sm:block sm:flex-none sm:w-72 md:w-80">
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

      {/* Right controls */}
      <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">

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

        {/* Bell — highlights when unread notifications exist */}
        <div className="relative">
          <button
            onClick={openPanel}
            title="Notifications"
            className="flex w-8 h-8 rounded-full items-center justify-center transition-all hover:scale-105"
            style={{
              background: unreadCount > 0 ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.1)',
              color: unreadCount > 0 ? '#c084fc' : 'var(--sp-text)',
              border: unreadCount > 0 ? '1px solid rgba(168,85,247,0.55)' : '1px solid transparent',
            }}
          >
            <Bell size={15} />
          </button>

          {/* Unread badge */}
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full text-[10px] font-bold flex items-center justify-center text-white pointer-events-none"
              style={{ background: '#a855f7' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}

          {/* Notification panel */}
          {panelOpen && (
            <NotificationPanel
              notifications={notifications}
              readIds={readIds}
              onMarkAllRead={onMarkAllRead}
              onClose={() => setPanelOpen(false)}
            />
          )}
        </div>

        {/* User / Admin button */}
        <button
          onClick={onUserClick}
          title={isAdmin ? 'Open Admin Panel' : 'Admin Login'}
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all hover:scale-105"
          style={{
            background: isAdmin ? 'linear-gradient(135deg,#a855f7,#6366f1)' : '#535353',
            color: 'white',
            boxShadow: isAdmin ? '0 0 10px rgba(168,85,247,0.5)' : 'none',
          }}
        >
          <User size={16} />
        </button>
      </div>
    </div>
  );
}
