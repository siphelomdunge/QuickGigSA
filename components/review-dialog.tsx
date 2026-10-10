'use client';

import { useState, type FormEvent } from 'react';
import { Star } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarInput, Stars } from '@/components/star-rating';
import { useAuth } from '@/lib/auth';
import { usePlatformStore } from '@/lib/platform-store';
import { hasReviewed } from '@/lib/reviews';

interface ReviewButtonProps {
  gigId: string;
  gigTitle: string;
  /** The person being reviewed. */
  userId: string;
  userName: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * "Leave a review" button + dialog. Renders the given rating once a review exists,
 * so it can sit on application cards without extra state in the page.
 */
export function ReviewButton({ gigId, gigTitle, userId, userName, size = 'sm', className }: ReviewButtonProps) {
  const { user } = useAuth();
  const { reviews, addReview } = usePlatformStore();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;
  const existing = reviews.find((review) => review.gig_id === gigId && review.reviewer_id === user.id && review.reviewed_user_id === userId);
  if (existing || hasReviewed(reviews, { gigId, reviewerId: user.id, reviewedUserId: userId })) {
    return (
      <span className={className}>
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
          You rated
          <Stars value={existing?.rating ?? 0} />
        </span>
      </span>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setError('');
    if (!rating) {
      setError('Pick a star rating first.');
      return;
    }
    setSaving(true);
    try {
      await addReview({ gig_id: gigId, reviewer_id: user.id, reviewed_user_id: userId, rating, comment });
      setOpen(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not save your review.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button variant="outline" size={size} className={className} onClick={() => setOpen(true)}>
        <Star className="h-4 w-4" />
        Review {userName.split(' ')[0]}
      </Button>
      <Dialog open={open} onClose={() => !saving && setOpen(false)} title={`How was working with ${userName}?`} description={gigTitle}>
        <form onSubmit={submit} className="space-y-5">
          <StarInput value={rating} onChange={setRating} />
          <Textarea
            label="Comment (optional)"
            hint={`${comment.length}/600`}
            rows={4}
            maxLength={600}
            placeholder="What went well? Anything the next person should know?"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
          <p className="text-xs leading-5 text-slate-500">Reviews are public on the person&apos;s profile and can&apos;t be edited afterwards. One review per person per gig.</p>
          {error ? (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Post review
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
