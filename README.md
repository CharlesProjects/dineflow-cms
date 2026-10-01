# Savoria Restaurant CMS Demo

A production-oriented restaurant CMS and public website built with React, TypeScript, Vite, and Supabase.

This project includes:
- public restaurant landing page
- secure protected admin shell
- authenticated CMS routes
- Supabase-ready schema and RLS design
- local demo fallback content when environment variables are not configured

## Prerequisites

Before you begin, make sure you have:
- Node.js 20+ and npm
- Git
- A hosted Supabase project
- Supabase CLI (the `npx supabase` commands below can run it without a global install)

## 1. Install dependencies

From the project root:

```bash
npm install
```

## 2. Configure the hosted Supabase project

In the Supabase dashboard, open your project and copy:
- Project URL from **Project Settings > API**
- The publishable key (or legacy anon key) from **Project Settings > API Keys**

In **Authentication > URL Configuration**, set the local development URL to `http://localhost:5173` and add it to the allowed redirect URLs. Add your production website URL there before deploying.

## 3. Configure environment variables

Copy the example file:

```bash
copy .env.example .env
```

Then update the values with your own Supabase settings:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-or-publishable-key
VITE_PUBLIC_BUSINESS_ID=your-business-uuid
VITE_APP_NAME=Savoria Restaurant Demo
```

Use only the publishable/anon key in this frontend environment. Never put a Supabase service-role key in a `VITE_` variable or commit it to the repository. If credentials are missing, the public site falls back to demo content and admin login is unavailable.

Set `VITE_PUBLIC_BUSINESS_ID` to the `businesses.id` UUID for the restaurant shown on the public website. The public content queries use this value to stay scoped to one restaurant. Restart Vite after changing `.env`.

## 4. Link the repository and apply migrations

From the project root, authenticate the Supabase CLI and link this repository to your hosted project:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
```

The project ref is shown in the Supabase dashboard URL or under **Project Settings > General**. The CLI may ask for your database password while linking; enter it in the terminal and do not commit it.

Review the SQL files under `supabase/migrations`, then apply them to the linked project:

```bash
npx supabase db push
```

This creates the database schema, RLS policies, and storage policies defined by the migrations. Confirm the migrations completed in the CLI output and inspect the resulting tables and policies in the Supabase dashboard.

## 5. Configure Storage and deploy Edge Functions

The storage migration creates policies, not bucket records. In **Storage**, verify or create these buckets with the exact IDs:
- `business-assets` — private
- `business-public` — public, for published website imagery

The gallery uploader uses paths such as `business/<business-id>/public/gallery/<file>`. Keep the existing object policies in place.

Deploy the authenticated team and audit functions:

```bash
npx supabase functions deploy manage-team
npx supabase functions deploy record-audit
```

Set the allowed site origin used for invitation redirects and CORS. The Supabase URL, anon key, and service-role key are supplied to deployed functions by Supabase; never place the service-role key in frontend variables.

```bash
npx supabase secrets set SITE_URL=http://localhost:5173
```

For production, set `SITE_URL` to the deployed website origin. Team invitations also require working Supabase Auth email delivery and the correct redirect allowlist.

## 6. Run the app locally

```bash
npm run dev
```

Open the local Vite URL:

```text
http://localhost:5173
```

## 7. Configure an admin user

Create the user in **Authentication > Users** in the Supabase dashboard, then configure the corresponding business and profile records required by the schema and RLS policies. The protected admin routes are:

```text
/login
/dashboard
```

Do not enable public sign-ups for a production admin system unless you also implement and verify a controlled account provisioning flow.

## 8. Verify the project

Before shipping or pushing changes:

```bash
npm run build
```

Optional lint check:

```bash
npm run lint
```

## Project structure

```text
src/
  components/
  context/
  lib/
  pages/

supabase/
  config.toml
  functions/
  migrations/
  seed.sql
```

## Notes

- The public site is intentionally separated from the admin CMS.
- Database-level policies are the actual security boundary.
- The local demo content exists so the app can render even before the backend is connected.
- This project is designed as a secure hospitality CMS template, not just a static landing page.

## Typical hosted-project workflow

```bash
npm install
copy .env.example .env
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
npm run dev
```

## Current integration boundary

- The public site reads tenant-scoped settings, hours, menu, testimonials, FAQs, and published gallery records when `VITE_PUBLIC_BUSINESS_ID` is set.
- Settings, menu, hours, reservations, and gallery pages use the existing database tables and RLS policies.
- Public reservation requests require a valid `VITE_PUBLIC_BUSINESS_ID` and the additive `20261001000004_reservation_policy_correction.sql` migration. Apply it with `npx supabase db push` before enabling online requests; it creates no tables.
- Team invitations and authenticated audit event writes require the deployed `manage-team` and `record-audit` Edge Functions.
- Gallery uploads additionally require the two Storage buckets to exist with the expected privacy configuration.
- The browser does not contain a service-role key. The Edge Functions perform their own user, business, and role checks before privileged operations.
- The Supabase schema and RLS policies remain the database security boundary; frontend role-based controls are for usability, not authorization.
