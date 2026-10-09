'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { gigCategories, type Gig } from '@/lib/mock-data';

export type GigFormValues = Pick<Gig, 'title' | 'description' | 'category' | 'location_area' | 'address_private' | 'date' | 'start_time' | 'end_time' | 'pay_amount' | 'workers_needed' | 'requirements'>;

interface GigFormProps {
  /** Existing values when editing; omit when posting. */
  initial?: Partial<GigFormValues>;
  submitLabel: string;
  onSubmit: (values: GigFormValues) => Promise<void>;
  footerNote?: string;
}

/** The post/edit gig form, including the AI "improve" helper. */
export function GigForm({ initial, submitLabel, onSubmit, footerNote }: GigFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
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
    if (saving) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setNotice('');
    try {
      await onSubmit({
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
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not save this gig.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="panel p-6 sm:p-8">
      <div className="grid gap-5 md:grid-cols-2">
        <Input required name="title" label="Gig title" placeholder="Help at a local event" defaultValue={initial?.title} />
        <Select name="category" label="Category" options={gigCategories.map((category) => ({ value: category, label: category }))} defaultValue={initial?.category} />
        <Input required name="location_area" label="Public location area" placeholder="Braamfontein, Johannesburg" defaultValue={initial?.location_area} />
        <Input required name="address_private" label="Private address" placeholder="Shared only after acceptance" defaultValue={initial?.address_private} />
        <Input required name="date" label="Date" type="date" defaultValue={initial?.date} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input required name="start_time" label="Start time" type="time" defaultValue={initial?.start_time} />
          <Input required name="end_time" label="End time" type="time" defaultValue={initial?.end_time} />
        </div>
        <Input required name="pay_amount" label="Pay amount (ZAR)" type="number" min="1" placeholder="250" defaultValue={initial?.pay_amount} />
        <Input required name="workers_needed" label="Workers needed" type="number" min="1" defaultValue={initial?.workers_needed ?? 1} />
        <div className="md:col-span-2">
          <Textarea required name="description" label="Description" rows={4} placeholder="Explain the job, expected tasks, and local context." defaultValue={initial?.description} />
        </div>
        <div className="md:col-span-2">
          <Textarea required name="requirements" label="Requirements" rows={4} placeholder="List skills, transport needs, dress code, or anything workers should know." defaultValue={initial?.requirements} />
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

      <div className="sticky bottom-3 mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-card backdrop-blur sm:static sm:flex-row sm:items-center sm:justify-between sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        <p className="hidden max-w-xl text-sm leading-6 text-slate-500 sm:block">{footerNote ?? 'Do not include payment processing details. Confirm scope, payment, and terms directly with accepted workers.'}</p>
        <Button type="submit" loading={saving} className="sm:min-w-40">
          {submitLabel}
        </Button>
      </div>
      {notice ? (
        <p className="mt-4 text-sm font-medium text-red-600" role="alert">
          {notice}
        </p>
      ) : null}
    </form>
  );
}
