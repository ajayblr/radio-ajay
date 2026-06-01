import { useEffect, useState } from 'react';
import {
  X, LogOut, Radio, Globe, Heart, Bell, TrendingUp,
  Activity, Users, Zap, RefreshCw, ShieldCheck,
} from 'lucide-react';
import { getGlobalStats, getTopStations, getCountries, type GlobalStats } from '../api/radioBrowser';
import type { AppNotification } from '../hooks/useNotifications';
import type { Station } from '../types';

interface Props {
  onClose:       () => void;
  onLogout:      () => void;
  favCount:      number;
  recentCount:   number;
  notifications: AppNotification[];
}

export default function AdminPanel({ onClose, onLogout, favCount, recentCount, notifications }: Props) {
  const [globalStats,  setGlobalStats]  = useState<GlobalStats  | null>(null);
  const [topStations,  setTopStations]  = useState<Station[]>([]);
  const [topCountries, setTopCountries] = useState<{ name: string; stationcount: number }[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshedAt,  setRefreshedAt]  = useState(new Date());

  async function load() {
    setLoading(true);
    const [stats, stations, countries] = await Promise.allSettled([
      getGlobalStats(),
      getTopStations(10),
      getCountries(),
    ]);
    if (stats.status      === 'fulfilled') setGlobalStats(stats.value);
    if (stations.status   === 'fulfilled') setTopStations(stations.value);
    if (countries.status  === 'fulfilled') setTopCountries(countries.value.slice(0, 12));
    setRefreshedAt(new Date());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const maxStations = topCountries[0]?.stationcount ?? 1;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: 'var(--sp-bg)' }}>

      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4"
        style={{ background: 'var(--sp-surface)', borderBottom: '1px solid var(--sp-border)' }}>
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={20} style={{ color: '#a855f7' }} />
          <div>
            <p className="text-sm font-bold text-white leading-none">Admin Panel</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--sp-muted)' }}>
              blr.ajaykumar@gmail.com
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            title="Refresh"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105 disabled:opacity-40"
            style={{ background: 'var(--sp-elevated)', color: 'var(--sp-muted)' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
          >
            <LogOut size={13} /> Logout
          </button>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:text-white"
            style={{ color: 'var(--sp-muted)' }}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">

        {/* ── Overview cards ─────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: 'var(--sp-muted)' }}>Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={Radio} label="Total Stations" value={globalStats?.stations.toLocaleString() ?? '—'} color="#38bdf8" />
            <StatCard icon={Globe} label="Countries" value={globalStats?.countries.toLocaleString() ?? '—'} color="#34d399" />
            <StatCard icon={Heart} label="Your Favourites" value={favCount} color="#f472b6" />
            <StatCard icon={Bell}  label="Notifications" value={notifications.length} color="#a855f7" />
          </div>
        </section>

        {/* ── Global activity ────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: 'var(--sp-muted)' }}>Global Listening Activity
            <span className="ml-2 normal-case font-normal" style={{ color: 'var(--sp-subtle)' }}>
              via Radio Browser API
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ActivityCard
              icon={Zap}
              label="Clicks last hour"
              value={globalStats?.clicks_last_hour.toLocaleString() ?? '—'}
              sub="Station plays worldwide"
              color="#f97316"
            />
            <ActivityCard
              icon={TrendingUp}
              label="Clicks last 24 h"
              value={globalStats?.clicks_last_day.toLocaleString() ?? '—'}
              sub="Station plays worldwide"
              color="#facc15"
            />
            <ActivityCard
              icon={Users}
              label="Active stations"
              value={globalStats ? (globalStats.stations - globalStats.stations_broken).toLocaleString() : '—'}
              sub="Healthy / reachable"
              color="#34d399"
            />
          </div>
          <p className="text-[11px] mt-2" style={{ color: 'var(--sp-subtle)' }}>
            ℹ️ Per-app user tracking requires a backend. These metrics reflect global Radio Browser API activity as the best available proxy.
          </p>
        </section>

        {/* ── Top countries ──────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: 'var(--sp-muted)' }}>Top Countries by Stations</h2>
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--sp-surface)', border: '1px solid var(--sp-border)' }}>
            {topCountries.length === 0 ? (
              <Skeleton rows={6} />
            ) : (
              topCountries.map((c, i) => (
                <div key={c.name} className="flex items-center gap-3 px-4 py-2.5"
                  style={{ borderBottom: i < topCountries.length - 1 ? '1px solid var(--sp-border)' : 'none' }}>
                  <span className="w-5 text-xs text-right shrink-0" style={{ color: 'var(--sp-subtle)' }}>{i + 1}</span>
                  <span className="flex-1 text-sm text-white truncate">{c.name}</span>
                  <div className="w-32 sm:w-48 h-1.5 rounded-full overflow-hidden shrink-0"
                    style={{ background: 'var(--sp-elevated)' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${(c.stationcount / maxStations) * 100}%`,
                      background: 'linear-gradient(90deg,#a855f7,#38bdf8)',
                    }} />
                  </div>
                  <span className="w-14 text-right text-xs shrink-0" style={{ color: 'var(--sp-muted)' }}>
                    {c.stationcount.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── Top stations ───────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: 'var(--sp-muted)' }}>Top 10 Stations Globally</h2>
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--sp-surface)', border: '1px solid var(--sp-border)' }}>
            {topStations.length === 0 ? (
              <Skeleton rows={10} />
            ) : (
              topStations.map((s, i) => (
                <div key={s.stationuuid} className="flex items-center gap-3 px-4 py-2.5"
                  style={{ borderBottom: i < topStations.length - 1 ? '1px solid var(--sp-border)' : 'none' }}>
                  <span className="w-5 text-xs text-right shrink-0" style={{ color: 'var(--sp-subtle)' }}>{i + 1}</span>
                  {s.favicon ? (
                    <img src={s.favicon} alt="" className="w-7 h-7 rounded shrink-0 object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-7 h-7 rounded shrink-0 flex items-center justify-center"
                      style={{ background: 'var(--sp-elevated)' }}>
                      <Radio size={12} style={{ color: 'var(--sp-muted)' }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate leading-tight">{s.name}</p>
                    <p className="text-[11px] truncate" style={{ color: 'var(--sp-muted)' }}>
                      {[s.country, s.codec, s.bitrate ? `${s.bitrate}kbps` : ''].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" style={{ color: '#38bdf8' }}>
                    <Activity size={12} />
                    <span className="text-xs font-medium">{Number(s.clickcount ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── Notifications ──────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: 'var(--sp-muted)' }}>Published Notifications</h2>
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--sp-surface)', border: '1px solid var(--sp-border)' }}>
            {notifications.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--sp-muted)' }}>No notifications yet.</p>
            ) : (
              notifications.map((n, i) => (
                <div key={n.id} className="flex items-start gap-3 px-4 py-3"
                  style={{ borderBottom: i < notifications.length - 1 ? '1px solid var(--sp-border)' : 'none' }}>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5 uppercase"
                    style={{
                      background: n.type === 'upgrade' ? 'rgba(168,85,247,0.2)' : n.type === 'alert' ? 'rgba(249,115,22,0.2)' : 'rgba(56,189,248,0.2)',
                      color:      n.type === 'upgrade' ? '#c084fc'               : n.type === 'alert' ? '#fb923c'               : '#38bdf8',
                    }}
                  >
                    {n.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white leading-tight">
                      {n.title}{n.version && <span className="ml-1.5 text-[10px]" style={{ color: '#c084fc' }}>v{n.version}</span>}
                    </p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--sp-muted)' }}>{n.message}</p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--sp-subtle)' }}>{n.date}</p>
                  </div>
                </div>
              ))
            )}
            <div className="px-4 py-3" style={{ borderTop: '1px solid var(--sp-border)' }}>
              <p className="text-[11px]" style={{ color: 'var(--sp-subtle)' }}>
                💡 To publish a new notification, add an entry to <code className="px-1 py-0.5 rounded" style={{ background: 'var(--sp-elevated)' }}>public/notifications.json</code> and redeploy.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <p className="text-[11px] text-center pb-2" style={{ color: 'var(--sp-subtle)' }}>
          Data refreshed at {refreshedAt.toLocaleTimeString()} · RadioAjay Admin v2.0
        </p>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string;
}) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-2"
      style={{ background: 'var(--sp-surface)', border: '1px solid var(--sp-border)' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: `${color}22`, color }}>
        <Icon size={16} />
      </div>
      <p className="text-2xl font-bold text-white leading-none">{value}</p>
      <p className="text-xs" style={{ color: 'var(--sp-muted)' }}>{label}</p>
    </div>
  );
}

function ActivityCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub: string; color: string;
}) {
  return (
    <div className="rounded-xl p-4 flex items-start gap-3"
      style={{ background: 'var(--sp-surface)', border: '1px solid var(--sp-border)' }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}22`, color }}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xl font-bold text-white leading-none">{value}</p>
        <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--sp-text)' }}>{label}</p>
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--sp-muted)' }}>{sub}</p>
      </div>
    </div>
  );
}

function Skeleton({ rows }: { rows: number }) {
  return (
    <div className="divide-y" style={{ borderColor: 'var(--sp-border)' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="w-7 h-7 rounded animate-pulse" style={{ background: 'var(--sp-elevated)' }} />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 rounded animate-pulse" style={{ background: 'var(--sp-elevated)', width: '60%' }} />
            <div className="h-2.5 rounded animate-pulse" style={{ background: 'var(--sp-elevated)', width: '40%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
