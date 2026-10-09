import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const tones = {
  blue: 'from-primary-500 to-primary-700 shadow-glow-blue',
  orange: 'from-secondary-500 to-secondary-600 shadow-glow-orange',
  green: 'from-accent-500 to-emerald-600',
  slate: 'from-slate-600 to-slate-800',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'blue',
  hint,
  className,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: keyof typeof tones;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn('group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:p-5', className)}>
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-slate-100/80 transition duration-500 group-hover:scale-150 group-hover:bg-primary-50" />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 sm:tracking-[0.18em]">{label}</p>
        {Icon ? (
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white', tones[tone])}>
            <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
          </span>
        ) : null}
      </div>
      <p className="relative mt-4 font-display text-3xl font-semibold tabular-nums sm:text-4xl tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="relative mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
