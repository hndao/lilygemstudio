'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import {
  COOKIE_CATEGORIES,
  ConsentChoices,
  DENY_ALL,
  writeConsent,
} from '@/lib/cookieConsent';

interface Props {
  open: boolean;
  choices: ConsentChoices;
  onChoicesChange: (choices: ConsentChoices) => void;
  onClose: () => void;
  onSave: () => void;
}

/** Accessible toggle switch */
function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-sage) focus-visible:ring-offset-2 ${
        checked ? 'bg-(--color-sage)' : 'bg-(--color-border)'
      }`}
    >
      <span className="sr-only">{checked ? 'Enabled' : 'Disabled'}</span>
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function CookiePreferencesModal({
  open,
  choices,
  onChoicesChange,
  onClose,
  onSave,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Trap focus inside modal when open
  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  function handleRejectAll() {
    onChoicesChange(DENY_ALL);
    writeConsent(DENY_ALL);
    onClose();
  }

  function handleSave() {
    writeConsent(choices);
    onSave();
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-pref-title"
        tabIndex={-1}
        className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-lg rounded-2xl bg-white shadow-2xl outline-none sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-(--color-border) px-6 py-4">
          <h2
            id="cookie-pref-title"
            className="font-heading text-base font-700 text-(--color-stone)"
          >
            Cookie Preferences
          </h2>
          <button
            onClick={onClose}
            aria-label="Close cookie preferences"
            className="rounded-lg p-1.5 text-(--color-muted) transition-colors hover:bg-(--color-sand)/30 hover:text-(--color-stone)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="mb-5 text-sm leading-relaxed text-(--color-muted)">
            We use cookies to enhance your experience. You can choose which categories to allow.
            Essential cookies are always on as they are required for the site to function.
          </p>

          {/* Necessary — always on */}
          <div className="mb-4 flex items-start justify-between gap-4 rounded-xl bg-(--color-sand)/30 px-4 py-4">
            <div>
              <p className="font-heading text-sm font-600 text-(--color-stone)">Necessary</p>
              <p className="mt-0.5 text-xs leading-relaxed text-(--color-muted)">
                Required for login sessions, security, and the shopping cart. Cannot be disabled.
              </p>
            </div>
            <span className="mt-0.5 shrink-0 rounded-full bg-(--color-sage)/15 px-2.5 py-0.5 font-heading text-[10px] font-700 uppercase tracking-wide text-(--color-sage)">
              Always on
            </span>
          </div>

          {/* Optional categories */}
          {COOKIE_CATEGORIES.map((cat) => (
            <div
              key={cat.key}
              className="mb-3 flex items-start justify-between gap-4 rounded-xl border border-(--color-border) px-4 py-4"
            >
              <label
                htmlFor={`toggle-${cat.key}`}
                className="cursor-pointer"
              >
                <p className="font-heading text-sm font-600 text-(--color-stone)">{cat.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-(--color-muted)">
                  {cat.description}
                </p>
              </label>
              <div className="mt-0.5 shrink-0">
                <Toggle
                  id={`toggle-${cat.key}`}
                  checked={choices[cat.key]}
                  onChange={(v) => onChoicesChange({ ...choices, [cat.key]: v })}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 border-t border-(--color-border) px-6 py-4">
          <button
            onClick={handleRejectAll}
            className="rounded-full border border-(--color-border) px-5 py-2.5 font-heading text-xs font-600 text-(--color-muted) transition-colors hover:border-(--color-stone) hover:text-(--color-stone)"
          >
            Reject All
          </button>
          <button
            onClick={handleSave}
            className="rounded-full bg-(--color-sage) px-6 py-2.5 font-heading text-xs font-600 text-white shadow-sm transition-colors hover:bg-(--color-sage-dark)"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </>
  );
}

