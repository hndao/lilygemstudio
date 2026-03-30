'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiSubmitReview, apiGetReviewEligibility } from '@/lib/auth';
import type { ReviewEligibility } from '@/lib/auth';

interface ReviewFormProps {
  productSlug: string;
  dict: {
    write_review: string;
    your_rating: string;
    your_name: string;
    review_title: string;
    review_body: string;
    submit_review: string;
    review_submitted: string;
    sign_in_to_review: string;
    review_min_chars: string;
    already_reviewed: string;
    collapse: string;
    eligible_days_remaining: string;
    ineligible_already_reviewed: string;
    ineligible_no_order: string;
    ineligible_window_expired: string;
    ineligible_no_listing: string;
    checking_eligibility: string;
    verified_purchase_badge: string;
    submit_error: string;
  };
}

export function ReviewForm({ productSlug, dict }: ReviewFormProps) {
  const { customer, token, openAuthModal } = useAuth();

  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  const [expanded, setExpanded] = useState(false);
  const [rating, setRating]   = useState(0);
  const [hovered, setHovered] = useState(0);
  const [name, setName]       = useState(customer?.name ?? '');
  const [title, setTitle]     = useState('');
  const [body, setBody]       = useState('');
  const [error, setError]     = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  if (customer?.name && name === '') {
    setName(customer.name);
  }

  // Check eligibility when customer is logged in
  useEffect(() => {
    if (!customer || !token) return;
    setCheckingEligibility(true);
    apiGetReviewEligibility(productSlug, token)
      .then(setEligibility)
      .catch(() => setEligibility(null))
      .finally(() => setCheckingEligibility(false));
  }, [customer, token, productSlug]);

  const minChars = eligibility?.min_chars ?? 20;
  const maxChars = eligibility?.max_chars ?? 2000;

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (rating === 0) { setError('Please select a star rating.'); return; }
    if (body.length < minChars) {
      setError(dict.review_min_chars.replace('10', String(minChars)));
      return;
    }
    if (body.length > maxChars) {
      setError(`Review must not exceed ${maxChars} characters.`);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await apiSubmitReview(productSlug, token, {
        rating,
        title,
        body,
        author_name: name || undefined,
        order_id: eligibility?.order_id ?? null,
        listing_id: eligibility?.listing_id ?? null,
      });
      setSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('already')) {
        setError(dict.already_reviewed);
      } else {
        setError(dict.submit_error);
      }
    } finally {
      setSubmitting(false);
    }
  }, [token, rating, body, title, name, productSlug, dict, eligibility, minChars, maxChars]);

  if (submitted) {
    return (
      <div className="rounded-2xl border border-(--color-nature-bg) bg-(--color-nature-bg) p-5 text-center">
        <p className="text-sm font-500 text-(--color-nature-text)">{dict.review_submitted}</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 text-center">
        <p className="mb-3 text-sm text-(--color-muted)">{dict.sign_in_to_review}</p>
        <button
          onClick={openAuthModal}
          className="rounded-xl bg-(--color-cta) px-5 py-2.5 text-sm font-600 text-white hover:bg-(--color-cta-hover) transition-colors"
        >
          {dict.sign_in_to_review}
        </button>
      </div>
    );
  }

  // Loading eligibility
  if (checkingEligibility) {
    return (
      <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 text-center">
        <p className="text-sm text-(--color-muted) animate-pulse">{dict.checking_eligibility}</p>
      </div>
    );
  }

  // Ineligible states
  if (eligibility && !eligibility.eligible) {
    const messages: Record<string, string> = {
      already_reviewed: dict.ineligible_already_reviewed,
      no_delivered_order: dict.ineligible_no_order,
      window_expired: dict.ineligible_window_expired,
      no_listing: dict.ineligible_no_listing,
    };
    const message = eligibility.reason ? (messages[eligibility.reason] ?? dict.ineligible_no_order) : dict.ineligible_no_order;

    return (
      <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 text-center">
        <p className="text-sm text-(--color-muted)">{message}</p>
      </div>
    );
  }

  if (!expanded) {
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 rounded-2xl border border-(--color-border) bg-(--color-surface) px-5 py-3.5 text-sm font-600 text-(--color-cta) transition-colors hover:bg-(--color-quartz-mist) w-full md:w-auto"
        >
          <span className="text-lg leading-none">✏️</span>
          {dict.write_review} +
        </button>
        {eligibility?.days_remaining !== null && eligibility?.days_remaining !== undefined && (
          <span className="text-[12px] text-(--color-muted)">
            {dict.eligible_days_remaining.replace('{n}', String(eligibility.days_remaining))}
          </span>
        )}
        {eligibility?.order_id && (
          <span className="inline-flex items-center gap-1 rounded-full bg-(--color-nature-bg) px-2.5 py-0.5 text-[11px] font-600 text-(--color-nature-text)">
            ✓ {dict.verified_purchase_badge}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-700 text-(--color-stone)">{dict.write_review}</h3>
          {eligibility?.order_id && (
            <span className="inline-flex items-center gap-1 rounded-full bg-(--color-nature-bg) px-2.5 py-0.5 text-[11px] font-600 text-(--color-nature-text)">
              ✓ {dict.verified_purchase_badge}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-[12px] text-(--color-muted) hover:text-(--color-stone)"
        >
          {dict.collapse}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Star picker */}
        <div>
          <p className="mb-2 text-xs font-500 text-(--color-stone)">{dict.your_rating} <span className="text-red-500">*</span></p>
          <div className="flex gap-1" role="group" aria-label={dict.your_rating}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                aria-pressed={rating >= star}
                className="text-2xl leading-none transition-transform hover:scale-110"
              >
                <span className={star <= (hovered || rating) ? 'text-(--color-terracotta)' : 'text-(--color-border)'}>
                  ★
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="mb-1 block text-xs font-500 text-(--color-stone)">{dict.your_name}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={customer.name}
            className="w-full rounded-xl border border-(--color-border) bg-(--color-background) px-3.5 py-2.5 text-sm outline-none focus:border-(--color-cta) transition-colors"
          />
        </div>

        {/* Title */}
        <div>
          <label className="mb-1 block text-xs font-500 text-(--color-stone)">{dict.review_title} <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={255}
            placeholder="Great quality bracelet!"
            className="w-full rounded-xl border border-(--color-border) bg-(--color-background) px-3.5 py-2.5 text-sm outline-none focus:border-(--color-cta) transition-colors"
          />
        </div>

        {/* Body */}
        <div>
          <label className="mb-1 block text-xs font-500 text-(--color-stone)">{dict.review_body} <span className="text-red-500">*</span></label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={4}
            maxLength={maxChars}
            placeholder="The stone quality is beautiful and the bracelet fits perfectly..."
            className="w-full resize-none rounded-xl border border-(--color-border) bg-(--color-background) px-3.5 py-2.5 text-sm outline-none focus:border-(--color-cta) transition-colors"
          />
          <p className={`mt-1 text-right text-xs ${body.length < minChars ? 'text-(--color-muted)' : 'text-(--color-nature-text)'}`}>
            {body.length} / {minChars}+ (max {maxChars})
          </p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="self-end rounded-xl bg-(--color-cta) px-6 py-2.5 text-sm font-600 text-white transition-colors hover:bg-(--color-cta-hover) disabled:opacity-60"
        >
          {submitting ? '…' : dict.submit_review}
        </button>
      </form>
    </div>
  );
}
