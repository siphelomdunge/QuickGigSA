'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updatePassword, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('Checking your recovery link...');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function prepareRecoverySession() {
      if (!supabase) {
        setMessage('Supabase is not configured for password recovery.');
        return;
      }

      const code = searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            setMessage(error.message);
            return;
          }
        }
      }

      const { data } = await supabase.auth.getSession();
      if (!isActive) return;

      if (data.session) {
        setIsReady(true);
        setMessage('Enter your new password.');
      } else {
        setMessage('This recovery link is invalid or expired. Request a new reset link.');
      }
    }

    prepareRecoverySession();

    return () => {
      isActive = false;
    };
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.length < 6) {
      setMessage('Use at least 6 characters for your new password.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    try {
      await updatePassword(password);
      setMessage('Password updated. Redirecting to login...');
      window.setTimeout(() => router.replace('/login'), 900);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update your password.');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section className="page-hero p-6 sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Reset password</h1>
        <p className="mt-3 text-slate-600">Create a new password for your QuickGig SA account.</p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
          <Input
            label="New password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={!isReady || loading}
            placeholder="Enter new password"
          />
          <Input
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={!isReady || loading}
            placeholder="Confirm new password"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="submit" disabled={!isReady || loading}>
              {loading ? 'Updating...' : 'Update password'}
            </Button>
            <Link href="/forgot-password" className="text-sm font-semibold text-primary hover:text-blue-600">
              Request a new link
            </Link>
          </div>
        </form>

        {message ? <p className="mt-4 text-sm font-medium text-secondary">{message}</p> : null}
      </section>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl panel p-8 text-center">
          <p className="text-lg font-semibold text-slate-900">Loading recovery link...</p>
          <p className="mt-2 text-sm text-slate-600">Please wait while we prepare your password reset.</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
