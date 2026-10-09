'use client';

import Link from 'next/link';
import { use, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, CalendarDays, CheckCircle2, Clock3, Lock, MapPin, ShieldCheck, Unlock, Users } from 'lucide-react';
import { formatDateLong, formatRand } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import { usePlatformStore } from '@/lib/platform-store';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Textarea } from '@/components/ui/textarea';
import { Toast } from '@/components/ui/toast';

interface GigPageProps {
  params: Promise<{ id: string }>;
}

export default function GigPage({ params }: GigPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { gigs, applications, applyToGig, createReport } = usePlatformStore();
  const { user, role } = useAuth();
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [reportReason, setReportReason] = useState('Safety concern');
  const [reportDescription, setReportDescription] = useState('');
  const [notice, setNotice] = useState('');
  const [toast, setToast] = useState('');
  const gig = gigs.find((item) => item.id === id);

  const existingApplication = useMemo(() => {
    if (!user) return undefined;
    return applications.find((application) => application.gig_id === id && application.worker_id === user.id);
  }, [applications, id, user]);

  if (!gig) {
    return (
      <EmptyState
        title="Gig not found"
        description="This gig may have been removed or cancelled. Return to browsing to find available work."
        action={
          <Link href="/browse" className="rounded-full bg-gradient-to-b from-primary-500 to-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-glow-blue ring-1 ring-inset ring-white/20 transition hover:shadow-lift">
            Browse gigs
          </Link>
        }
      />
    );
  }

  const canApply = role === 'worker' && gig.status === 'open' && !existingApplication;

  const handleOpenApply = () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (role !== 'worker') {
      setNotice('Please use a worker account to apply for gigs.');
      return;
    }

    if (existingApplication) {
      setNotice('You have already applied for this gig.');
      return;
    }

    setNotice('');
    setIsApplyOpen(true);
  };

  const handleSubmitApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !canApply) return;

    try {
      await applyToGig({
        gig_id: gig.id,
        worker_id: user.id,
        worker_name: (user.user_metadata as any)?.full_name ?? user.email ?? 'QuickGig worker',
        message: message.trim(),
      });

      setIsApplyOpen(false);
      setMessage('');
      setToast('Application submitted successfully.');
      window.setTimeout(() => {
        router.push('/worker/applications');
      }, 700);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not submit this application.');
      setIsApplyOpen(false);
    }
  };

  const handleOpenReport = () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setNotice('');
    setIsReportOpen(true);
  };

  const handleSubmitReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    try {
      await createReport({
        reported_by: user.id,
        reported_user_id: gig.client_id,
        gig_id: gig.id,
        reason: reportReason,
        description: reportDescription.trim(),
      });
      setIsReportOpen(false);
      setReportReason('Safety concern');
      setReportDescription('');
      setToast('Report submitted. Admin will review it.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not submit this report.');
      setIsReportOpen(false);
    }
  };

  const detailItems = [
    { label: 'Date', value: formatDateLong(gig.date), icon: CalendarDays, tone: 'text-secondary bg-secondary-50' },
    { label: 'Time', value: `${gig.start_time} – ${gig.end_time}`, icon: Clock3, tone: 'text-primary bg-primary-50' },
    { label: 'Area', value: gig.location_area, icon: MapPin, tone: 'text-accent-700 bg-accent-50' },
    { label: 'Workers needed', value: `${gig.workers_needed} independent worker${gig.workers_needed === 1 ? '' : 's'}`, icon: Users, tone: 'text-violet-700 bg-violet-50' },
  ];
  const addressUnlocked = existingApplication?.status === 'accepted' || existingApplication?.status === 'completed';

  return (
    <div className="space-y-6">
      {toast ? <Toast message={toast} /> : null}

      <Link href="/browse" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Back to all gigs
      </Link>

      <section className="page-hero p-6 sm:p-8 lg:p-10">
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">{gig.category}</span>
              <StatusBadge status={gig.status} />
            </div>
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl lg:text-5xl">{gig.title}</h1>
            <p className="inline-flex items-center gap-2 text-sm text-slate-600">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
                {gig.client_name.slice(0, 2).toUpperCase()}
              </span>
              Posted by <span className="font-semibold text-slate-900">{gig.client_name}</span>
            </p>
          </div>
          <div className="shrink-0 rounded-2xl bg-slate-900 p-6 text-white shadow-premium lg:min-w-[15rem]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Pay offered</p>
            <p className="mt-2 font-display text-5xl font-semibold tabular-nums tracking-tight">{formatRand(gig.pay_amount)}</p>
            <p className="mt-2 text-sm text-white/70">for the gig · agreed directly with the client</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <section className="space-y-8 panel p-6 sm:p-8">
          <div className="grid gap-3 sm:grid-cols-2">
            {detailItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3.5 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.tone}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                    <p className="truncate font-semibold text-slate-900">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-7">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">About this gig</h2>
              <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">{gig.description}</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">What the client needs</h2>
              <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">{gig.requirements}</p>
            </div>
          </div>

          <div className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${addressUnlocked ? 'border-accent-100 bg-accent-50 text-accent-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
            {addressUnlocked ? <Unlock className="mt-0.5 h-4 w-4 shrink-0" /> : <Lock className="mt-0.5 h-4 w-4 shrink-0" />}
            <p>
              <span className="font-semibold">Exact address: </span>
              {addressUnlocked ? gig.address_private : 'Shared privately once the client accepts your application.'}
            </p>
          </div>
        </section>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="panel p-6">
            {existingApplication ? (
              <div className="rounded-xl border border-primary-100 bg-primary-50/60 p-4">
                <p className="text-sm font-semibold text-slate-900">You applied to this gig</p>
                <p className="mt-1 text-xs text-slate-600">Track it under My applications.</p>
                <div className="mt-3">
                  <StatusBadge status={existingApplication.status} />
                </div>
              </div>
            ) : (
              <>
                <Button type="button" onClick={handleOpenApply} size="lg" className="w-full" disabled={role === 'worker' && gig.status !== 'open'}>
                  Apply for this Gig
                </Button>
                <p className="mt-3 text-center text-xs text-slate-500">Takes under a minute. No fees, ever.</p>
              </>
            )}
            {notice ? <p className="mt-4 rounded-xl bg-secondary-50 px-3 py-2 text-sm font-medium text-orange-800">{notice}</p> : null}
          </div>

          <div className="panel p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-700">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Stay safe</p>
                <p className="font-semibold text-slate-900">How QuickGig works</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2.5 text-sm leading-6 text-slate-600">
              <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-accent" />Clients and workers agree directly on scope, pay and terms.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-accent" />Never pay a fee to get a gig. Report anyone who asks.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-accent" />Private addresses are only shared after acceptance.</li>
            </ul>
            <Button type="button" variant="outline" onClick={handleOpenReport} className="mt-5 w-full">
              <AlertTriangle className="h-4 w-4" />
              Report this gig
            </Button>
          </div>
        </aside>
      </div>

      <Dialog
        open={isApplyOpen}
        title="Apply for this Gig"
        description="Tell the client why you are a good fit. Keep it clear, honest, and specific."
        onClose={() => setIsApplyOpen(false)}
      >
        <form onSubmit={handleSubmitApplication} className="space-y-5">
          <Textarea
            required
            label="Why are you a good fit for this gig?"
            rows={6}
            placeholder="Mention your availability, relevant skills, experience, and transport if needed."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setIsApplyOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Submit Application</Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={isReportOpen}
        title="Report this gig"
        description="Send a safety or trust concern to QuickGig SA admin. Reports do not guarantee an outcome, but they help us review platform activity."
        onClose={() => setIsReportOpen(false)}
      >
        <form onSubmit={handleSubmitReport} className="space-y-5">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Reason</span>
            <select
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
              className="w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              <option>Safety concern</option>
              <option>Suspicious client</option>
              <option>Misleading gig details</option>
              <option>Payment concern</option>
              <option>Harassment or abuse</option>
              <option>Other</option>
            </select>
          </label>
          <Textarea
            required
            label="Description"
            rows={5}
            placeholder="Describe what happened or what looks wrong."
            value={reportDescription}
            onChange={(event) => setReportDescription(event.target.value)}
          />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setIsReportOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary">
              Submit report
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
