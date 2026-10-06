'use client';

import Link from 'next/link';
import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CalendarDays, Clock3, MapPin, ShieldCheck, UserRound, Users, Wallet } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { usePlatformStore } from '@/lib/platform-store';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Textarea } from '@/components/ui/textarea';
import { Toast } from '@/components/ui/toast';

interface GigPageProps {
  params: { id: string };
}

export default function GigPage({ params }: GigPageProps) {
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
  const gig = gigs.find((item) => item.id === params.id);

  const existingApplication = useMemo(() => {
    if (!user) return undefined;
    return applications.find((application) => application.gig_id === params.id && application.worker_id === user.id);
  }, [applications, params.id, user]);

  if (!gig) {
    return (
      <EmptyState
        title="Gig not found"
        description="This gig may have been removed or cancelled. Return to browsing to find available work."
        action={
          <Link href="/browse" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600">
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
    { label: 'Category', value: gig.category, icon: ShieldCheck },
    { label: 'Location', value: gig.location_area, icon: MapPin },
    { label: 'Date', value: gig.date, icon: CalendarDays },
    { label: 'Start time', value: gig.start_time, icon: Clock3 },
    { label: 'End time', value: gig.end_time, icon: Clock3 },
    { label: 'Pay amount', value: `R${gig.pay_amount}`, icon: Wallet },
    { label: 'Workers needed', value: String(gig.workers_needed), icon: Users },
    { label: 'Client name', value: gig.client_name, icon: UserRound },
  ];

  return (
    <div className="space-y-8">
      {toast ? <Toast message={toast} /> : null}
      <section className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-secondary">{gig.category}</p>
              <StatusBadge status={gig.status} />
            </div>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{gig.title}</h1>
            <p className="max-w-2xl leading-7 text-slate-600">{gig.description}</p>
          </div>
          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pay offered</p>
            <p className="mt-3 text-4xl font-semibold text-slate-900">R{gig.pay_amount}</p>
            <p className="mt-2 text-sm text-slate-600">Needs {gig.workers_needed} independent worker{gig.workers_needed === 1 ? '' : 's'}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <section className="space-y-6 rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {detailItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 rounded-[1.25rem] bg-slate-50 p-4">
                  <Icon className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                    <p className="font-semibold text-slate-900">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid gap-5">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Description</h2>
              <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">{gig.description}</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Requirements</h2>
              <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">{gig.requirements}</p>
            </div>
          </div>

          <div className="rounded-[1.25rem] bg-slate-50 p-4 text-sm text-slate-600">
            Exact address: {existingApplication?.status === 'accepted' ? gig.address_private : 'Shared privately after the client accepts an application.'}
          </div>
        </section>

        <aside className="space-y-5 rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
          <div className="space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-green-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Client</p>
            <p className="text-lg font-semibold text-slate-900">{gig.client_name}</p>
            <p className="text-sm leading-6 text-slate-600">Clients and workers agree directly on scope, payment, and terms. No payment processing is included in V1.</p>
          </div>

          {existingApplication ? (
            <div className="rounded-[1.25rem] bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">You applied to this gig</p>
              <div className="mt-3">
                <StatusBadge status={existingApplication.status} />
              </div>
            </div>
          ) : (
            <Button type="button" onClick={handleOpenApply} className="w-full" disabled={role === 'worker' && gig.status !== 'open'}>
              Apply for this Gig
            </Button>
          )}

          {notice ? <p className="text-sm font-medium text-secondary">{notice}</p> : null}
          <Button type="button" variant="outline" onClick={handleOpenReport} className="w-full gap-2">
            <AlertTriangle className="h-4 w-4" />
            Report this gig
          </Button>
          <Link href="/browse" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-blue-600">
            <Wallet className="h-4 w-4" />
            Back to browse
          </Link>
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
