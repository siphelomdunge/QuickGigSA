'use client';

import Link from 'next/link';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import type { WorkerProfile } from '@/lib/mock-data';
import { workerCompleteness } from '@/lib/profile-completeness';
import { cn } from '@/lib/utils';

export function ProfileCompleteness({ profile, compact = false, className }: { profile: WorkerProfile | null | undefined; compact?: boolean; className?: string }) {
  const { percent, items, missing } = workerCompleteness(profile);
  const complete = percent === 100;
  const tone = percent >= 80 ? 'bg-accent-500' : percent >= 50 ? 'bg-secondary-500' : 'bg-red-500';

  return (
    <section className={cn('panel p-5 sm:p-6', className)} aria-labelledby="completeness-heading">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="completeness-heading" className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Sparkles className="h-4 w-4 text-primary" />
            Profile strength
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {complete ? 'Your profile is complete. Clients see everything they need.' : `${missing.length} thing${missing.length === 1 ? '' : 's'} left. Complete profiles get picked more often.`}
          </p>
        </div>
        <p className="font-display text-3xl font-semibold leading-none text-slate-900" aria-label={`${percent} percent complete`}>
          {percent}%
        </p>
      </div>

      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completeness">
        <div className={cn('h-full rounded-full transition-all duration-500', tone)} style={{ width: `${percent}%` }} />
      </div>

      {!complete || !compact ? (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {(compact ? missing : items).map((item) => (
            <li key={item.key} className={cn('flex items-start gap-2.5 rounded-xl px-3 py-2 text-sm', item.done ? 'text-slate-500' : 'bg-slate-50 text-slate-800')}>
              {item.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />}
              <span>
                <span className={cn('font-medium', item.done && 'line-through decoration-slate-300')}>{item.label}</span>
                {!item.done ? <span className="block text-xs text-slate-500">{item.hint}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {compact && !complete ? (
        <Link href="/worker/profile" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:text-primary-700">
          Complete your profile →
        </Link>
      ) : null}
    </section>
  );
}
