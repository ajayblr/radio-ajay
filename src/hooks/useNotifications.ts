import { useState, useEffect, useCallback } from 'react';

export type NotifType = 'info' | 'upgrade' | 'alert';

export interface AppNotification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  date: string;
  version?: string;
}

const READ_KEY = 'radio_read_notifs';

function getReadIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); }
  catch { return new Set(); }
}

function persist(ids: Set<string>) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(getReadIds);

  useEffect(() => {
    fetch('/notifications.json')
      .then(r => r.json())
      .then(d => setNotifications(d.notifications ?? []))
      .catch(() => {});
  }, []);

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const markAllRead = useCallback(() => {
    setNotifications(prev => {
      const ids = new Set(prev.map(n => n.id));
      setReadIds(ids);
      persist(ids);
      return prev;
    });
  }, []);

  const markRead = useCallback((id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      persist(next);
      return next;
    });
  }, []);

  return { notifications, unreadCount, readIds, markAllRead, markRead };
}
