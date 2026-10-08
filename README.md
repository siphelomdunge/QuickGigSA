# QuickGig SA

A youth gig marketplace for South Africa. Clients post short-term gigs, workers apply, and admins oversee the platform. This is an MVP: the core flows work and are covered by automated tests, but it is not yet hardened for production.

**Stack:** Next.js 16 (App Router, React 19), TypeScript, Tailwind CSS, Supabase (auth, Postgres, row-level security), lucide-react.

## Features

- Three roles (worker, client, admin) with role-based pages
- Post, browse and manage gigs; apply to gigs; review applicants
- **Messaging** between a client and a worker, one thread per accepted application, with unread counts and read receipts
- **Notifications**: a bell in the header plus optional email when someone applies, a decision is made on an application, or a message arrives (see below)
- Supabase schema with triggers and row-level security (workers see only their own applications, clients only their own gigs)
- Runs without Supabase on mock data and `localStorage`, so you can try it with zero setup
- **AI gig-writing assistant** on the Post a gig page (see below)

## Run it

Requires Node.js 20.9+ (see `.nvmrc`).

```bash
npm install
cp .env.example .env.local   # optional: add Supabase and/or Anthropic keys
npm run dev                  # http://localhost:3000
```

### Supabase (optional)

1. Create a Supabase project and run the SQL files in `supabase/migrations/` in date order.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
3. For password-reset links to work from another device, set `NEXT_PUBLIC_SITE_URL` to an address that device can open, and add `<that address>/reset-password` to your Supabase Auth redirect URLs.

### Email notifications (optional)

