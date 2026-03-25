'use client';

import { useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  loginWithSocial: (provider: 'google' | 'facebook') => void;
}

type Tab = 'signin' | 'signup';

export function AuthModal({ isOpen, onClose, login, register, loginWithSocial }: AuthModalProps) {
  const [tab, setTab]         = useState<Tab>('signin');
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [error, setError]     = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (tab === 'signin') {
        await login(email, password);
      } else {
        await register(name, email, password, confirm);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleSocial(provider: 'google' | 'facebook') {
    loginWithSocial(provider);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[400px] rounded-2xl bg-(--color-surface) p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-700 text-(--color-stone)">
            {tab === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-(--color-muted) hover:bg-(--color-border) transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex rounded-lg border border-(--color-border) p-1">
          <button
            onClick={() => { setTab('signin'); setError(null); }}
            className={`flex-1 rounded-md py-1.5 text-sm font-500 transition-colors ${
              tab === 'signin'
                ? 'bg-(--color-cta) text-white'
                : 'text-(--color-muted) hover:text-(--color-stone)'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('signup'); setError(null); }}
            className={`flex-1 rounded-md py-1.5 text-sm font-500 transition-colors ${
              tab === 'signup'
                ? 'bg-(--color-cta) text-white'
                : 'text-(--color-muted) hover:text-(--color-stone)'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Social buttons */}
        <div className="mb-4 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => handleSocial('google')}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-(--color-border) bg-white py-2.5 text-sm font-500 text-(--color-stone) transition-colors hover:bg-(--color-quartz-mist)"
          >
            {/* Google G icon */}
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => handleSocial('facebook')}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-(--color-border) bg-white py-2.5 text-sm font-500 text-(--color-stone) transition-colors hover:bg-(--color-quartz-mist)"
          >
            {/* Facebook icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
            </svg>
            Continue with Facebook
          </button>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-(--color-border)" />
          <span className="text-xs text-(--color-muted)">or</span>
          <div className="h-px flex-1 bg-(--color-border)" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {tab === 'signup' && (
            <div>
              <label className="mb-1 block text-xs font-500 text-(--color-stone)">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Lily Nguyen"
                className="w-full rounded-xl border border-(--color-border) bg-(--color-background) px-3.5 py-2.5 text-sm outline-none focus:border-(--color-cta) transition-colors"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-500 text-(--color-stone)">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-xl border border-(--color-border) bg-(--color-background) px-3.5 py-2.5 text-sm outline-none focus:border-(--color-cta) transition-colors"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-500 text-(--color-stone)">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
              className="w-full rounded-xl border border-(--color-border) bg-(--color-background) px-3.5 py-2.5 text-sm outline-none focus:border-(--color-cta) transition-colors"
            />
          </div>

          {tab === 'signup' && (
            <div>
              <label className="mb-1 block text-xs font-500 text-(--color-stone)">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-(--color-border) bg-(--color-background) px-3.5 py-2.5 text-sm outline-none focus:border-(--color-cta) transition-colors"
              />
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 w-full rounded-xl bg-(--color-cta) py-2.5 text-sm font-600 text-white transition-colors hover:bg-(--color-cta-hover) disabled:opacity-60"
          >
            {submitting ? '…' : tab === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
