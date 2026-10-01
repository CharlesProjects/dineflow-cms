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
VITE_APP_NAME=Savoria Restaurant Demo
```

Use only the publishable/anon key in this frontend environment. Never put a Supabase service-role key in a `VITE_` variable or commit it to the repository. If credentials are missing, the public site falls back to demo content and admin login is unavailable.

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

## 5. Run the app locally

```bash
npm run dev
```

Open the local Vite URL:

```text
http://localhost:5173
```

## 6. Configure an admin user

Create the user in **Authentication > Users** in the Supabase dashboard, then configure the corresponding business and profile records required by the schema and RLS policies. The protected admin routes are:

```text
/login
/dashboard
```

Do not enable public sign-ups for a production admin system unless you also implement and verify a controlled account provisioning flow.

## 7. Verify the project

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

- The public content layer attempts to read business settings, hours, menu, testimonials, and FAQs from Supabase when configured.
- The admin settings, menu, and hours forms currently save to the browser's local storage. They do not write changes to Supabase yet, and local edits are not shared across browsers or users.
- Do not treat the current admin content forms as production-ready database management until Supabase-backed writes and authorization checks are implemented and verified.
- The Supabase schema and RLS policies are the intended database security boundary; frontend route protection alone is not authorization.
