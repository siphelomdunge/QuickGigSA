'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const labels = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

/** Read-only stars, e.g. next to a name. */
export function Stars({ value, size = 'sm', className }: { value: number; size?: 'sm' | 'md'; className?: string }) {
  const dim = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${value} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn(dim, n <= Math.round(value) ? 'fill-secondary text-secondary' : 'text-slate-300')} />
      ))}
    </span>
  );
}

/** Tappable 1–5 star input (44px targets). */
export function StarInput({ value, onChange, name = 'rating' }: { value: number; onChange: (value: number) => void; name?: string }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div>
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}: ${labels[n]}`}
            name={name}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            className="flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/25"
          >
            <Star className={cn('h-7 w-7 transition', n <= shown ? 'fill-secondary text-secondary scale-110' : 'text-slate-300')} />
          </button>
        ))}
      </div>
      <p className="mt-1 h-5 text-sm font-medium text-slate-600" aria-live="polite">
        {shown ? labels[shown] : 'Tap a star'}
      </p>
    </div>
  );
}
