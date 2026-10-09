import Link from 'next/link';
import { ArrowUpRight, CalendarDays, Clock3, MapPin, Users } from 'lucide-react';
import type { Gig } from '@/lib/mock-data';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDateShort, formatRand } from '@/lib/format';

/** Category → colour accent so the list scans quickly. */
const categoryTone: Record<string, string> = {
  Delivery: 'from-primary-500 to-primary-700',
  Events: 'from-secondary-500 to-rose-500',
  Cleaning: 'from-accent-500 to-emerald-600',
  Tech: 'from-violet-500 to-indigo-600',
  Tutoring: 'from-amber-400 to-orange-500',
  Admin: 'from-slate-600 to-slate-800',
  Promotions: 'from-pink-500 to-fuchsia-600',
  Home: 'from-teal-500 to-cyan-600',
};

function toneFor(category: string) {
  const key = Object.keys(categoryTone).find((name) => category.toLowerCase().includes(name.toLowerCase()));
  return key ? categoryTone[key] : 'from-primary-500 to-primary-700';
}

export function GigCard({ gig, index = 0, applied = false }: { gig: Gig; index?: number; applied?: boolean }) {
  return (
    <article className="group panel-sm animate-fade-up overflow-hidden" style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
      <div className={`h-1 w-full bg-gradient-to-r ${toneFor(gig.category)} opacity-80`} />
      <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between sm:p-6">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">{gig.category}</span>
            <StatusBadge status={gig.status} />
            {applied ? <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 ring-1 ring-inset ring-primary-200/70">Applied</span> : null}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900 transition group-hover:text-primary-700">
              <Link href={`/gigs/${gig.id}`} className="focus:outline-none">
                {gig.title}
              </Link>
            </h3>
            <p className="mt-1 text-sm text-slate-500">{gig.client_name}</p>
          </div>
          <p className="line-clamp-2 max-w-3xl text-sm leading-6 text-slate-600">{gig.description}</p>
          <dl className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
            <div className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" />
              <dd>{gig.location_area}</dd>
            </div>
            <div className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-secondary" />
              <dd>{formatDateShort(gig.date)}</dd>
            </div>
            <div className="inline-flex items-center gap-1.5">
              <Clock3 className="h-4 w-4 text-slate-400" />
              <dd>
                {gig.start_time}–{gig.end_time}
              </dd>
            </div>
            <div className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4 text-slate-400" />
              <dd>
                {gig.workers_needed} needed
              </dd>
            </div>
          </dl>
        </div>
        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-slate-100 pt-4 lg:flex-col lg:items-end lg:border-0 lg:pt-0">
          <div className="text-right">
            <p className="font-display text-3xl font-semibold tabular-nums tracking-tight text-slate-900">{formatRand(gig.pay_amount)}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">per gig</p>
          </div>
          <Link
            href={`/gigs/${gig.id}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-600 hover:shadow-glow-blue"
          >
            View gig
            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
