import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Headphones,
  Home,
  Laptop,
  MapPin,
  PartyPopper,
  Search,
  Send,
  ShieldCheck,
  Star,
  Truck,
  UserCheck,
  Wallet,
  Zap,
} from 'lucide-react';

const steps = [
  {
    title: 'Create profile',
    description: 'Build a worker or client profile with location, skills, and verification status.',
    icon: UserCheck,
  },
  {
    title: 'Find or post gigs',
    description: 'Browse nearby tasks or publish short-term jobs for local independent workers.',
    icon: Search,
  },
  {
    title: 'Apply and connect',
    description: 'Send fast applications, track status, and confirm work details directly.',
    icon: Send,
  },
];

const categories = [
  { title: 'Delivery & errands', description: 'Local drops, collections, and quick runs.', icon: Truck },
  { title: 'Events & hospitality', description: 'Shifts for markets, venues, and activations.', icon: PartyPopper },
  { title: 'Tech & support', description: 'Setup help, admin tools, and basic support.', icon: Laptop },
  { title: 'Home services', description: 'Cleaning, setup, and neighbourhood tasks.', icon: Home },
  { title: 'Tutoring', description: 'Study support, homework help, and coaching.', icon: GraduationCap },
  { title: 'Admin help', description: 'Data capture, filing, and front-desk support.', icon: ClipboardList },
];

const trustItems = ['Local gigs', 'Verified profiles', 'Fast applications'];

function FadeUp({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <div className={`animate-fade-up ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`glass-panel rounded-[1.75rem] ${className}`}>{children}</div>;
}

function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <FadeUp className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-semibold uppercase text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">{title}</h2>
      <p className="mt-4 leading-7 text-slate-600">{description}</p>
    </FadeUp>
  );
}

function StepCard({ step, index }: { step: (typeof steps)[number]; index: number }) {
  const Icon = step.icon;
  return (
    <FadeUp delay={index * 120}>
      <GlassCard className="lift-card h-full p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-500 text-white shadow-glow-blue">
            <Icon className="h-6 w-6" />
          </div>
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-primary shadow-sm">0{index + 1}</span>
        </div>
        <h3 className="mt-6 text-xl font-semibold text-slate-950">{step.title}</h3>
        <p className="mt-3 leading-7 text-slate-600">{step.description}</p>
      </GlassCard>
    </FadeUp>
  );
}

function CategoryCard({ category, index }: { category: (typeof categories)[number]; index: number }) {
  const Icon = category.icon;
  const gradients = [
    'from-primary to-blue-500',
    'from-secondary to-orange-400',
    'from-accent to-emerald-400',
  ];

  return (
    <FadeUp delay={index * 70}>
      <Link href="/browse" className="group block h-full">
        <GlassCard className="lift-card h-full p-5">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradients[index % gradients.length]} text-white shadow-lg`}>
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-slate-950">{category.title}</h3>
          <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{category.description}</p>
          <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            View gigs
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </div>
        </GlassCard>
      </Link>
    </FadeUp>
  );
}

