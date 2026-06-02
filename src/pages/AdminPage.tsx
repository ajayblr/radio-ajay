import { useState, useRef, useEffect } from 'react';
import { Lock, Loader2, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { useTheme } from '../hooks/useTheme';
import { useFavorites } from '../hooks/useFavorites';
import { useNotifications } from '../hooks/useNotifications';
import AdminPanel from '../components/AdminPanel';

function goHome() {
  window.location.href = '/';
}

export default function AdminPage() {
  const { isAdmin, login, logout, loginError, loginLoading } = useAdmin();
  const { dark, toggle: toggleTheme } = useTheme();
  const { favorites } = useFavorites();
  const { notifications } = useNotifications();

  if (isAdmin) {
    return (
      <AdminPanel
        onClose={goHome}
        onLogout={() => { logout(); goHome(); }}
        favCount={favorites.length}
        notifications={notifications}
        dark={dark}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: 'var(--sp-bg)' }}>
      <LoginCard
        onLogin={login}
        error={loginError}
        loading={loginLoading}
        dark={dark}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
}

function LoginCard({ onLogin, error, loading, dark, onToggleTheme }: {
  onLogin: (email: string, password: string) => Promise<boolean>;
  error: string;
  loading: boolean;
  dark: boolean;
  onToggleTheme: () => void;
}) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => { emailRef.current?.focus(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!loading) await onLogin(email, pass);
  }

  return (
    <div className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
      style={{ background: 'var(--sp-surface)', border: '1px solid var(--sp-border)' }}>

      <div className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid var(--sp-border)' }}>
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={20} style={{ color: '#a855f7' }} />
          <div>
            <p className="text-sm font-bold leading-none" style={{ color: 'var(--sp-text)' }}>RadioAjay Admin</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--sp-muted)' }}>Sign in to continue</p>
          </div>
        </div>
        <button
          onClick={onToggleTheme}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105"
          style={{ background: 'var(--sp-elevated)', color: 'var(--sp-muted)' }}
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>

      <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: 'var(--sp-muted)' }}>Email</label>
          <input
            ref={emailRef}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
            className="px-3 py-2.5 rounded-lg text-sm focus:outline-none transition-all"
            style={{ background: 'var(--sp-elevated)', color: 'var(--sp-text)', border: '1px solid var(--sp-border)' }}
            onFocus={e => (e.currentTarget.style.border = '1px solid #a855f7')}
            onBlur={e  => (e.currentTarget.style.border = '1px solid var(--sp-border)')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: 'var(--sp-muted)' }}>Password</label>
          <input
            type="password"
            value={pass}
            onChange={e => setPass(e.target.value)}
            placeholder="••••••••"
            required
            className="px-3 py-2.5 rounded-lg text-sm focus:outline-none transition-all"
            style={{ background: 'var(--sp-elevated)', color: 'var(--sp-text)', border: '1px solid var(--sp-border)' }}
            onFocus={e => (e.currentTarget.style.border = '1px solid #a855f7')}
            onBlur={e  => (e.currentTarget.style.border = '1px solid var(--sp-border)')}
          />
        </div>

        {error && (
          <p className="text-xs px-3 py-2 rounded-lg" style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !email || !pass}
          className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(90deg,#a855f7,#6366f1)', color: 'white' }}
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
          {loading ? 'Verifying…' : 'Sign in as Admin'}
        </button>

        <button
          type="button"
          onClick={goHome}
          className="text-xs text-center transition-colors hover:opacity-100 opacity-60"
          style={{ color: 'var(--sp-muted)' }}
        >
          ← Back to RadioAjay
        </button>
      </form>
    </div>
  );
}
