import { describe, expect, it } from 'vitest';
import { canReview, formatRating, hasReviewed, ratingFor, reviewsReceived } from '@/lib/reviews';
import type { Review } from '@/lib/mock-data';

const review = (over: Partial<Review>): Review => ({ id: 'r', gig_id: 'g', reviewer_id: 'a', reviewed_user_id: 'b', rating: 5, comment: '', created_at: '2026-01-01', ...over });

describe('ratingFor', () => {
  it('returns 0/0 with no reviews and "New" when formatted', () => {
    expect(ratingFor([], 'b')).toEqual({ average: 0, count: 0 });
    expect(formatRating(ratingFor([], 'b'))).toBe('New');
  });
  it('averages only the reviews for that person, to one decimal', () => {
    const reviews = [review({ id: '1', rating: 5 }), review({ id: '2', rating: 4 }), review({ id: '3', rating: 1, reviewed_user_id: 'someone-else' })];
    expect(ratingFor(reviews, 'b')).toEqual({ average: 4.5, count: 2 });
    expect(formatRating(ratingFor(reviews, 'b'))).toBe('4.5');
  });
});

describe('review gating', () => {
  it('only allows reviews once the application is completed', () => {
    expect(canReview({ status: 'completed' })).toBe(true);
    expect(canReview({ status: 'accepted' })).toBe(false);
    expect(canReview({ status: 'pending' })).toBe(false);
  });
  it('detects an existing review for the same gig/pair only', () => {
    const reviews = [review({})];
    expect(hasReviewed(reviews, { gigId: 'g', reviewerId: 'a', reviewedUserId: 'b' })).toBe(true);
    expect(hasReviewed(reviews, { gigId: 'other', reviewerId: 'a', reviewedUserId: 'b' })).toBe(false);
    expect(hasReviewed(reviews, { gigId: 'g', reviewerId: 'b', reviewedUserId: 'a' })).toBe(false);
  });
  it('lists received reviews newest first', () => {
    const reviews = [review({ id: 'old', created_at: '2026-01-01' }), review({ id: 'new', created_at: '2026-02-01' })];
    expect(reviewsReceived(reviews, 'b').map((r) => r.id)).toEqual(['new', 'old']);
  });
});
