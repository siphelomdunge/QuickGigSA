# Deploying QuickGig SA

Going from demo mode to a live site takes four parts. Do them in order; each one is checkable before the next.

| Part | What you get | Time |
| --- | --- | --- |
| 1. Supabase | real accounts, data, in-app notifications | ~20 min |
| 2. Vercel | a public URL | ~10 min |
| 3. Email (optional) | notification emails via Resend | ~15 min |
| 4. Launch checklist | admin account, legal pages, smoke test | ~15 min |

You only need a browser, your GitHub account and the keys that each dashboard shows you. **Never paste keys into chat or commit them to Git** — they go only into Supabase/Vercel settings and your local `.env.local`.

---

## 1. Supabase (database + auth)

1. Go to <https://supabase.com/dashboard> → **New project**. Name it `quickgigsa`, pick a strong database password (save it in a password manager), region **Europe (Frankfurt)** or the closest offered to South Africa. Wait ~2 minutes for it to provision.

2. **Apply the schema.** Two ways — pick one:

   **A. SQL editor (no tools to install)**
   ```bash
   npm run bundle:sql          # writes supabase/_bundle.sql (git-ignored)
   ```
   Open **SQL Editor → New query**, paste the whole file, **Run**. It should finish with "Success, no rows returned". It is safe to run exactly once on a fresh project.

   **B. Supabase CLI** (nicer for future migrations)
   ```bash
   npm i -g supabase
   supabase login
   supabase link --project-ref <your-project-ref>      # ref = the part of your project URL before .supabase.co
   supabase db push                                     # applies supabase/migrations/* in order
   ```

   Verify: **Table Editor** should list `users`, `worker_profiles`, `client_profiles`, `gigs`, `gig_private_details`, `applications`, `messages`, `notifications`, `reviews`, `reports`.

3. **Auth settings** (Authentication → URL Configuration):
   - **Site URL**: your Vercel URL once you have it (step 2), e.g. `https://quickgigsa.vercel.app`. Use `http://localhost:3000` for now.
   - **Redirect URLs**: add `https://<your-domain>/reset-password` and `http://localhost:3000/reset-password`.
   - Authentication → Providers → Email: keep **Confirm email** ON for production. (Turn it OFF temporarily if you want to test sign-up quickly without opening mails.)

4. **Copy the two public keys** from Project Settings → API:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   These two are safe to be public; row-level security does the protecting. The **service_role** key is *not* safe — it is only used in step 3, in Supabase's own secrets, never in Vercel or the app.

5. **Test locally** before deploying:
   ```bash
   cp .env.example .env.local      # then fill in the two keys above
   npm run dev
   ```
   The yellow "Demo mode" banner must be gone. Register a worker, register a client (different emails), post a gig, apply. If sign-up emails don't arrive, check Authentication → Logs.

## 2. Vercel (hosting)

1. Merge the work into `main` first (PR #1 on GitHub), so Vercel builds from `main`.
2. <https://vercel.com/new> → **Import** `siphelomdunge/QuickGigSA`. Framework is detected as Next.js; leave build settings alone.
3. **Environment Variables** (add before the first deploy, for *Production, Preview and Development*):

   | Name | Value | Required |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | from step 1.4 | yes |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from step 1.4 | yes |
   | `NEXT_PUBLIC_SITE_URL` | `https://<project>.vercel.app` (update after first deploy) | yes |
   | `ANTHROPIC_API_KEY` | for the AI "improve description" button | optional — rule-based fallback otherwise |
   | `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | shared rate limits for the AI route | optional |
   | `TRUST_PROXY` | `true` (Vercel sets `x-forwarded-for` correctly) | recommended |

4. **Settings → General → Node.js Version: 22.x** (the project requires Node ≥ 22.22).
5. **Deploy.** First build takes ~2 minutes. Open the URL; the demo banner must *not* show.
6. Go back to Supabase Auth URL Configuration and set **Site URL** + redirect URL to the real Vercel address, and update `NEXT_PUBLIC_SITE_URL` in Vercel (redeploy).

Every push to `main` now deploys automatically; pull requests get preview URLs.

## 3. Email notifications (optional, recommended)

In-app notifications (the bell) already work after step 1. For emails:

1. <https://resend.com> → create an account, add and verify your sending domain (or use their test domain for now) → create an API key.
2. Deploy the function and its secrets (needs the Supabase CLI from step 1B):
   ```bash
   supabase functions deploy notify-email --no-verify-jwt
   supabase secrets set RESEND_API_KEY=re_xxx EMAIL_FROM="QuickGig SA <hello@yourdomain>" SITE_URL=https://<your-domain> WEBHOOK_SECRET=<long random string>
   ```
3. Supabase dashboard → **Database → Webhooks → Create**: table `notifications`, event **Insert**, type **Supabase Edge Function** → `notify-email`. Add two HTTP headers:
   - `Authorization: Bearer <service_role key>` (Project Settings → API)
   - `x-webhook-secret: <the WEBHOOK_SECRET you set>`
4. Test: apply to a gig with a second account; the client should get an email within a few seconds. Logs: Edge Functions → notify-email → Logs.

Users can switch emails off on their profile page.

## 4. Launch checklist

- [ ] **Make yourself admin.** Register normally on the live site, then in SQL editor:
  `update public.users set role = 'admin' where email = 'you@yourdomain';` — sign out and in again; `/admin` is now available.
- [ ] **Legal pages.** Edit `content/terms.json` and `content/privacy.json`: replace every `[PLACEHOLDER]` (your trading name, contact email, physical address, information officer for POPIA), then set `"status": "final"` to remove the draft notice. Have someone read them.
- [ ] **Smoke test on a phone over mobile data**: register → complete profile → browse → apply → (as client) accept → message → complete → review. Check the bell and the emails.
- [ ] **Security pass on the real project** (the local RLS tests imitate Supabase closely but aren't Supabase): as a logged-out visitor, try opening a gig's private address; as a worker, try `/client/post-gig`; as a client, try reading another client's applicants. All should be refused.
- [ ] **Backups**: Supabase free tier has no point-in-time recovery. Database → Backups shows daily backups on paid plans; at minimum export the schema with `supabase db dump` after launch.
- [ ] **Custom domain** (optional): Vercel → Domains → add `quickgigsa.co.za`; then update Supabase Site URL/redirects, `NEXT_PUBLIC_SITE_URL`, and `SITE_URL` secret.
- [ ] **Turn CI back on**: GitHub Actions is currently blocked by the account billing lock; once cleared, every PR runs lint, typecheck, tests and build.

## Updating later

- Code: push to `main` → Vercel redeploys.
- Database: add a new file under `supabase/migrations/` (never edit an applied one), then `supabase db push` — or paste just the new file into the SQL editor.
- Edge Function: `supabase functions deploy notify-email --no-verify-jwt`.

## If something is wrong

| Symptom | Fix |
| --- | --- |
| Demo banner still visible on the live site | env vars missing in Vercel, or added after the build — redeploy. |
| "Invalid API key" / 401 on sign-in | wrong anon key, or URL has a trailing path. It must be exactly `https://<ref>.supabase.co`. |
| Sign-up works but no profile / role | migrations not applied (the `handle_new_user` trigger is missing). Re-check Table Editor. |
| Reset-password link goes to localhost | Supabase Site URL / redirect URLs still point to localhost. |
| Emails never arrive | check the Database Webhook exists and the two headers match the secrets; then Edge Function logs; then Resend logs. |
| Build fails on Vercel with a Node error | set Node.js Version to 22.x in Vercel settings. |
