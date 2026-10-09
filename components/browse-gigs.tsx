'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, MapPin, Search, SlidersHorizontal, Sparkles, Wallet, X } from 'lucide-react';
import { gigCategories } from '@/lib/mock-data';
import { usePlatformStore } from '@/lib/platform-store';
import { useAuth } from '@/lib/auth';
import { EmptyState } from '@/components/ui/empty-state';
import { GigCard } from '@/components/gig-card';
import { cn } from '@/lib/utils';

function FilterField({ label, icon: Icon, children, className }: { label: string; icon: typeof Search; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn('group flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-500/10 hover:border-slate-300', className)}>
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
      <span className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 shrink-0 text-slate-400 transition group-focus-within:text-primary" />
        {children}
      </span>
    </label>
  );
}

export function BrowseGigs() {
  const { gigs, applications, loading } = usePlatformStore();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [minPay, setMinPay] = useState('');
  const [date, setDate] = useState('');

  const filteredGigs = useMemo(() => {
    return gigs.filter((gig) => {
      const haystack = `${gig.title} ${gig.description} ${gig.requirements}`.toLowerCase();
      const matchesQuery = query ? haystack.includes(query.toLowerCase()) : true;
      const matchesCategory = category ? gig.category === category : true;
      const matchesLocation = location ? gig.location_area.toLowerCase().includes(location.toLowerCase()) : true;
      const matchesPay = minPay ? gig.pay_amount >= Number(minPay) : true;
      const matchesDate = date ? gig.date === date : true;
      return matchesQuery && matchesCategory && matchesLocation && matchesPay && matchesDate && gig.status !== 'cancelled';
    });
  }, [category, date, gigs, location, minPay, query]);

  const appliedGigIds = useMemo(() => new Set(user ? applications.filter((a) => a.worker_id === user.id).map((a) => a.gig_id) : []), [applications, user]);
  const openCount = gigs.filter((gig) => gig.status === 'open').length;
  const hasFilters = Boolean(query || category || location || minPay || date);
  const clearFilters = () => {
    setQuery('');
    setCategory('');
    setLocation('');
    setMinPay('');
    setDate('');
  };

  const inputClass = 'w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400';

  return (
    <div className="space-y-8">
      <section className="page-hero p-5 sm:p-8">
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow">Browse</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">Find short-term work near you</h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600">Search by task, area, date, category or pay. New gigs are added by local clients every week.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-soft backdrop-blur">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-emerald-600 text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-2xl font-semibold leading-none text-slate-900">{openCount}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">open right now</p>
            </div>
          </div>
        </div>

        <div className="relative mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <FilterField label="Search" icon={Search} className="md:col-span-2 xl:col-span-2">
            <input className={inputClass} placeholder="Search gigs or tasks" value={query} onChange={(event) => setQuery(event.target.value)} />
          </FilterField>
          <FilterField label="Location" icon={MapPin}>
            <input className={inputClass} placeholder="Johannesburg" value={location} onChange={(event) => setLocation(event.target.value)} />
          </FilterField>
          <FilterField label="Min pay (R)" icon={Wallet}>
            <input inputMode="numeric" className={inputClass} placeholder="150" value={minPay} onChange={(event) => setMinPay(event.target.value)} />
          </FilterField>
          <FilterField label="Date" icon={CalendarDays}>
            <input className={inputClass} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </FilterField>
          <FilterField label="Category" icon={SlidersHorizontal}>
            <select className={cn(inputClass, 'cursor-pointer')} value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All categories</option>
              {gigCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </FilterField>
        </div>

        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCategory('')}
            className={cn('inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition', !category ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50')}
          >
            All
          </button>
          {gigCategories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(category === item ? '' : item)}
              className={cn('inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition', category === item ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50')}
            >
              {item}
            </button>
          ))}
          {hasFilters ? (
            <button type="button" onClick={clearFilters} className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
              <X className="h-3.5 w-3.5" />
              Clear filters
            </button>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Available gigs</h2>
            <p className="text-slate-500">{loading ? 'Loading gigs…' : `${filteredGigs.length} gig${filteredGigs.length === 1 ? '' : 's'} found`}</p>
          </div>
          {!user ? (
            <Link href="/register" className="inline-flex items-center justify-center rounded-full bg-gradient-to-b from-primary-500 to-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-glow-blue ring-1 ring-inset ring-white/20 transition hover:shadow-lift">
              Create a free profile
            </Link>
          ) : null}
        </div>

        <div className="grid gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => <div key={index} className="skeleton h-40" />)
          ) : filteredGigs.length ? (
            <ul className="grid gap-4" aria-label="Gigs">
              {filteredGigs.map((gig, index) => (
                <li key={gig.id}>
                  <GigCard gig={gig} index={index} applied={appliedGigIds.has(gig.id)} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Search}
              title="No gigs match those filters"
              description="Try a broader location, lower pay threshold, or another category."
              action={
                hasFilters ? (
                  <button type="button" onClick={clearFilters} className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                    Clear filters
                  </button>
                ) : undefined
              }
            />
          )}
        </div>
      </section>
    </div>
  );
}
