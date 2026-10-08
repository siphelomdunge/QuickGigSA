'use client';

import Link from 'next/link';
import { use, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ArrowLeft, CalendarDays, Check, CheckCheck, MapPin, SendHorizonal, ShieldCheck, Wallet } from 'lucide-react';
import { AuthGate } from '@/components/auth-gate';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { ThreadList } from '@/components/thread-list';
import { useAuth } from '@/lib/auth';
import { formatDateShort, formatRand } from '@/lib/format';
import { buildThreads, groupByDay } from '@/lib/messaging';
import { usePlatformStore } from '@/lib/platform-store';
import { cn } from '@/lib/utils';

const MAX_LENGTH = 2000;

export default function ThreadPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);
  const { user } = useAuth();
  const { applications, gigs, users, messages, sendMessage, markThreadRead } = usePlatformStore();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const threads = useMemo(() => (user ? buildThreads({ userId: user.id, applications, gigs, users, messages }) : []), [applications, gigs, messages, user, users]);
  const thread = threads.find((item) => item.application.id === applicationId);
  const threadMessages = useMemo(() => messages.filter((message) => message.application_id === applicationId), [applicationId, messages]);
  const groups = useMemo(() => groupByDay(threadMessages), [threadMessages]);

  // Mark incoming messages read while the thread is open.
  const unreadIncoming = thread?.unreadCount ?? 0;
  useEffect(() => {
    if (!user || !unreadIncoming) return;
    markThreadRead(applicationId, user.id).catch(() => undefined);
  }, [applicationId, markThreadRead, unreadIncoming, user]);

  // Keep the newest message in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [threadMessages.length]);

  const handleSend = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!user || !draft.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      await sendMessage({ application_id: applicationId, sender_id: user.id, body: draft });
      setDraft('');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Could not send that message.');
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <AuthGate allowedRoles={['worker', 'client']}>
      <div className="space-y-4">
        <Link href="/messages" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-900 lg:hidden">
          <ArrowLeft className="h-4 w-4" />
          All conversations
        </Link>

        <div className="grid gap-4 lg:grid-cols-[0.38fr_0.62fr] lg:items-start">
          <aside className="panel hidden p-4 lg:block lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="font-display text-lg font-semibold text-slate-900">Conversations</h2>
              <Link href="/messages" className="text-xs font-semibold text-primary hover:text-primary-700">
                View all
              </Link>
            </div>
            {user ? <ThreadList threads={threads} userId={user.id} activeId={applicationId} /> : null}
          </aside>

          {!thread || !user ? (
            <section className="panel p-6">
              <EmptyState
                title="Conversation not available"
                description="Messaging opens once an application is accepted, and only the client and the worker can see it."
                action={
                  <Link href="/messages" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                    Back to messages
                  </Link>
                }
              />
            </section>
          ) : (
            <section className="panel flex min-h-[70vh] flex-col overflow-hidden">
              {/* Header */}
              <header className="flex flex-col gap-3 border-b border-slate-100 bg-white/70 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
                    {thread.counterpart?.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{thread.counterpart?.name}</p>
                    <Link href={`/gigs/${thread.application.gig_id}`} className="block truncate text-sm text-slate-500 hover:text-primary">
                      {thread.gig?.title ?? thread.application.gig_title}
                    </Link>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <StatusBadge status={thread.application.status} />
                  {thread.gig ? (
                    <>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium">
                        <CalendarDays className="h-3.5 w-3.5 text-secondary" />
                        {formatDateShort(thread.gig.date)} · {thread.gig.start_time}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium">
                        <Wallet className="h-3.5 w-3.5 text-primary" />
                        {formatRand(thread.gig.pay_amount)}
                      </span>
                      {thread.gig.address_private ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2.5 py-1 font-medium text-accent-700">
                          <MapPin className="h-3.5 w-3.5" />
                          {thread.gig.address_private}
                        </span>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </header>

              {/* Messages */}
              <div className="flex-1 space-y-6 overflow-y-auto bg-slate-50/50 p-4 sm:p-6" role="log" aria-live="polite" aria-label="Conversation">
                <div className="mx-auto flex max-w-md items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600 shadow-soft">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <p>
                    This conversation opened when the application was accepted. Keep arrangements here so there is a record. Never pay or send money to get a gig.
                  </p>
                </div>

                {groups.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-500">No messages yet. Confirm the time, meeting point and anything to bring.</p>
                ) : (
                  groups.map((group) => (
                    <div key={group.day} className="space-y-3">
                      <p className="sticky top-0 z-10 mx-auto w-fit rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 shadow-sm">{group.label}</p>
                      {group.messages.map((message, index) => {
                        const mine = message.sender_id === user.id;
                        const previous = group.messages[index - 1];
                        const continued = previous?.sender_id === message.sender_id;
                        return (
                          <div key={message.id} className={cn('flex', mine ? 'justify-end' : 'justify-start', continued ? 'mt-1' : 'mt-3')}>
                            <div
                              className={cn(
                                'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-sm sm:max-w-[70%]',
                                mine ? 'rounded-br-md bg-gradient-to-b from-primary-500 to-primary-600 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-800',
                              )}
                            >
                              <p className="whitespace-pre-wrap break-words">{message.body}</p>
                              <p className={cn('mt-1 flex items-center justify-end gap-1 text-[10px]', mine ? 'text-white/70' : 'text-slate-400')}>
                                {new Date(message.created_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                                {mine ? message.read_at ? <CheckCheck className="h-3 w-3" aria-label="Read" /> : <Check className="h-3 w-3" aria-label="Sent" /> : null}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Composer */}
              <form onSubmit={handleSend} className="border-t border-slate-100 bg-white p-3 sm:p-4">
                <label className="sr-only" htmlFor="message-body">
                  Message
                </label>
                <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-500/10">
                  <textarea
                    id="message-body"
                    rows={1}
                    value={draft}
                    maxLength={MAX_LENGTH}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={`Message ${thread.counterpart?.name ?? ''}…`}
                    className="max-h-40 min-h-[2.75rem] flex-1 resize-none bg-transparent px-2 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    style={{ fieldSizing: 'content' } as React.CSSProperties}
                  />
                  <Button type="submit" size="sm" loading={sending} disabled={!draft.trim()} className="h-10 w-10 shrink-0 rounded-full p-0" aria-label="Send message">
                    {!sending ? <SendHorizonal className="h-4 w-4" /> : null}
                  </Button>
                </div>
                <div className="mt-1.5 flex items-center justify-between px-2 text-[11px] text-slate-400">
                  <span>{error ? <span className="font-medium text-red-600">{error}</span> : 'Enter to send · Shift+Enter for a new line'}</span>
                  <span className={cn(draft.length > MAX_LENGTH - 100 && 'text-secondary-600')}>
                    {draft.length}/{MAX_LENGTH}
                  </span>
                </div>
              </form>
            </section>
          )}
        </div>
      </div>
    </AuthGate>
  );
}
