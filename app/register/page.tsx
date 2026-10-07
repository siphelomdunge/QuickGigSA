'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthShell } from '@/components/auth-shell';
import terms from '@/content/terms.json';
import privacy from '@/content/privacy.json';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [role, setRole] = useState('worker');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isAdult, setIsAdult] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Warm the destination route so the post-signup redirect is instant on slow mobile connections.
  useEffect(() => {
    router.prefetch('/worker/dashboard');
    router.prefetch('/client/dashboard');
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    if (!isAdult || !agreed) {
      setMessage('Please confirm you are 18 or older and accept the Terms and Privacy Policy.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await signUp({
        email, password, full_name: fullName, phone, location, role,
        consent: { terms_version: `${terms.version}; ${privacy.version}` },
      });
      if (result.needsEmailConfirmation) {
        setMessage('Check your email for a verification link. Then return to login.');
        return;
      }

      setMessage('Account created. Taking you to your dashboard…');
      router.replace(role === 'client' ? '/client/dashboard' : '/worker/dashboard');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create your account. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Create your QuickGig SA profile" subtitle="Sign up to start applying for gigs or posting jobs in your neighbourhood.">
      <div className="mt-8 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Choose role">
        {[
          { value: 'worker', title: 'I want to work', description: 'Find and apply to local gigs.' },
          { value: 'client', title: 'I need help', description: 'Post gigs and review applicants.' },
        ].map((option) => {
          const active = role === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setRole(option.value)}
              className={`rounded-2xl border p-4 text-left transition ${active ? 'border-primary-400 bg-primary-50/60 shadow-glow-blue ring-4 ring-primary-500/10' : 'border-slate-200 bg-white hover:border-slate-300'}`}
            >
              <p className={`text-sm font-semibold ${active ? 'text-primary-800' : 'text-slate-900'}`}>{option.title}</p>
              <p className="mt-1 text-xs text-slate-500">{option.description}</p>
            </button>
          );
        })}
      </div>
      <form onSubmit={handleSubmit} className="mt-6 grid gap-5 md:grid-cols-2">
        <Input label="Full name" autoComplete="name" placeholder="Anele M" value={fullName} onChange={(event) => setFullName(event.target.value)} />
        <Input label="Email address" type="email" autoComplete="email" placeholder="anele@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Input label="Phone number" type="tel" autoComplete="tel" placeholder="+27 82 123 4567" value={phone} onChange={(event) => setPhone(event.target.value)} />
        <Input label="Location" placeholder="Cape Town" value={location} onChange={(event) => setLocation(event.target.value)} />
        <Input label="Password" type="password" autoComplete="new-password" placeholder="Create a strong password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <div className="md:col-span-2 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
          <label className="flex items-start gap-3">
            <input type="checkbox" required checked={isAdult} onChange={(event) => setIsAdult(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 accent-primary" />
            <span>I am 18 years or older.</span>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" required checked={agreed} onChange={(event) => setAgreed(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 accent-primary" />
            <span>
              I have read and accept the <Link href="/terms" target="_blank" className="font-semibold text-primary underline">Terms of Use</Link> and
              the <Link href="/privacy" target="_blank" className="font-semibold text-primary underline">Privacy Policy</Link>, and I consent to QuickGig SA using my information as described there.
            </span>
          </label>
        </div>
        <div className="md:col-span-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" size="lg" loading={submitting} className="sm:min-w-44">
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>
          <Link href="/login" className="text-sm font-semibold text-slate-600 transition hover:text-slate-900">
            Already have an account? <span className="text-primary">Log in</span>
          </Link>
        </div>
      </form>
      {message ? <p className="mt-4 rounded-xl bg-primary-50 px-4 py-3 text-sm font-medium text-primary-800">{message}</p> : null}
    </AuthShell>
  );
}
