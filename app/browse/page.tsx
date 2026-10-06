import { BrowseGigs } from '@/components/browse-gigs';

export default function BrowsePage() {
  return (
    <div className="space-y-8">
      <div className="rounded-[1.5rem] bg-white p-6 shadow-soft sm:p-8">
        <h1 className="text-3xl font-semibold text-slate-900">Browse gigs</h1>
        <p className="mt-2 text-slate-600">Filter local gigs and discover new work opportunities in your community.</p>
      </div>
      <BrowseGigs />
    </div>
  );
}
