import { cn } from '@/lib/utils';

const toneClasses = {
  blue: 'bg-primary-50 text-primary-700 ring-primary-200/70',
  orange: 'bg-secondary-50 text-orange-700 ring-secondary-200/70',
  green: 'bg-accent-50 text-accent-700 ring-green-200/70',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200/80',
  red: 'bg-red-50 text-red-700 ring-red-200/70',
};

const dotClasses = {
  blue: 'bg-primary-500',
  orange: 'bg-secondary-500',
  green: 'bg-accent-500',
  slate: 'bg-slate-400',
  red: 'bg-red-500',
};

const statusTone: Record<string, keyof typeof toneClasses> = {
  open: 'green',
  pending: 'orange',
  accepted: 'blue',
  verified: 'green',
  completed: 'green',
  closed: 'slate',
  cancelled: 'red',
  rejected: 'red',
  unverified: 'slate',
  investigating: 'orange',
  resolved: 'green',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = statusTone[status] ?? 'slate';
  const live = status === 'open' || status === 'pending' || status === 'investigating';

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset', toneClasses[tone], className)}>
      <span className="relative flex h-1.5 w-1.5">
        {live ? <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', dotClasses[tone])} /> : null}
        <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', dotClasses[tone])} />
      </span>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
