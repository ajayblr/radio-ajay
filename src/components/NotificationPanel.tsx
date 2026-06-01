import { Sparkles, Info, AlertCircle, CheckCheck, X } from 'lucide-react';
import type { AppNotification, NotifType } from '../hooks/useNotifications';

interface Props {
  notifications: AppNotification[];
  readIds: Set<string>;
  onMarkAllRead: () => void;
  onClose: () => void;
}

function typeIcon(t: NotifType) {
  if (t === 'upgrade') return <Sparkles size={14} />;
  if (t === 'alert')   return <AlertCircle size={14} />;
  return <Info size={14} />;
}

function typeColor(t: NotifType) {
  if (t === 'upgrade') return '#a855f7';
  if (t === 'alert')   return '#f97316';
  return '#38bdf8';
}

export default function NotificationPanel({ notifications, readIds, onMarkAllRead, onClose }: Props) {
  const hasUnread = notifications.some(n => !readIds.has(n.id));

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel */}
      <div
        className="absolute right-0 top-10 z-50 rounded-xl shadow-2xl overflow-hidden"
        style={{
          width: 'min(22rem, calc(100vw - 1rem))',
          background: 'var(--sp-surface)',
          border: '1px solid var(--sp-border)',
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--sp-border)' }}>
          <span className="text-sm font-semibold text-white">Notifications</span>
          <div className="flex items-center gap-3">
            {hasUnread && (
              <button
                onClick={onMarkAllRead}
                className="flex items-center gap-1 text-xs transition-colors hover:text-white"
                style={{ color: 'var(--sp-muted)' }}
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
            <button onClick={onClose} className="transition-colors hover:text-white"
              style={{ color: 'var(--sp-muted)' }}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: 'var(--sp-muted)' }}>
              No notifications
            </p>
          ) : (
            notifications.map(n => {
              const unread = !readIds.has(n.id);
              const color  = typeColor(n.type);
              return (
                <div
                  key={n.id}
                  className="flex gap-3 px-4 py-3"
                  style={{
                    borderBottom: '1px solid var(--sp-border)',
                    background: unread ? 'rgba(255,255,255,0.03)' : 'transparent',
                  }}
                >
                  {/* Type icon */}
                  <div
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
                    style={{ background: `${color}22`, color }}
                  >
                    {typeIcon(n.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-tight"
                        style={{ color: unread ? 'white' : 'var(--sp-text)' }}>
                        {n.title}
                        {n.version && (
                          <span
                            className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: `${color}33`, color }}
                          >
                            v{n.version}
                          </span>
                        )}
                      </p>
                      {unread && (
                        <div className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                          style={{ background: color }} />
                      )}
                    </div>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--sp-muted)' }}>
                      {n.message}
                    </p>
                    <p className="text-[10px] mt-1.5" style={{ color: 'var(--sp-subtle)' }}>
                      {n.date}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