In-app notifications work as soon as the migrations are applied: database triggers write a row to `notifications` when someone applies (→ client), an application is accepted or rejected (→ worker), or a message is sent (→ recipient). Emails are sent by the `notify-email` Edge Function through [Resend](https://resend.com):

```bash
supabase functions deploy notify-email --no-verify-jwt
supabase secrets set RESEND_API_KEY=re_... EMAIL_FROM="QuickGig SA <hello@yourdomain>" SITE_URL=https://your-site WEBHOOK_SECRET=<long random string>
```

Then in the dashboard create a **Database Webhook** on `public.notifications` for `INSERT` events that calls the `notify-email` Edge Function, with two HTTP headers: `Authorization: Bearer <service role key>` and `x-webhook-secret: <WEBHOOK_SECRET>`.

Users can switch emails off on their profile page (`users.email_notifications`). Message emails are throttled to one per conversation every 15 minutes, and each notification is emailed at most once (`emailed_at`). Without the function or the webhook nothing breaks; the bell still works. WhatsApp is deliberately not wired up yet (it needs a Meta Business account and template approval); the function is the one place to add it.

## AI gig-writing assistant

On **Post a gig**, the "Improve description and requirements" button rewrites a client's rough draft into a clear listing. The client can edit it or undo it before posting.

- **Model path:** if `ANTHROPIC_API_KEY` is set (server-side only), the route `POST /api/gig-assist` asks a Claude model to rewrite the draft. The model is configurable with `ANTHROPIC_MODEL`.
- **Fallback path:** with no key, or if the model call fails or returns something unusable, a rule-based rewrite is used, so the button always works.
- **Privacy:** only the public fields are sent. The private address is never accepted by the API.
- **Access:** when Supabase is configured, the route requires a signed-in user (the page sends the session token) and caps each user at 10 requests a minute and 50 a day. Without Supabase (local demo mode) it falls back to a per-IP limit.
- **Guardrails in code, not just in the prompt:** every result, from either path, passes through `sanitize()` in `lib/gig-assist.ts`. It drops sentences that contain contact details, limit applicants by gender, race or nationality, ask workers to pay a fee, or state a Rand amount that differs from the Pay field. Removed items are shown to the client as notes.
- **Abuse limits:** input lengths are clamped and the route is rate limited (10/min, 50/day per user, or per IP in demo mode). Limits are kept in memory by default; set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to share them across instances and deploys (plain REST, no SDK). The per-IP path only trusts `x-forwarded-for` when `TRUST_PROXY=true`, and then uses the last hop, since the first one is client-controlled.

### Evaluating it

```bash
npm run eval                      # uses the model if ANTHROPIC_API_KEY is set
npm run eval -- --fallback-only   # rule-based path only, no key needed
```

`eval/gig-assist-cases.json` holds 18 rough drafts, including ones with phone numbers, emails, ID numbers, discriminatory wording, worker fees, a prompt-injection attempt, all-caps text and mixed isiXhosa/English. For each result the script checks: usable length, no contact details, no private address, no invented pay, no restricted-attribute wording, no worker fees, and that key task details from the draft survive. These are rule-based checks. They catch rule violations, not weak writing, so read live outputs as well.

## Tests

```bash
npm test              # unit + integration (Vitest + jsdom), no browser or Supabase needed
npm run test:e2e      # end-to-end (Playwright), demo mode; first run: npx playwright install chromium
npm run eval -- --fallback-only   # AI assistant guardrail checks
```

- `tests/unit/`: the `sanitize()` guardrails, draft parsing, and the rate limiter (both backends).
- `tests/integration/`: renders the real providers and pages in jsdom and plays the full demo flow: client posts a gig, worker applies, client accepts, worker sees the status. Also covers login, registration consent, and role rules.
- `tests/e2e/`: the same flows plus role gates in a real browser, on desktop and mobile viewports.
- `supabase/tests/`: row-level security attacks against a throwaway Postgres (see below).

All of these run in GitHub Actions on every push and pull request (`.github/workflows/ci.yml`).

## Security

The database rules in `supabase/migrations/` enforce access, not just the UI:

- Signups can only be `worker` or `client`. Roles, `verification_status` and `rating` can be changed only by an admin or by trusted server-side code. To create the first admin, run this in the Supabase SQL editor: `update public.users set role = 'admin' where email = 'you@example.com';`
- The private address lives in `gig_private_details`. Only the gig owner, an admin, or a worker with an accepted application can read it.
- Reviews are limited to the two people on an accepted application, once each.
- Messages (`messages` table) can only be read and sent by the gig owner and the worker on an application, and only once it is accepted or completed. Admins can read threads for moderation but not write. Messages are immutable; only the recipient can set `read_at`.
- An application's gig, worker and message cannot be changed once created (only its status).
- Notifications are created only by triggers. A user can read their own and mark them read (nothing else can change); the email flag is set by the service role only.

Check these rules locally with no Supabase account (it starts a throwaway Postgres with a stand-in for Supabase's auth):

```bash
pip install pgserver psycopg2-binary
python supabase/tests/rls_security_test.py              # expect 68/68 passing
python supabase/tests/rls_security_test.py --baseline   # skips the fixes, so you can see the holes they close
```

This is a close imitation of Supabase, not Supabase itself, so repeat the attacks once on a real test project before launch.

## Terms, privacy and consent

- The Terms of Use and Privacy Policy live in `content/terms.json` and `content/privacy.json` and are shown at `/terms` and `/privacy`. They are **drafts**: replace every `[PLACEHOLDER]`, have a South African lawyer review them, then set `"status": "final"` in each file to remove the draft notice. Change the `version` whenever the text changes.
- Sign-up requires two checkboxes (18+, and accepting the Terms and Privacy Policy). The database records when the user accepted and which version they saw (`accepted_terms_at`, `terms_version`, from the `consent_record` migration), and users cannot edit that record.

## Project structure

- `app/`: pages, layouts and the `api/gig-assist` route
- `components/`: reusable UI components
- `lib/`: Supabase client, mock data, shared store, and `gig-assist.ts`
- `eval/`, `scripts/`: assistant test cases and the eval runner
- `supabase/tests/`: security tests for the database rules
- `supabase/migrations/`: schema, triggers and row-level security policies

## How this was built

I built this with AI assistance: I set the product scope, roles and data model, and used AI tools to generate and refine code, then reviewed and tested it. The AI assistant feature and its guardrails and evaluation were added the same way.

## Scripts

`npm run dev`, `build`, `start`, `lint`, `typecheck`, `eval`

<img width="1006" height="890" alt="Screenshot from 2026-10-06 13-29-22" src="https://github.com/user-attachments/assets/c45843ac-b225-4ca1-91b3-d951cffcad7f" />
