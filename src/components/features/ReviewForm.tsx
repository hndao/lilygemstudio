'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiSubmitReview } from '@/lib/auth';

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
  };
}

export function ReviewForm({ productSlug, dict }: ReviewFormProps) {
  const { customer, token, openAuthModal } = useAuth();

  const [rating, setRating]   = useState(0);
  const [hovered, setHovered] = useState(0);
  const [name, setName]       = useState(customer?.name ?? '');
  const [title, setTitle]     = useState('');
  const [body, setBody]       = useState('');
  const [error, setError]     = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  // Keep name in sync when customer logs in
  if (customer?.name && name === '') {
    setName(customer.name);
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (rating === 0) { setError('Please select a star rating.'); return; }
    if (body.length < 10) { setError(dict.review_min_chars); return; }

    setError(null);
    setSubmitting(true);
    try {
      await apiSubmitReview(productSlug, token, {
        rating,
        title,
        body,
        author_name: name || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit review.';
      // Detect "already reviewed" from API message
      if (msg.toLowerCase().includes('already')) {
        setError(dict.already_reviewed);
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }, [token, rating, body, title, name, productSlug, dict]);

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

  return (
    <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
      <h3 className="mb-4 text-base font-700 text-(--color-stone)">{dict.write_review}</h3>

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
            placeholder="The stone quality is beautiful and the bracelet fits perfectly..."
            className="w-full resize-none rounded-xl border border-(--color-border) bg-(--color-background) px-3.5 py-2.5 text-sm outline-none focus:border-(--color-cta) transition-colors"
          />
          <p className={`mt-1 text-right text-xs ${body.length < 10 ? 'text-(--color-muted)' : 'text-(--color-nature-text)'}`}>
            {body.length} / 10+
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
