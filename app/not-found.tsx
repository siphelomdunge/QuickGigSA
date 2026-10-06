import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-slate-200 bg-white p-10 text-center shadow-soft">
      <p className="text-sm uppercase tracking-[0.24em] text-secondary">Page not found</p>
      <h1 className="mt-4 text-4xl font-semibold text-slate-900">We couldn&apos;t find that page.</h1>
      <p className="mt-4 text-slate-600">Head back to the marketplace and keep looking for gigs.</p>
      <Link href="/" className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-600">
        Return home
      </Link>
    </div>
  );
}
