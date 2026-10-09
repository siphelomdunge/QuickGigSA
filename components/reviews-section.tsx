'use client';

import { MessageSquareQuote } from 'lucide-react';
import { Stars } from '@/components/star-rating';
import { usePlatformStore } from '@/lib/platform-store';
import { formatRating, ratingFor, reviewsReceived } from '@/lib/reviews';
import { formatRelative } from '@/lib/messaging';

/** Rating summary + the reviews a person has received. Used on worker and client profiles. */
export function ReviewsSection({ userId, title = 'Reviews' }: { userId: string; title?: string }) {
  const { reviews, users, gigs } = usePlatformStore();
  const summary = ratingFor(reviews, userId);
  const received = reviewsReceived(reviews, userId);

  const nameFor = (review: (typeof received)[number]) => {
    const gig = gigs.find((item) => item.id === review.gig_id);
    if (gig && gig.client_id === review.reviewer_id) return gig.client_name;
    return users.find((item) => item.id === review.reviewer_id)?.full_name ?? 'QuickGig user';
  };

  return (
    <section className="panel p-6 sm:p-8" aria-labelledby="reviews-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="reviews-heading" className="text-xl font-semibold text-slate-900">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-600">What people you&apos;ve worked with said. Reviews are left after a gig is marked completed.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-soft">
          <p className="font-display text-3xl font-semibold leading-none text-slate-900">{formatRating(summary)}</p>
          <div>
            <Stars value={summary.average} />
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {summary.count} review{summary.count === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </div>

      {received.length ? (
        <ul className="mt-6 grid gap-3">
          {received.map((review) => (
            <li key={review.id} className="rounded-2xl border border-slate-200/80 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{nameFor(review)}</p>
                <div className="flex items-center gap-3">
                  <Stars value={review.rating} />
                  <span className="text-xs text-slate-500">{formatRelative(review.created_at)}</span>
                </div>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500">{gigs.find((item) => item.id === review.gig_id)?.title ?? 'Gig'}</p>
              {review.comment ? <p className="mt-3 text-sm leading-6 text-slate-700">{review.comment}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
          <MessageSquareQuote className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
          No reviews yet. Complete a gig and the other person can rate you here.
        </div>
      )}
    </section>
  );
}

/** Compact inline rating for cards: ★ 4.8 (12). */
export function RatingInline({ userId, className }: { userId: string; className?: string }) {
  const { reviews } = usePlatformStore();
  const summary = ratingFor(reviews, userId);
  return (
    <span className={className} title={summary.count ? `${summary.average} from ${summary.count} review${summary.count === 1 ? '' : 's'}` : 'No reviews yet'}>
      <Stars value={summary.average} className="align-middle" />
      <span className="ml-1.5 align-middle text-xs font-semibold text-slate-700">
        {formatRating(summary)}
        {summary.count ? <span className="font-normal text-slate-500"> ({summary.count})</span> : null}
      </span>
    </span>
  );
}
