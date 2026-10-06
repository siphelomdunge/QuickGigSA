'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, loading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [role, setRole] = useState('worker');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    try {
      const result = await signUp({ email, password, full_name: fullName, phone, location, role });
      if (result.needsEmailConfirmation) {
        setMessage('Check your email for a verification link. Then return to login.');
        return;
      }

      setMessage('Account created. Redirecting...');
      router.replace(role === 'client' ? '/client/dashboard' : '/worker/dashboard');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create your account.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="card p-8">
        <h1 className="text-3xl font-semibold text-slate-900">Create your QuickGig SA profile</h1>
        <p className="mt-3 text-slate-600">Sign up to start applying for gigs or posting jobs in your neighbourhood.</p>
        <form onSubmit={handleSubmit} className="mt-8 grid gap-5 md:grid-cols-2">
          <Input label="Full name" placeholder="Anele M" value={fullName} onChange={(event) => setFullName(event.target.value)} />
          <Input label="Email address" type="email" placeholder="anele@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input label="Phone number" type="tel" placeholder="+27 82 123 4567" value={phone} onChange={(event) => setPhone(event.target.value)} />
          <Input label="Location" placeholder="Cape Town" value={location} onChange={(event) => setLocation(event.target.value)} />
          <Select label="Choose role" value={role} onChange={(event) => setRole(event.target.value)} options={[{ label: 'Worker', value: 'worker' }, { label: 'Client', value: 'client' }]} />
          <Input label="Password" type="password" placeholder="Create a strong password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <div className="md:col-span-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
            <Link href="/login" className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300">
              Already have an account?
            </Link>
          </div>
        </form>
        {message ? <p className="mt-4 text-sm text-secondary">{message}</p> : null}
      </div>
      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-slate-700 shadow-soft">
        <p className="text-sm font-semibold text-slate-900">Not sure which role fits you?</p>
        <p className="mt-3 text-slate-600">Workers apply to gigs and manage applications. Clients post gigs and review applicants. Admins monitor the platform.</p>
      </div>
    </div>
  );
}
