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
- Docker Desktop or Podman running if you want to use the local Supabase database
- A Supabase account if you want to connect to a hosted project instead of local Docker-based Supabase

## 1. Install dependencies

From the project root:

```bash
npm install
```

## 2. Configure environment variables

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

If you are not yet connected to a live Supabase project, the app will still run with fallback demo content. The admin login will remain blocked until Supabase credentials are added.

## 3. Choose a Supabase setup option

### Option A: Local Supabase via Docker

If you want to run Supabase locally:

```bash
npx supabase init
npx supabase start
```

This requires Docker Desktop or another compatible container runtime. Once running, the local API and Studio URLs will be printed in the terminal. Use those values for your `.env` file.

### Option B: Hosted Supabase project

Create a project in Supabase, then copy the project URL and anon/publishable key into your `.env` file.

## 4. Apply the database schema and security rules

The project includes migration files under `supabase/migrations`.

If using the local Supabase instance:

```bash
npx supabase db push
```

Or, if you are using a linked hosted project:

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

This applies the restaurant schema, auth-related access patterns, and RLS/security rules.

## 5. Run the app locally

Start the development server:

```bash
npm run dev
```

Open the local Vite URL in the browser, usually:

```text
http://localhost:5173
```

## 6. Log in to the admin area

The app includes a protected CMS shell at:

```text
/login
/dashboard
```

To use the authenticated admin area, you must create a user in Supabase Auth and ensure that the profile/business permissions are configured in the database.

## 7. Verify the build

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

## Typical local workflow

```bash
npm install
copy .env.example .env
npx supabase start
npx supabase db push
npm run dev
```

If you want to switch from local demo mode to a live connected database, update your `.env` file and re-run the app.
