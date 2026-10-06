# QuickGig SA

A youth gig marketplace for South Africa. Clients post short-term gigs, workers apply, and admins oversee the platform. This is an MVP: the core flows work, but it has no automated UI tests yet and is not hardened for production.

**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (auth, Postgres, row-level security), lucide-react.

## Features

- Three roles (worker, client, admin) with role-based pages
- Post, browse and manage gigs; apply to gigs; review applicants
- Supabase schema with triggers and row-level security (workers see only their own applications, clients only their own gigs)
- Runs without Supabase on mock data and `localStorage`, so you can try it with zero setup
- **AI gig-writing assistant** on the Post a gig page (see below)

## Run it

Requires Node.js 20+ (see `.nvmrc`).

```bash
npm install
cp .env.example .env.local   # optional: add Supabase and/or Anthropic keys
npm run dev                  # http://localhost:3000
```

### Supabase (optional)

1. Create a Supabase project and run the SQL files in `supabase/migrations/` in date order.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
3. For password-reset links to work from another device, set `NEXT_PUBLIC_SITE_URL` to an address that device can open, and add `<that address>/reset-password` to your Supabase Auth redirect URLs.

## AI gig-writing assistant

On **Post a gig**, the "Improve description and requirements" button rewrites a client's rough draft into a clear listing. The client can edit it or undo it before posting.

- **Model path:** if `ANTHROPIC_API_KEY` is set (server-side only), the route `POST /api/gig-assist` asks a Claude model to rewrite the draft. The model is configurable with `ANTHROPIC_MODEL`.
- **Fallback path:** with no key, or if the model call fails or returns something unusable, a rule-based rewrite is used, so the button always works.
- **Privacy:** only the public fields are sent. The private address is never accepted by the API.
- **Guardrails in code, not just in the prompt:** every result, from either path, passes through `sanitize()` in `lib/gig-assist.ts`. It drops sentences that contain contact details, limit applicants by gender, race or nationality, ask workers to pay a fee, or state a Rand amount that differs from the Pay field. Removed items are shown to the client as notes.
- **Abuse limits:** input lengths are clamped and the route has a simple per-IP rate limit (in memory, so use a shared store in production).

### Evaluating it

```bash
npm run eval                      # uses the model if ANTHROPIC_API_KEY is set
npm run eval -- --fallback-only   # rule-based path only, no key needed
```

`eval/gig-assist-cases.json` holds 18 rough drafts, including ones with phone numbers, emails, ID numbers, discriminatory wording, worker fees, a prompt-injection attempt, all-caps text and mixed isiXhosa/English. For each result the script checks: usable length, no contact details, no private address, no invented pay, no restricted-attribute wording, no worker fees, and that key task details from the draft survive. These are rule-based checks. They catch rule violations, not weak writing, so read live outputs as well.

## Project structure

- `app/`: pages, layouts and the `api/gig-assist` route
- `components/`: reusable UI components
- `lib/`: Supabase client, mock data, shared store, and `gig-assist.ts`
- `eval/`, `scripts/`: assistant test cases and the eval runner
- `supabase/migrations/`: schema, triggers and row-level security policies

## How this was built

I built this with AI assistance: I set the product scope, roles and data model, and used AI tools to generate and refine code, then reviewed and tested it. The AI assistant feature and its guardrails and evaluation were added the same way.

## Scripts

`npm run dev`, `build`, `start`, `lint`, `typecheck`, `eval`
