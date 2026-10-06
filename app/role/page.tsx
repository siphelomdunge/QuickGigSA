import Link from 'next/link';

export default function RolePage() {
  return (
    <div className="space-y-8">
      <div className="card p-8">
        <h1 className="text-3xl font-semibold text-slate-900">Choose your QuickGig role</h1>
        <p className="mt-3 text-slate-600">Select the path that matches your goals and local work needs.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/register" className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-left shadow-soft transition hover:border-primary">
            <p className="text-xl font-semibold text-slate-900">Worker</p>
            <p className="mt-2 text-slate-600">Find gigs, apply for short-term jobs, and build a local profile.</p>
          </Link>
          <Link href="/register" className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-left shadow-soft transition hover:border-secondary">
            <p className="text-xl font-semibold text-slate-900">Client</p>
            <p className="mt-2 text-slate-600">Post small jobs for students and local workers near you.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
