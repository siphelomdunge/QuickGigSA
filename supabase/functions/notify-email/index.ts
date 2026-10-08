// Supabase Edge Function: sends an email for each new row in public.notifications.
//
// Wire it up once (Dashboard → Database → Webhooks → Create):
//   Table: notifications   Events: INSERT   Type: Supabase Edge Function → notify-email
//   HTTP header:  Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>   (the dashboard can add this for you)
//
// Secrets (Dashboard → Edge Functions → notify-email → Secrets, or `supabase secrets set`):
//   RESEND_API_KEY   – from https://resend.com (free tier is plenty to start)
//   EMAIL_FROM       – e.g. "QuickGig SA <hello@yourdomain.co.za>" (domain must be verified in Resend)
//   SITE_URL         – e.g. https://quickgig.co.za (used to build links)
//   WEBHOOK_SECRET   – optional extra shared secret; if set, the webhook must send header x-webhook-secret
//
// Deploy:  supabase functions deploy notify-email --no-verify-jwt
// (The service-role Authorization header is checked below instead of a user JWT.)
//
// Behaviour:
//   * Honours users.email_notifications (opt-out).
//   * Throttles new_message emails: at most one email per thread per 15 minutes, so a back-and-forth
//     chat does not produce a flood. In-app notifications are always created regardless.
//   * Idempotent: marks notifications.emailed_at and skips rows already marked.

import { createClient } from 'npm:@supabase/supabase-js@2';

type NotificationRow = {
  id: string;
  user_id: string;
  type: 'new_application' | 'application_accepted' | 'application_rejected' | 'new_message';
  title: string;
  body: string;
  link: string;
  application_id: string | null;
  emailed_at: string | null;
  created_at: string;
};

const MESSAGE_THROTTLE_MINUTES = 15;

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function render(note: NotificationRow, recipientName: string, url: string) {
  const cta = {
    new_application: 'Review applicant',
    application_accepted: 'Open the conversation',
    application_rejected: 'Browse more gigs',
    new_message: 'Reply',
  }[note.type];

  const text = `Hi ${recipientName},\n\n${note.body}\n\n${cta}: ${url}\n\n— QuickGig SA\nYou can switch these emails off in your profile.`;
  const html = `<!doctype html><html><body style="margin:0;background:#f6f8fc;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px">
    <table role="presentation" width="100%" style="max-width:520px;background:#fff;border:1px solid #e2e8f0;border-radius:20px" cellspacing="0" cellpadding="0">
      <tr><td style="padding:28px 28px 0">
        <div style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#f97316);color:#fff;font-weight:700;border-radius:999px;padding:6px 12px;font-size:12px;letter-spacing:.08em">QUICKGIG SA</div>
        <h1 style="font-size:22px;margin:20px 0 8px;letter-spacing:-.01em">${escapeHtml(note.title)}</h1>
        <p style="margin:0;color:#475569;line-height:1.6">Hi ${escapeHtml(recipientName)},</p>
        <p style="margin:12px 0 0;color:#0f172a;line-height:1.6;white-space:pre-wrap">${escapeHtml(note.body)}</p>
      </td></tr>
      <tr><td style="padding:24px 28px 28px">
        <a href="${url}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px">${cta}</a>
        <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;line-height:1.6">You're receiving this because you have an account on QuickGig SA. Switch emails off any time in your profile. Never pay anyone to get a gig.</p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
  return { text, html };
}

async function sendEmail(to: string, subject: string, content: { text: string; html: string }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: Deno.env.get('EMAIL_FROM'), to, subject, ...content }),
  });
  if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`);
}

Deno.serve(async (request) => {
  // Auth: the webhook must present the service-role key (and the optional shared secret).
  const auth = request.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) return new Response('Unauthorized', { status: 401 });
  const secret = Deno.env.get('WEBHOOK_SECRET');
  if (secret && request.headers.get('x-webhook-secret') !== secret) return new Response('Unauthorized', { status: 401 });

  const payload = (await request.json()) as { type: string; table: string; record: NotificationRow };
  if (payload.table !== 'notifications' || payload.type !== 'INSERT') return Response.json({ skipped: 'not a notification insert' });
  const note = payload.record;
  if (note.emailed_at) return Response.json({ skipped: 'already emailed' });

  const { data: user } = await supabase.from('users').select('email, full_name, email_notifications').eq('id', note.user_id).single();
  if (!user?.email) return Response.json({ skipped: 'no email' });
  if (!user.email_notifications) return Response.json({ skipped: 'opted out' });

  if (note.type === 'new_message' && note.application_id) {
    const since = new Date(Date.now() - MESSAGE_THROTTLE_MINUTES * 60_000).toISOString();
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', note.user_id)
      .eq('type', 'new_message')
      .eq('application_id', note.application_id)
      .not('emailed_at', 'is', null)
      .gte('emailed_at', since);
    if ((count ?? 0) > 0) return Response.json({ skipped: 'throttled' });
  }

  const url = `${(Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '')}${note.link}`;
  await sendEmail(user.email, note.title, render(note, user.full_name?.split(' ')[0] ?? 'there', url));
  await supabase.from('notifications').update({ emailed_at: new Date().toISOString() }).eq('id', note.id);
  return Response.json({ sent: true });
});
