import { useState, useRef, useEffect } from 'react';
import { Lock, X, Loader2, ShieldCheck } from 'lucide-react';

interface Props {
  onLogin: (email: string, password: string) => Promise<void>;
  error: string;
  loading: boolean;
  onClose: () => void;
}

export default function AdminLogin({ onLogin, error, loading, onClose }: Props) {
  const [email, setEmail]   = useState('');
  const [pass,  setPass]    = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => { emailRef.current?.focus(); }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!loading) onLogin(email, pass);
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: 'var(--sp-surface)', border: '1px solid var(--sp-border)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid var(--sp-border)' }}>
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} style={{ color: '#a855f7' }} />
              <span className="font-semibold text-white">Admin Login</span>
            </div>
            <button onClick={onClose} className="transition-colors hover:text-white"
              style={{ color: 'var(--sp-muted)' }}>
              <X size={16} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: 'var(--sp-muted)' }}>
                Email
              </label>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="px-3 py-2.5 rounded-lg text-sm focus:outline-none transition-all"
                style={{
                  background: 'var(--sp-elevated)',
                  color: 'var(--sp-text)',
                  border: '1px solid var(--sp-border)',
                }}
                onFocus={e => (e.currentTarget.style.border = '1px solid #a855f7')}
                onBlur={e  => (e.currentTarget.style.border = '1px solid var(--sp-border)')}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: 'var(--sp-muted)' }}>
                Password
              </label>
              <input
                type="password"
                value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="••••••••"
                required
                className="px-3 py-2.5 rounded-lg text-sm focus:outline-none transition-all"
                style={{
                  background: 'var(--sp-elevated)',
                  color: 'var(--sp-text)',
                  border: '1px solid var(--sp-border)',
                }}
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
          </form>
        </div>
      </div>
    </>
  );
}
