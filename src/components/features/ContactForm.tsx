'use client';

/**
 * ContactForm — client component for the /contact page.
 *
 * WHY CLIENT: Form state (field values, submit status) requires interactivity.
 * The parent ContactPage stays an RSC; only this form is a client boundary.
 *
 * SUBMIT BEHAVIOUR: POSTs to the Laravel API at /api/v1/contact.
 * Rate-limited to 5 requests/min per IP on the server side.
 *
 * BOT PROTECTION:
 *  1. Honeypot — a hidden `phone_number` field bots auto-fill; humans never see it.
 *     The backend rejects any submission where this field is non-empty.
 *  2. Timing guard — the form records its mount timestamp; submissions arriving
 *     in under 1.5 s are silently dropped (bots submit instantly).
 *  3. useRef submit lock — prevents race conditions from rapid double-clicks
 *     before React re-renders with state = 'submitting'.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

import { useEffect, useRef, useState } from 'react';

type FormState = 'idle' | 'submitting' | 'success' | 'error';
type FieldErrors = Partial<Record<'name' | 'email' | 'message', string>>;

const SUBJECTS = [
  'General Inquiry',
  'Product Question',
  'Artisan Partnership',
  'Press & Media',
  'Affiliate Program',
  'Other',
];

const EMPTY = { name: '', email: '', subject: SUBJECTS[0], message: '' };

export function ContactForm() {
  const [state, setState]       = useState<FormState>('idle');
  const [form, setForm]         = useState(EMPTY);
  const [honeypot, setHoneypot] = useState('');          // must stay empty
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Race-safe submit lock — set synchronously before any async work
  const submitting = useRef(false);
  // Record when the form was rendered so we can reject instant bot submissions
  const mountedAt  = useRef<number>(Date.now());

  useEffect(() => { mountedAt.current = Date.now(); }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear the error for the field being edited
    if (name in fieldErrors) setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!form.name.trim())                      errors.name    = 'Please enter your name.';
    if (!form.email.trim())                     errors.email   = 'Please enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                                errors.email   = 'Please enter a valid email address.';
    if (!form.message.trim())                  errors.message = 'Please write a message.';
    else if (form.message.trim().length < 5)   errors.message = 'Message is too short (min 5 chars).';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // 1. Race-safe double-submit guard
    if (submitting.current) return;

    // 2. Client-side field validation
    if (!validate()) return;

    // 3. Timing guard — bots submit in < 800 ms; pretend success so they get no signal
    if (Date.now() - mountedAt.current < 800) {
      setState('success');
      return;
    }

    // 4. Honeypot — filled by bots, invisible to humans; reject silently
    if (honeypot) {
      setState('success');
      return;
    }

    submitting.current = true;
    setState('submitting');

    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...form, cf_hp: honeypot }),
      });
      if (!res.ok) throw new Error('server_error');
      setState('success');
      setForm(EMPTY);
    } catch {
      setState('error');
    } finally {
      submitting.current = false;
    }
  }

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center rounded-2xl border-2 border-(--color-sage)/20 bg-(--color-sage)/5 px-8 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--color-sage)/15 text-3xl">
          ✉️
        </div>
        <h3 className="mt-5 font-heading text-xl font-700 text-(--color-stone)">Message Sent!</h3>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-(--color-muted)">
          Thanks for reaching out. We&apos;ll get back to you within 1–2 business days.
        </p>
        <button
          onClick={() => setState('idle')}
          className="mt-8 rounded-full border border-(--color-sage) px-6 py-2.5 font-heading text-sm font-600 text-(--color-sage) transition-colors hover:bg-(--color-sage) hover:text-white"
        >
          Send another message
        </button>
      </div>
    );
  }

  const disabled = state === 'submitting';
  // border-stone-300 = standard Tailwind utility, always compiled; no CSS-variable dependency
  const inputCls = (hasError: boolean) =>
    `w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-stone-800 placeholder:text-stone-400 transition-all focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
      hasError
        ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
        : 'border-stone-300 focus:border-stone-500 focus:ring-stone-200'
    }`;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6" suppressHydrationWarning>

      {/* ── Honeypot — visually hidden, bots fill it, backend rejects it ── */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', height: 0, overflow: 'hidden', opacity: 0 }}>
        <label htmlFor="cf-hp">Leave blank</label>
        <input
          id="cf-hp"
          type="text"
          name="cf_hp"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="new-password"
        />
      </div>

      {/* Name + Email row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cf-name" className="font-heading text-xs font-700 uppercase tracking-widest text-(--color-stone)">
            Name
          </label>
          <input
            id="cf-name"
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            disabled={disabled}
            placeholder="Your name"
            className={inputCls(!!fieldErrors.name)}
          />
          {fieldErrors.name && <p className="text-xs text-red-500">{fieldErrors.name}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cf-email" className="font-heading text-xs font-700 uppercase tracking-widest text-(--color-stone)">
            Email
          </label>
          <input
            id="cf-email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            disabled={disabled}
            placeholder="you@example.com"
            className={inputCls(!!fieldErrors.email)}
          />
          {fieldErrors.email && <p className="text-xs text-red-500">{fieldErrors.email}</p>}
        </div>
      </div>

      {/* Subject */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cf-subject" className="font-heading text-xs font-700 uppercase tracking-widest text-(--color-stone)">
          Subject
        </label>
        <select
          id="cf-subject"
          name="subject"
          value={form.subject}
          onChange={handleChange}
          disabled={disabled}
          className={inputCls(false)}
        >
          {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Message */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cf-message" className="font-heading text-xs font-700 uppercase tracking-widest text-(--color-stone)">
          Message
        </label>
        <textarea
          id="cf-message"
          name="message"
          value={form.message}
          onChange={handleChange}
          disabled={disabled}
          rows={6}
          placeholder="Tell us how we can help…"
          className={`${inputCls(!!fieldErrors.message)} resize-none`}
        />
        {fieldErrors.message && <p className="text-xs text-red-500">{fieldErrors.message}</p>}
      </div>

      {state === 'error' && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Something went wrong. Please try again or email us at{' '}
          <a href="mailto:hello@dariiv.com" className="underline">hello@dariiv.com</a>.
        </p>
      )}

      <button
        type="submit"
        disabled={disabled}
        style={{ backgroundColor: disabled ? '#5C6B45' : '#5C6B45', color: '#ffffff' }}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-3.5 font-semibold text-sm shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-60"
      >
        {disabled && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {disabled ? 'Sending…' : 'Send Message →'}
      </button>
    </form>
  );
}

