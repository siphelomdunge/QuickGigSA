import { NextResponse } from 'next/server';
import { parseDraft, suggestGig } from '@/lib/gig-assist';

// Basic in-memory rate limit (per server instance). Use a shared store such as Redis in production.
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_REQUESTS;
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (limited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Wait a minute and try again.' }, { status: 429 });
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
