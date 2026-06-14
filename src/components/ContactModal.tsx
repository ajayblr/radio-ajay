import { useState } from 'react';
import { X, Send, CheckCircle2 } from 'lucide-react';
import { submitFeedback } from '../lib/firebaseAnalytics';
import { logAnalyticsEvent } from '../lib/firebase';

interface Props {
  onClose: () => void;
}

export default function ContactModal({ onClose }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || status === 'sending') return;

    setStatus('sending');
    const ok = await submitFeedback({
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      message: message.trim(),
    });

    if (ok) {
      logAnalyticsEvent('feedback_submit');
      setStatus('sent');
    } else {
      setStatus('error');
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />

      <div
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-sm rounded-xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--sp-surface)', border: '1px solid var(--sp-border)' }}
      >
        <div className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid var(--sp-border)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--sp-text)' }}>Contact / Feedback</span>
          <button onClick={onClose} className="transition-opacity hover:opacity-100 opacity-70"
            style={{ color: 'var(--sp-text)' }}>
            <X size={15} />
          </button>
        </div>

        {status === 'sent' ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <CheckCircle2 size={32} style={{ color: 'var(--sp-green)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--sp-text)' }}>Thanks for reaching out!</p>
            <p className="text-xs" style={{ color: 'var(--sp-muted)' }}>Your message has been sent.</p>
            <button
              onClick={onClose}
              className="mt-2 px-4 py-1.5 text-xs font-semibold rounded-full"
              style={{ background: 'var(--sp-green)', color: '#000' }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-4 py-4">
            <p className="text-xs leading-relaxed" style={{ color: 'var(--sp-muted)' }}>
              Have a question, suggestion, or issue? Send a message and I'll get back to you.
            </p>

            <input
              type="text"
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md focus:outline-none"
              style={{ background: 'var(--sp-elevated)', color: 'var(--sp-text)', border: '1px solid var(--sp-border)' }}
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md focus:outline-none"
              style={{ background: 'var(--sp-elevated)', color: 'var(--sp-text)', border: '1px solid var(--sp-border)' }}
            />
            <textarea
              required
              placeholder="Your message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm rounded-md focus:outline-none resize-none"
              style={{ background: 'var(--sp-elevated)', color: 'var(--sp-text)', border: '1px solid var(--sp-border)' }}
            />

            {status === 'error' && (
              <p className="text-xs" style={{ color: '#f87171' }}>
                Something went wrong. Please try again.
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'sending' || !message.trim()}
              className="flex items-center justify-center gap-2 w-full py-2 text-sm font-semibold rounded-full transition-opacity disabled:opacity-50"
              style={{ background: 'var(--sp-green)', color: '#000' }}
            >
              <Send size={14} />
              {status === 'sending' ? 'Sending…' : 'Send message'}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
