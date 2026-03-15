# SPEC.md — Autism SaaS MVP

## Project Overview
- **Name:** AutismConnect (or similar parent-friendly name)
- **Type:** Freemium SaaS Web Application
- **Core Functionality:** A platform for parents of autistic children to track progress, access resources, and join a supportive community
- **Target Users:** Parents of autistic children (India-first, global potential)

---

## UI/UX Specification

### Design Philosophy
- **Warm, trustworthy, medical-but-friendly** — avoid sterile hospital vibes
- **Parent-friendly** — easy to use while managing a child (often one-handed on phone)
- **Hopeful, not clinical** — progress-focused language

### Color Palette
```css
--primary: #6B8F71;        /* Sage green — calm, growth, nature */
--primary-dark: #4A6B50;   /* Darker sage for hover states */
--secondary: #F4A261;      /* Warm amber — warmth, hope */
--accent: #E9C46A;         /* Soft gold — highlights, CTAs */
--background: #FDFAF6;     /* Warm off-white */
--surface: #FFFFFF;        /* Pure white cards */
--text-primary: #2D3436;   /* Soft black */
--text-muted: #636E72;     /* Muted gray */
--border: #E8E4DE;         /* Warm gray border */
--success: #81B29A;        /* Soft green */
--warning: #F4A261;        /* Amber */
```

### Typography
- **Headings:** "Nunito" or "Quicksand" — rounded, friendly, approachable
- **Body:** "Source Sans Pro" or "DM Sans" — clean, readable
- **Sizing:**
  - Hero: 48px (mobile: 36px)
  - H1: 32px
  - H2: 24px
  - Body: 16px
  - Small: 14px

### Layout
- **Mobile-first** responsive design
- **Max-width:** 1200px centered
- **Spacing:** 8px base unit (8, 16, 24, 32, 48, 64)
- **Border-radius:** 12px (cards), 8px (buttons), 24px (large CTAs)

### Components

#### Navigation
- Sticky header with logo (left), nav links (center), CTA button (right)
- Mobile: hamburger menu with slide-out drawer
- Links: Home, Features, Resources, Blog, Pricing

#### Hero Section
- Split layout: content left, illustration/image right
- Headline + subheadline + primary CTA (Start Free Trial) + secondary (Learn More)
- Trust badge: "Trusted by 500+ parents"

#### Features Section
- 3-column grid (mobile: 1 column)
- Icon + title + description
- Feature cards with subtle hover lift

#### Social Proof
- Testimonial carousel with parent quotes
- Stats bar: "X children tracked", "X sessions completed", "X resources available"

#### Waitlist/Signup Form
- Email input + CTA button
- Success state with confirmation message
- Form validation (email format)

#### Footer
- Logo + tagline
- Quick links
- Social icons
- Copyright

---

## Pages Structure

### 1. Landing Page (`/`)
- Hero section
- Features grid (3-4 key features)
- Social proof (testimonials + stats)
- CTA section
- Footer

### 2. Waitlist/Signup (`/join`)
- Email capture form
- Value proposition reminder
- Success confirmation

### 3. Dashboard (`/dashboard`) — Protected (Freemium)
- Welcome message with child name input
- Quick stats: streak, sessions, milestones
- Progress tracker (simple visual)
- Daily session reminder
- Quick actions: Log Activity, View Progress, Browse Resources

### 4. Content Hub (`/resources`)
- Blog post cards (thumbnail, title, excerpt, read time)
- Resource categories: Articles, Videos, Worksheets
- Search/filter functionality
- Featured/trending section

### 5. Blog Post Template (`/resources/[slug]`)
- Article content
- Share buttons
- Related articles

---

## Functionality Specification

### Core Features

#### Email Waitlist
- Collect email via form
- Store in simple JSON file (MVP) or localStorage
- Show success message
- Redirect to thank you page

#### Freemium Dashboard
- Child profile: name, age (stored in localStorage/session)
- Daily check-in streak counter
- Simple progress visualization (5 milestones)
- Quick log: mood, speech attempt, therapy activity

#### Content Hub
- Static blog content (Markdown or JSON-based)
- Categories and tags
- Search functionality

### User Interactions
- Smooth scroll to sections
- Form validation with error states
- Loading states for async actions
- Mobile-responsive touch targets (min 44px)

### Data Handling
- All data stored client-side (localStorage) for MVP
- No backend required for initial release

---

## Acceptance Criteria

### Landing Page
- [ ] Loads in under 3 seconds
- [ ] All text is readable on mobile
- [ ] CTA buttons are prominently visible
- [ ] Navigation works on mobile

### Waitlist
- [ ] Email validation works
- [ ] Success message displays on submission
- [ ] Email saved to storage

### Dashboard
- [ ] User can enter child's name
- [ ] Streak counter increments on daily visit
- [ ] Quick log buttons work
- [ ] Progress milestones display

### Content Hub
- [ ] Blog posts render correctly
- [ ] Search filters work
- [ ] Mobile-friendly layout

### General
- [ ] Responsive at 320px, 768px, 1024px, 1440px
- [ ] No console errors
- [ ] Accessible (basic a11y: labels, contrast, focus states)

---

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** CSS Modules or Tailwind CSS (clean, minimal)
- **Deployment:** Vercel-ready (single `vercel.json` or zero-config)

---

## Project Structure
```
autism-saas/
├── app/
│   ├── layout.js
│   ├── page.js          (Landing)
│   ├── join/page.js     (Waitlist)
│   ├── dashboard/page.js
│   ├── resources/
│   │   ├── page.js
│   │   └── [slug]/page.js
│   └── globals.css
├── components/
│   ├── Navbar.js
│   ├── Footer.js
│   ├── Hero.js
│   ├── Features.js
│   ├── Testimonials.js
│   ├── EmailForm.js
│   ├── Dashboard.js
│   └── ResourceCard.js
├── lib/
│   ├── data.js          (Blog posts data)
│   └── storage.js       (localStorage helpers)
├── public/
│   └── images/
├── package.json
└── next.config.js
```