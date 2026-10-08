'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { usePlatformStore } from '@/lib/platform-store';
import { cn } from '@/lib/utils';

export function EmailPreference() {
  const { user } = useAuth();
  const { emailNotifications, setEmailNotifications, isSupabaseConnected } = usePlatformStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggle = async () => {
    if (!user || saving) return;
    setSaving(true);
    setError('');
    try {
      await setEmailNotifications(user.id, !emailNotifications);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Could not save that.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
            <Mail className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-slate-900">Email notifications</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Get an email when someone applies, when a client decides on your application, or when you receive a message. In-app notifications stay on either way.
              {!isSupabaseConnected ? ' (Demo mode: emails are not sent.)' : ''}
            </p>
            {error ? <p className="mt-2 text-sm font-medium text-red-600">{error}</p> : null}
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={emailNotifications}
          aria-label="Email notifications"
          onClick={toggle}
          disabled={saving}
          className={cn(
            'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/25',
            emailNotifications ? 'bg-primary' : 'bg-slate-300',
          )}
        >
          <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow transition', emailNotifications ? 'translate-x-6' : 'translate-x-1')} />
        </button>
      </div>
    </section>
  );
}
