'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthShell } from '@/components/auth-shell';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, user, role, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user && role) {
      const destination = role === 'worker' ? '/worker/dashboard' : role === 'client' ? '/client/dashboard' : '/admin/dashboard';
      router.replace(destination);
    }
  }, [user, role, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    try {
      await signIn({ email, password });
      setMessage('Logged in successfully. Redirecting...');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not log in. Check your email and password.');
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to manage your gigs, applications, or job postings.">
      <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
        <Input label="Email address" type="email" autoComplete="email" placeholder="anele@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Password" type="password" autoComplete="current-password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" size="lg" disabled={loading} className="sm:min-w-40">
            {loading ? 'Signing in…' : 'Login'}
          </Button>
          <Link href="/forgot-password" className="text-sm font-semibold text-primary hover:text-primary-700">
            Forgot password?
          </Link>
        </div>
      </form>
      {message ? <p className="mt-4 rounded-xl bg-primary-50 px-4 py-3 text-sm font-medium text-primary-800">{message}</p> : null}
      <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">New to QuickGig SA?</p>
          <p className="text-sm text-slate-600">Create a free worker or client profile in two minutes.</p>
        </div>
        <Link href="/register" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300">
          Register now
        </Link>
      </div>
    </AuthShell>
  );
}
