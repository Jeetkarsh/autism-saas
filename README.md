# Autism SAAS — Parent Companion App

A web application to help parents of autistic children track progress, celebrate milestones, and access resources.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Database:** Supabase (optional for production)
- **Deployment:** Vercel

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with Hero, Features, Testimonials, CTA |
| `/join` | Waitlist signup with email capture |
| `/dashboard` | Parent dashboard with child profile, streak counter, milestones |
| `/resources` | Content hub with blog posts and search |

## Deployment to Vercel (GitHub Auto-Deploy)

### Step 1: Configure Vercel Project

1. Create a Vercel project: https://vercel.com/new
2. Import your GitHub repository
3. Note your `ORG_ID` and `PROJECT_ID` from the project Settings page

### Step 2: Create Vercel Token

1. Go to https://vercel.com/account/tokens
2. Create a new token with a name like "GitHub Actions"
3. Copy the token (shown only once!)

### Step 3: Add GitHub Secrets

In your GitHub repo, go to **Settings → Secrets and variables → Actions**, and add these secrets:

| Secret Name | Where to Find |
|-------------|---------------|
| `VERCEL_TOKEN` | https://vercel.com/account/tokens (create new) |
| `VERCEL_ORG_ID` | Vercel project Settings → General → scroll to "Project ID" |
| `VERCEL_PROJECT_ID` | Vercel project Settings → General → scroll to "Project ID" |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API → Project API keys (anon key) |

> **Note:** If you don't have Supabase yet, you can leave those two secrets empty for now—the app will work with local storage only.

### Step 4: Deploy

Push any change to the `main` branch. The GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically deploy to Vercel.

---

### Manual Vercel CLI (Alternative)

```bash
npm i -g vercel
vercel
```

## Supabase Setup (Optional)

To enable real data persistence:

1. Create a Supabase project at https://supabase.com
2. Set up your tables (see `/supabase` folder for schemas)
3. Update `.env.local` with your credentials
4. Add the same variables to Vercel and GitHub Secrets

## Project Status

- ✅ Landing page
- ✅ Waitlist/Join page
- ✅ Parent Dashboard with streaks, milestones, quick-log
- ✅ Content Hub / Resources
- ✅ Responsive mobile-first design
- ✅ Auto-deploy GitHub Actions workflow

## License

MIT