'use client';

import { useState, useSyncExternalStore, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAuthRedirectUrl } from '@/lib/auth-redirect';
import { useAuth } from '@/lib/auth';

const subscribeNoop = () => () => {};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const { sendPasswordReset, loading } = useAuth();
  // The redirect URL depends on window.location, so it is empty on the server and filled in on the client.
  const resetTarget = useSyncExternalStore(subscribeNoop, () => getAuthRedirectUrl('/reset-password'), () => '');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    try {
      await sendPasswordReset(email);
      setMessage('If this email exists, a reset link has been sent. Please check your inbox.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not send a reset link.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="card p-8">
        <h1 className="text-3xl font-semibold text-slate-900">Forgot password</h1>
        <p className="mt-3 text-slate-600">Enter your email and we’ll send instructions to reset your password.</p>
        <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
          <Input label="Email address" type="email" placeholder="anele@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          <div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
          </div>
        </form>
        {message ? <p className="mt-4 text-sm font-medium text-secondary">{message}</p> : null}
      </div>
      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-slate-700 shadow-soft">
        <p className="text-sm font-semibold text-slate-900">Note</p>
        <p className="mt-3 text-slate-600">We use Supabase auth for password recovery when your project is connected to Supabase.</p>
        {resetTarget ? (
          <p className="mt-3 break-words text-sm text-slate-600">
            Reset emails currently open: <span className="font-semibold text-slate-800">{resetTarget}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
