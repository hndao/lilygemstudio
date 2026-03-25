'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiToggleLike, apiGetLikeStatus } from '@/lib/auth';

interface LikeButtonProps {
  productSlug: string;
  initialCount: number;
  dict: {
    like: string;
    unlike: string;
    likes_count: string;
  };
}

export function LikeButton({ productSlug, initialCount, dict }: LikeButtonProps) {
  const { customer, token, openAuthModal } = useAuth();

  const [liked, setLiked]   = useState(false);
  const [count, setCount]   = useState(initialCount);
  const [loading, setLoading] = useState(false);

  // Fetch like status once the customer is known
  useEffect(() => {
    if (!customer || !token) return;
    apiGetLikeStatus(productSlug, token)
      .then(({ liked: l, count: c }) => {
        setLiked(l);
        setCount(c);
      })
      .catch(() => {});
  }, [customer, token, productSlug]);

  const handleClick = useCallback(async () => {
    if (!customer || !token) {
      openAuthModal();
      return;
    }

    // Optimistic update
    const prevLiked = liked;
    const prevCount = count;
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);
    setLoading(true);

    try {
      const { liked: newLiked, count: newCount } = await apiToggleLike(productSlug, token);
      setLiked(newLiked);
      setCount(newCount);
    } catch {
      // Roll back on error
      setLiked(prevLiked);
      setCount(prevCount);
    } finally {
      setLoading(false);
    }
  }, [customer, token, liked, count, productSlug, openAuthModal]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={liked ? dict.unlike : dict.like}
      aria-pressed={liked}
      className="flex items-center gap-1.5 rounded-full border border-(--color-border) px-3 py-1.5 text-sm transition-colors hover:border-(--color-cta) disabled:opacity-60"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        className={liked ? 'text-(--color-cta)' : 'text-(--color-muted)'}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span className={`font-500 ${liked ? 'text-(--color-cta)' : 'text-(--color-muted)'}`}>
        {count > 0 ? (
          <>{count} {dict.likes_count}</>
        ) : (
          dict.like
        )}
      </span>
    </button>
  );
}
