import { cn } from '@/lib/utils';

const toneClasses = {
  blue: 'bg-primary/10 text-primary',
  orange: 'bg-secondary/10 text-secondary',
  green: 'bg-accent/10 text-green-700',
  slate: 'bg-slate-100 text-slate-700',
  red: 'bg-red-50 text-red-700',
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

  return (
    <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize', toneClasses[tone], className)}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
