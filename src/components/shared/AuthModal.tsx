'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Extend window with the Turnstile API
declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string, turnstileToken: string) => Promise<void>;
  loginWithSocial: (provider: 'google' | 'facebook') => void;
}

type Tab = 'signin' | 'signup';

const INPUT_CLASS =
  'w-full rounded-xl border border-(--color-border) bg-(--color-background) px-4 py-3 text-sm text-(--color-stone) placeholder:text-(--color-muted) outline-none transition-colors focus:border-(--color-cta) focus:ring-2 focus:ring-(--color-cta)/20';

export function AuthModal({ isOpen, onClose, login, register, loginWithSocial }: AuthModalProps) {
  const [tab, setTab]                   = useState<Tab>('signin');
  const [name, setName]                 = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirm, setConfirm]           = useState('');
  const [error, setError]               = useState<string | null>(null);
  const [submitting, setSubmitting]     = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReady, setTurnstileReady] = useState(false);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef           = useRef<string | undefined>(undefined);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Render Turnstile widget when signup tab is active and script is loaded
  useEffect(() => {
    if (tab !== 'signup' || !turnstileReady || !turnstileContainerRef.current || !siteKey) return;
    if (!window.turnstile) return;

    if (widgetIdRef.current !== undefined) {
      window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = undefined;
    }

    widgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: siteKey,
      callback: (token: string) => setTurnstileToken(token),
      'expired-callback': () => setTurnstileToken(''),
      'error-callback': () => setTurnstileToken(''),
      theme: 'light',
      language: 'vi',
    });

    return () => {
      if (widgetIdRef.current !== undefined && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = undefined;
      }
    };
  }, [tab, turnstileReady, siteKey]);

  // Reset token when switching tabs
  useEffect(() => { setTurnstileToken(''); }, [tab]);

  function resetForm() {
    setName(''); setEmail(''); setPassword(''); setConfirm(''); setError(null); setTurnstileToken('');
  }

  function switchTab(t: Tab) { setTab(t); resetForm(); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (tab === 'signup' && siteKey && !turnstileToken) {
      setError('Vui lòng hoàn thành xác minh bảo mật bên dưới.');
      return;
    }

    setSubmitting(true);
    try {
      if (tab === 'signin') {
        await login(email, password);
      } else {
        await register(name, email, password, confirm, turnstileToken);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      // Reset widget on failure so user can retry
      if (widgetIdRef.current !== undefined && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        setTurnstileToken('');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleSocial(provider: 'google' | 'facebook') {
    loginWithSocial(provider);
    onClose();
  }

  return (
    <>
    {/* Load Turnstile script once — explicit mode prevents auto-rendering */}
    {siteKey && (
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setTurnstileReady(true)}
      />
    )}
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ───────────────────────────────────────────────── */}
          <motion.div
            key="auth-backdrop"
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* ── Panel ──────────────────────────────────────────────────── */}
          {/* Mobile: bottom sheet · Desktop: centered card */}
          <motion.div
            key="auth-panel"
            role="dialog"
            aria-modal="true"
            aria-label={tab === 'signin' ? 'Sign In' : 'Create Account'}
            className={[
              'fixed z-[301] w-full bg-(--color-surface) shadow-2xl overflow-y-auto',
              // Mobile: bottom sheet
              'bottom-0 left-0 right-0 max-h-[92dvh] rounded-t-[24px]',
              // Desktop: centered card (reset mobile insets, center via translate)
              'md:bottom-auto md:right-auto',
              'md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2',
              'md:max-w-[440px] md:max-h-[90dvh] md:rounded-2xl',
            ].join(' ')}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile drag handle */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="h-1 w-10 rounded-full bg-(--color-border)" aria-hidden="true" />
            </div>

            <div className="px-6 pb-8 pt-4 md:px-8 md:pb-8 md:pt-6">
              {/* ── Header ─────────────────────────────────────────────── */}
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <p className="text-xs font-600 tracking-[0.08em] uppercase text-(--color-cta) mb-0.5">
                    🌸 LilyGem Studio
                  </p>
                  <h2 className="font-heading text-xl font-700 text-(--color-stone)">
                    {tab === 'signin' ? 'Chào mừng trở lại' : 'Tạo tài khoản'}
                  </h2>
                  <p className="mt-0.5 text-sm text-(--color-muted)">
                    {tab === 'signin'
                      ? 'Đăng nhập để tiếp tục mua sắm'
                      : 'Tham gia cộng đồng LilyGem'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Đóng"
                  className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-(--color-muted) transition-colors hover:bg-(--color-border) hover:text-(--color-stone)"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* ── Tab switcher ───────────────────────────────────────── */}
              <div className="mb-6 flex border-b border-(--color-border)">
                {(['signin', 'signup'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => switchTab(t)}
                    className={[
                      'flex-1 pb-2.5 text-sm font-600 transition-colors',
                      tab === t
                        ? 'border-b-2 border-(--color-cta) text-(--color-cta) -mb-px'
                        : 'text-(--color-muted) hover:text-(--color-stone)',
                    ].join(' ')}
                  >
                    {t === 'signin' ? 'Đăng nhập' : 'Tạo tài khoản'}
                  </button>
                ))}
              </div>

              {/* ── Social buttons ─────────────────────────────────────── */}
              <div className="mb-5 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => handleSocial('google')}
                  className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-(--color-border) bg-white text-sm font-500 text-(--color-stone) shadow-sm transition-all hover:border-(--color-cta)/40 hover:shadow-md active:scale-[0.98]"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Tiếp tục với Google
                </button>

                <button
                  type="button"
                  onClick={() => handleSocial('facebook')}
                  className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-(--color-border) bg-white text-sm font-500 text-(--color-stone) shadow-sm transition-all hover:border-(--color-cta)/40 hover:shadow-md active:scale-[0.98]"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
                    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                  </svg>
                  Tiếp tục với Facebook
                </button>
              </div>

              {/* ── Divider ────────────────────────────────────────────── */}
              <div className="mb-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-(--color-border)" />
                <span className="text-xs text-(--color-muted)">hoặc</span>
                <div className="h-px flex-1 bg-(--color-border)" />
              </div>

              {/* ── Form ───────────────────────────────────────────────── */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {tab === 'signup' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-600 text-(--color-stone)">Họ và tên</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                      placeholder="Lily Nguyễn"
                      className={INPUT_CLASS}
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-600 text-(--color-stone)">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="ban@email.com"
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-600 text-(--color-stone)">Mật khẩu</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                    placeholder="••••••••"
                    className={INPUT_CLASS}
                  />
                </div>

                {tab === 'signup' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-600 text-(--color-stone)">Xác nhận mật khẩu</label>
                    <input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className={INPUT_CLASS}
                    />
                  </div>
                )}

                {/* Cloudflare Turnstile — only shown on signup when site key is configured */}
                {tab === 'signup' && siteKey && (
                  <div className="flex flex-col gap-1.5">
                    <div ref={turnstileContainerRef} />
                    {!turnstileReady && (
                      <p className="text-xs text-(--color-muted)">Đang tải xác minh bảo mật…</p>
                    )}
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-600">
                    <span className="mt-px shrink-0">⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-1 flex h-12 w-full items-center justify-center rounded-xl bg-(--color-cta) text-[15px] font-600 text-white shadow-sm transition-all hover:bg-(--color-cta-hover) hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    : tab === 'signin' ? 'Đăng nhập' : 'Tạo tài khoản'}
                </button>
              </form>

              {/* ── Switch tab link ─────────────────────────────────────── */}
              <p className="mt-4 text-center text-xs text-(--color-muted)">
                {tab === 'signin' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                <button
                  type="button"
                  onClick={() => switchTab(tab === 'signin' ? 'signup' : 'signin')}
                  className="font-600 text-(--color-cta) hover:underline"
                >
                  {tab === 'signin' ? 'Tạo tài khoản' : 'Đăng nhập'}
                </button>
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}
