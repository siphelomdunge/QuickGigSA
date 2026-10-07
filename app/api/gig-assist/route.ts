import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseDraft, suggestGig } from '@/lib/gig-assist';
import { DAY, MINUTE, getClientIp, getRateLimiter } from '@/lib/rate-limit';

// Per user (or per IP in demo mode). Backed by Upstash Redis when configured, otherwise in-memory.
const LIMITS = [
  { windowMs: MINUTE, max: 10 },
  { windowMs: DAY, max: 50 },
];

/**
 * When Supabase is configured, only signed-in users may call this route (it costs money per call).
 * Without Supabase (local demo mode) there are no accounts, so the route falls back to an IP limit.
 */
async function identify(request: Request): Promise<{ key: string } | NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && anonKey) {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return NextResponse.json({ error: 'Please log in to use this.' }, { status: 401 });
    const { data, error } = await createClient(url, anonKey).auth.getUser(token);
    if (error || !data.user) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });
    return { key: `user:${data.user.id}` };
  }

  return { key: `ip:${getClientIp(request.headers)}` };
}

export async function POST(request: Request) {
  const who = await identify(request);
  if (who instanceof NextResponse) return who;

  if (await getRateLimiter().isOverLimit(who.key, LIMITS)) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Send the gig details as JSON.' }, { status: 400 });
  }

  const draft = parseDraft(body);
  if (!draft) {
    return NextResponse.json({ error: 'Add a title or a short description first.' }, { status: 400 });
  }

  const suggestion = await suggestGig(draft, {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL,
  });
  return NextResponse.json(suggestion);
}
