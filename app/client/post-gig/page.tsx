'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { BriefcaseBusiness, MapPin, Sparkles, Wallet } from 'lucide-react';
import { AuthGate } from '@/components/auth-gate';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { gigCategories } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth';
import { usePlatformStore } from '@/lib/platform-store';

export default function PostGigPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { createGig } = usePlatformStore();
  const [notice, setNotice] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const [assisting, setAssisting] = useState(false);
  const [assistNotes, setAssistNotes] = useState<string[]>([]);
  const [previous, setPrevious] = useState<{ description: string; requirements: string } | null>(null);

  const field = (name: string) => formRef.current?.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;

  const improveWithAi = async () => {
    const read = (name: string) => field(name)?.value ?? '';
    setAssisting(true);
    setAssistNotes([]);
    try {
      // The private address is deliberately not sent.
      const session = supabase ? (await supabase.auth.getSession()).data.session : null;
      const response = await fetch('/api/gig-assist', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(session ? { authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          title: read('title'), category: read('category'), location_area: read('location_area'),
          date: read('date'), start_time: read('start_time'), end_time: read('end_time'),
          pay_amount: read('pay_amount'), workers_needed: read('workers_needed'),
          description: read('description'), requirements: read('requirements'),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not improve this gig.');
      setPrevious({ description: read('description'), requirements: read('requirements') });
      field('description')!.value = data.description;
      field('requirements')!.value = data.requirements;
      setAssistNotes([
        data.source === 'model'
          ? 'Suggestions added by AI. Read and edit them before you post.'
          : 'Tidied with built-in rules (AI is not set up). Read and edit before you post.',
        ...data.flags,
      ]);
    } catch (error) {
      setAssistNotes([error instanceof Error ? error.message : 'Could not improve this gig.']);
    } finally {
      setAssisting(false);
    }
  };

  const undoAssist = () => {
    if (!previous) return;
    field('description')!.value = previous.description;
    field('requirements')!.value = previous.requirements;
    setPrevious(null);
    setAssistNotes([]);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const form = new FormData(event.currentTarget);
    try {
      const gig = await createGig({
        client_id: user.id,
        title: String(form.get('title') ?? ''),
        description: String(form.get('description') ?? ''),
        category: String(form.get('category') ?? 'Delivery'),
        location_area: String(form.get('location_area') ?? ''),
        address_private: String(form.get('address_private') ?? ''),
        date: String(form.get('date') ?? ''),
        start_time: String(form.get('start_time') ?? ''),
        end_time: String(form.get('end_time') ?? ''),
        pay_amount: Number(form.get('pay_amount') ?? 0),
        workers_needed: Number(form.get('workers_needed') ?? 1),
        requirements: String(form.get('requirements') ?? ''),
      });

      setNotice('Gig posted successfully.');
      router.push(`/client/gigs/${gig.id}/applications`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not post this gig.');
    }
  };

  return (
    <AuthGate allowedRoles={['client']}>
      <div className="space-y-8">
        <section className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-secondary">Client tools</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Post a new gig</h1>
              <p className="mt-3 max-w-2xl text-slate-600">Create a clear short-term job post for local independent workers.</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-[1.25rem] bg-slate-50 p-4">
                <BriefcaseBusiness className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-2 text-xs font-semibold text-slate-600">Scope</p>
              </div>
              <div className="rounded-[1.25rem] bg-slate-50 p-4">
                <Wallet className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-2 text-xs font-semibold text-slate-600">Pay</p>
              </div>
              <div className="rounded-[1.25rem] bg-slate-50 p-4">
                <MapPin className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-2 text-xs font-semibold text-slate-600">Area</p>
              </div>
            </div>
          </div>
        </section>

        <form ref={formRef} onSubmit={handleSubmit} className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
          <div className="grid gap-5 md:grid-cols-2">
            <Input required name="title" label="Gig title" placeholder="Help at a local event" />
            <Select
              name="category"
              label="Category"
              options={gigCategories.map((category) => ({ value: category, label: category }))}
            />
            <Input required name="location_area" label="Public location area" placeholder="Braamfontein, Johannesburg" />
            <Input required name="address_private" label="Private address" placeholder="Shared only after acceptance" />
            <Input required name="date" label="Date" type="date" />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input required name="start_time" label="Start time" type="time" />
              <Input required name="end_time" label="End time" type="time" />
            </div>
            <Input required name="pay_amount" label="Pay amount (ZAR)" type="number" min="1" placeholder="250" />
            <Input required name="workers_needed" label="Workers needed" type="number" min="1" defaultValue="1" />
            <div className="md:col-span-2">
              <Textarea required name="description" label="Description" rows={4} placeholder="Explain the job, expected tasks, and local context." />
            </div>
            <div className="md:col-span-2">
              <Textarea required name="requirements" label="Requirements" rows={4} placeholder="List skills, transport needs, dress code, or anything workers should know." />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={improveWithAi} disabled={assisting}>
              <Sparkles className="mr-2 h-4 w-4" />
              {assisting ? 'Improving…' : 'Improve description and requirements'}
            </Button>
            {previous ? (
              <button type="button" onClick={undoAssist} className="text-sm font-medium text-slate-600 underline">
                Undo
              </button>
            ) : null}
          </div>
          {assistNotes.length ? (
            <ul className="mt-3 space-y-1 text-sm text-slate-600" aria-live="polite">
              {assistNotes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-sm leading-6 text-slate-500">Do not include payment processing details. Confirm scope, payment, and terms directly with accepted workers.</p>
            <Button type="submit" className="sm:min-w-40">Post gig</Button>
          </div>
          {notice ? <p className="mt-4 text-sm font-medium text-secondary">{notice}</p> : null}
        </form>
      </div>
    </AuthGate>
  );
}
