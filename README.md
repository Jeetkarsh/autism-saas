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

## Deployment to Vercel

### Option 1: GitHub Auto-Deploy (Recommended)

1. Push code to GitHub
2. Create a Vercel project: https://vercel.com/new
3. Import your GitHub repository
4. Add these Environment Variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Your Supabase anon key
5. Deploy! The GitHub Actions workflow (`.github/workflows/deploy.yml`) will auto-deploy on push to main

### Option 2: Manual Vercel CLI

```bash
npm i -g vercel
vercel
```

## Supabase Setup (Optional)

To enable real data persistence:

1. Create a Supabase project at https://supabase.com
2. Set up your tables (see `/supabase` folder for schemas)
3. Update `.env.local` with your credentials
4. Add the same variables to Vercel

## Project Status

- ✅ Landing page
- ✅ Waitlist/Join page
- ✅ Parent Dashboard with streaks, milestones, quick-log
- ✅ Content Hub / Resources
- ✅ Responsive mobile-first design
- ✅ Auto-deploy GitHub Actions workflow

## License

MIT