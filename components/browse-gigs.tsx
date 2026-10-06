'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, MapPin, Search, SlidersHorizontal, Wallet } from 'lucide-react';
import { gigCategories } from '@/lib/mock-data';
import { usePlatformStore } from '@/lib/platform-store';
import { useAuth } from '@/lib/auth';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';

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

  const openCount = gigs.filter((gig) => gig.status === 'open').length;
  const userApplications = user ? applications.filter((application) => application.worker_id === user.id).length : 0;

  return (
    <div className="space-y-8">
      <section className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-soft sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-start">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <SlidersHorizontal className="h-4 w-4" />
              Gig filters
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Browse gigs near you</h1>
            <p className="mt-2 max-w-2xl text-slate-600">Search by task, area, date, category, or pay to find short-term local work.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.25rem] bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Open gigs</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{openCount}</p>
            </div>
            <div className="rounded-[1.25rem] bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Your applications</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{userApplications}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="md:col-span-2 xl:col-span-2 flex flex-col gap-2 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
            <span className="text-sm font-medium text-slate-700">Search</span>
            <span className="flex items-center gap-3">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="Search gigs or tasks"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </span>
          </label>
          <label className="flex flex-col gap-2 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
            <span className="text-sm font-medium text-slate-700">Location</span>
            <span className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-slate-400" />
              <input
                className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="Johannesburg"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </span>
          </label>
          <label className="flex flex-col gap-2 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
            <span className="text-sm font-medium text-slate-700">Minimum pay</span>
            <span className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-slate-400" />
              <input
                inputMode="numeric"
                className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="150"
                value={minPay}
                onChange={(event) => setMinPay(event.target.value)}
              />
            </span>
          </label>
          <label className="flex flex-col gap-2 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
            <span className="text-sm font-medium text-slate-700">Date</span>
            <span className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-slate-400" />
              <input
                className="w-full bg-transparent text-slate-900 outline-none"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </span>
          </label>
          <label className="md:col-span-2 xl:col-span-1 flex flex-col gap-2 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
            <span className="text-sm font-medium text-slate-700">Category</span>
            <select className="w-full bg-transparent text-slate-900 outline-none" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All categories</option>
              {gigCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Available gigs</h2>
            <p className="text-slate-500">{loading ? 'Loading demo data...' : `${filteredGigs.length} gig${filteredGigs.length === 1 ? '' : 's'} found`}</p>
          </div>
          <Link href="/register" className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600">
            Create profile
          </Link>
        </div>

        <div className="grid gap-5">
          {filteredGigs.length ? (
            filteredGigs.map((gig) => (
              <article key={gig.id} className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-soft">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">{gig.category}</span>
                      <StatusBadge status={gig.status} />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900">{gig.title}</h3>
                    <p className="max-w-3xl text-sm leading-6 text-slate-600">{gig.description}</p>
                    <p className="text-sm text-slate-500">{gig.location_area} • {gig.date} • {gig.start_time}-{gig.end_time}</p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">R{gig.pay_amount}</span>
                    <Link href={`/gigs/${gig.id}`} className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600">
                      View gig
                    </Link>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <EmptyState title="No gigs match those filters" description="Try a broader location, lower pay threshold, or another category." />
          )}
        </div>
      </section>
    </div>
  );
}
