'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    <div className="space-y-8">
      <div className="card p-8">
        <h1 className="text-3xl font-semibold text-slate-900">Welcome back</h1>
        <p className="mt-3 text-slate-600">Log in to manage your gigs, applications, or job postings.</p>
        <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
          <Input label="Email address" type="email" placeholder="anele@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Password" type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Button type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Login'}
            </Button>
            <Link href="/forgot-password" className="text-sm font-semibold text-primary hover:text-blue-600">
              Forgot password?
            </Link>
          </div>
        </form>
        {message ? <p className="mt-4 text-sm font-medium text-secondary">{message}</p> : null}
      </div>
      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-slate-700 shadow-soft">
        <p className="text-sm font-semibold text-slate-900">New to QuickGig SA?</p>
        <Link href="/register" className="mt-3 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600">
          Register now
        </Link>
      </div>
    </div>
  );
}