function FloatingCard({ children, className = '', rotate = '0deg', delay = 0 }: { children: ReactNode; className?: string; rotate?: string; delay?: number }) {
  return (
    <div
      className={`animate-float-slow rounded-[1.5rem] border border-white/80 bg-white/80 p-4 shadow-premium backdrop-blur-xl ${className}`}
      style={{ '--float-rotate': rotate, animationDelay: `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto min-h-[460px] w-full max-w-xl overflow-visible px-2 py-8 sm:min-h-[520px]">
      <div className="absolute inset-8 rounded-[2rem] bg-gradient-to-br from-primary/12 via-white/50 to-accent/12 shadow-glow-blue" />
      <div className="absolute inset-x-10 top-16 h-40 skew-y-6 rounded-[2rem] bg-gradient-to-r from-primary/12 via-secondary/10 to-accent/12 blur-xl" />

      <FloatingCard className="absolute left-1 top-8 z-20 w-44 sm:left-0 sm:top-12" rotate="-5deg" delay={200}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">3 new gigs</p>
            <p className="text-xs text-slate-500">near you</p>
          </div>
        </div>
      </FloatingCard>

      <FloatingCard className="absolute right-0 top-24 z-20 w-44 sm:right-4" rotate="4deg" delay={650}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-green-700">
            <BadgeCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">Verified worker</p>
            <p className="text-xs text-slate-500">ready today</p>
          </div>
        </div>
      </FloatingCard>

      <div className="absolute left-1/2 top-36 z-10 w-[88%] max-w-sm -translate-x-1/2 rotate-[-2deg] transform-gpu rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-premium backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:rotate-0 sm:top-40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-secondary">Featured gig</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">Event Assistant</h3>
          </div>
          <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-green-700">Open</span>
        </div>
        <div className="mt-6 grid gap-3">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50/90 p-3">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-slate-700">Cape Town CBD</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-blue-50 p-4">
              <Wallet className="h-5 w-5 text-primary" />
              <p className="mt-2 text-xl font-semibold text-slate-950">R450</p>
            </div>
            <div className="rounded-2xl bg-orange-50 p-4">
              <CalendarDays className="h-5 w-5 text-secondary" />
              <p className="mt-2 text-xl font-semibold text-slate-950">Today</p>
            </div>
          </div>
        </div>
        <Link href="/browse" className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-glow-blue transition hover:bg-blue-600">
          Apply now
        </Link>
      </div>

      <FloatingCard className="absolute bottom-16 left-8 z-20 w-40 sm:bottom-20" rotate="3deg" delay={900}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">Paid today</p>
            <p className="text-xs text-slate-500">terms agreed</p>
          </div>
        </div>
      </FloatingCard>

      <div className="absolute bottom-8 right-6 z-10 rounded-[1.5rem] border border-white/80 bg-slate-950 p-4 text-white shadow-premium">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 fill-secondary text-secondary" />
          <span className="text-sm font-semibold">4.8 rating</span>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="relative overflow-hidden pb-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px] bg-[linear-gradient(120deg,rgba(37,99,235,0.12),rgba(255,255,255,0.28),rgba(34,197,94,0.10))]" />
      <div className="pointer-events-none absolute inset-x-0 top-20 -z-10 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <section className="grid min-h-[calc(100vh-120px)] gap-10 py-8 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:py-12">
        <FadeUp className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/75 px-4 py-2 text-sm font-semibold text-primary shadow-sm backdrop-blur">
            <ShieldCheck className="h-4 w-4" />
            Built for South African youth
          </span>
          <h1 className="mt-6 text-5xl font-semibold leading-[1.05] text-slate-950 sm:text-6xl lg:text-7xl">
            Find local gigs. <span className="text-gradient">Earn faster.</span> Build your profile.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            QuickGig SA connects students, freelancers, and local workers with trusted short-term gigs nearby.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/browse" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-primary-500 to-primary-600 px-7 py-3 text-base font-semibold text-white shadow-glow-blue ring-1 ring-inset ring-white/20 transition hover:-translate-y-0.5 hover:shadow-lift">
              Browse gigs
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/client/post-gig" className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-white/85 px-7 py-3 text-base font-semibold text-slate-800 shadow-soft backdrop-blur transition hover:-translate-y-0.5 hover:border-secondary/40">
              Post a gig
            </Link>
          </div>
          <div className="mt-10 grid max-w-md grid-cols-3 divide-x divide-slate-200 rounded-2xl border border-slate-200/80 bg-white/70 shadow-soft backdrop-blur">
            {[
              { value: '8', label: 'categories' },
              { value: 'R0', label: 'worker fees' },
              { value: '<1 min', label: 'to apply' },
            ].map((stat) => (
              <div key={stat.label} className="px-4 py-3 text-center">
                <p className="font-display text-2xl font-semibold tracking-tight text-slate-900">{stat.value}</p>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {trustItems.map((item) => (
              <span key={item} className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                {item}
              </span>
            ))}
          </div>
        </FadeUp>

        <FadeUp delay={150}>
          <HeroVisual />
        </FadeUp>
      </section>

      <section className="py-14">
        <SectionHeader
          eyebrow="How it works"
          title="Start local work in three simple moves."
          description="QuickGig SA keeps posting, applying, and reviewing lightweight enough for busy students, small businesses, and local teams."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <StepCard key={step.title} step={step} index={index} />
          ))}
        </div>
      </section>

      <section className="py-14">
        <SectionHeader
          eyebrow="Popular categories"
          title="Gigs built around real local demand."
          description="From events to tutoring, workers can find practical short-term opportunities and clients can fill small jobs quickly."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <CategoryCard key={category.title} category={category} index={index} />
          ))}
        </div>
      </section>

      <section className="grid gap-8 py-14 lg:grid-cols-[1fr_0.86fr] lg:items-center">
        <FadeUp>
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase text-primary">Safety first</p>
            <h2 className="text-3xl font-semibold text-slate-950 sm:text-4xl">Built for safe local connections</h2>
            <p className="max-w-2xl leading-8 text-slate-600">
              The marketplace is designed around visibility, verification, and clear application tracking so clients and independent workers can connect with more confidence.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {['Profile verification', 'Application tracking', 'Client and worker ratings', 'Report unsafe gigs'].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                  <span className="font-semibold text-slate-800">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={140}>
          <GlassCard className="lift-card p-6">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-premium">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-xl font-semibold">
                    LM
                  </div>
                  <div>
                    <p className="text-xl font-semibold">Lebo M.</p>
                    <p className="text-sm text-white/70">Student worker</p>
                  </div>
                </div>
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-slate-950">Verified</span>
              </div>
              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase text-white/60">Skills</p>
                  <p className="mt-2 font-semibold">Events, Admin, Promotions</p>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/10 p-4">
                  <span className="text-sm text-white/70">Rating</span>
                  <span className="inline-flex items-center gap-2 font-semibold">
                    <Star className="h-4 w-4 fill-secondary text-secondary" />
                    4.8
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        </FadeUp>
      </section>

      <section className="py-14">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-blue-600 to-slate-950 p-6 text-white shadow-premium sm:p-10 lg:p-12">
          <div className="absolute inset-x-0 top-0 h-px bg-white/40" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase text-blue-100">Ready when you are</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-5xl">Ready to find your next gig?</h2>
              <p className="mt-4 max-w-2xl leading-7 text-blue-50">
                Join as a worker to apply nearby, or post a short-term gig for local help today.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 py-3 font-semibold text-primary shadow-lg transition hover:-translate-y-0.5">
                Join as worker
              </Link>
              <Link href="/client/post-gig" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15">
                Post a gig
              </Link>
            </div>
          </div>
          <BriefcaseBusiness className="absolute -bottom-8 right-8 h-36 w-36 rotate-12 text-white/10" />
          <Headphones className="absolute right-36 top-8 h-16 w-16 -rotate-12 text-white/10" />
        </div>
      </section>
    </div>
  );
}
