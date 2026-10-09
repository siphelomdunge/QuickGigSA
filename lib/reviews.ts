import type { Application, Review } from '@/lib/mock-data';

export interface RatingSummary {
  average: number;
  count: number;
}

/** Average and count for one person, computed from the reviews the viewer can see. */
export function ratingFor(reviews: Review[], userId: string): RatingSummary {
  const theirs = reviews.filter((review) => review.reviewed_user_id === userId);
  if (!theirs.length) return { average: 0, count: 0 };
  const average = theirs.reduce((sum, review) => sum + review.rating, 0) / theirs.length;
  return { average: Math.round(average * 10) / 10, count: theirs.length };
}

export function formatRating(summary: RatingSummary) {
  return summary.count ? summary.average.toFixed(1) : 'New';
}

/** Reviews are allowed once the work is done. (The database also permits 'accepted'; the UI waits for completion.) */
export function canReview(application: Pick<Application, 'status'>) {
  return application.status === 'completed';
}

export function hasReviewed(reviews: Review[], { gigId, reviewerId, reviewedUserId }: { gigId: string; reviewerId: string; reviewedUserId: string }) {
  return reviews.some((review) => review.gig_id === gigId && review.reviewer_id === reviewerId && review.reviewed_user_id === reviewedUserId);
}

export function reviewsReceived(reviews: Review[], userId: string) {
  return reviews.filter((review) => review.reviewed_user_id === userId).sort((a, b) => b.created_at.localeCompare(a.created_at));
}
