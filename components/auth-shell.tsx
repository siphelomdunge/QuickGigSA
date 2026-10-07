import type { ReactNode } from 'react';
import { CheckCircle2, Star, Zap } from 'lucide-react';

/**
 * Two-column shell for login / register / password pages:
 * a brand panel on the left (hidden on small screens) and the form on the right.
 */
export function AuthShell({ title, subtitle, children, aside }: { title: string; subtitle: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
      <aside className="relative hidden overflow-hidden rounded-3xl bg-slate-950 p-8 text-white shadow-premium lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-primary-600/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-secondary-500/30 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-grid-slate opacity-[0.07] [background-size:28px_28px] invert" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
            <Zap className="h-3.5 w-3.5 fill-secondary text-secondary" />
            Built for South African youth
          </span>
          <h2 className="mt-8 font-display text-4xl font-semibold leading-tight tracking-tight">
            Real work, close to home, <span className="text-gradient bg-gradient-to-r from-blue-300 via-white to-orange-300">on your terms.</span>
          </h2>
          <ul className="mt-8 space-y-3 text-sm text-white/80">
            {['Apply in under a minute', 'No fees for workers, ever', 'Private addresses shared only after acceptance', 'Report unsafe gigs to admins'].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-accent-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {aside ?? (
          <figure className="relative mt-10 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="flex items-center gap-1 text-secondary">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <blockquote className="mt-3 text-sm leading-6 text-white/85">
              “I picked up three weekend event shifts in my first month. The pay was agreed upfront and the client was verified.”
            </blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-bold">LM</span>
              <div>
                <p className="text-sm font-semibold">Lebo M.</p>
                <p className="text-xs text-white/60">Student worker · Johannesburg</p>
              </div>
            </figcaption>
          </figure>
        )}
      </aside>

      <section className="panel animate-fade-up p-6 sm:p-8 lg:p-10">
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">{title}</h1>
        <p className="mt-3 leading-7 text-slate-600">{subtitle}</p>
        {children}
      </section>
    </div>
  );
}
