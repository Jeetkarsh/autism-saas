# Implementation Plan — Phase 2

## Tasks (ordered by priority)

<!-- Mark completed tasks with [x], pending with [ ]. -->

- [x] **Task 1: Supabase Auth Integration**
  - File(s): `middleware.ts`, `lib/supabase/server.ts`, `lib/supabase/client.ts`
  - Description: Wire up real Supabase auth. Create authenticated routes, sign-up/sign-in flows, session management. Replace mock test user with real auth.

- [ ] **Task 2: Supabase Database Schema + Types**
  - File(s): `lib/types/database.ts`, `supabase/schema.sql`
  - Description: Create proper DB tables: children, activity_logs, episodes, strategies, check_ins, milestones. Update TypeScript interfaces to match real schema.

- [ ] **Task 3: WhatsApp Parent Companion Bot**
  - File(s): `app/api/whatsapp/route.ts`, `lib/whatsapp.ts`
  - Description: Twilio WhatsApp integration. Daily check-in reminders, milestone alerts, weekly progress summaries. Aligns with India market.

- [ ] **Task 4: Weekly PDF Progress Reports**
  - File(s): `app/api/reports/weekly/route.ts`, `lib/report-generator.ts`
  - Description: Auto-generate PDF reports parents can share with therapists/IEP teams. "Week X: Y episodes, top triggers, effective strategies."

- [ ] **Task 5: Therapist Portal**
  - File(s): `app/therapist/page.tsx`, `app/api/therapist/assignments/route.ts`
  - Description: Separate login for therapists to view assigned children's progress, add notes, suggest strategy adjustments.

- [ ] **Task 6: Waitlist → Onboarding Email Sequence**
  - File(s): `app/api/onboarding/route.ts`, `lib/email-sequence.ts`
  - Description: Day 1 email with first resource → day 3 check-in → day 7 trial invite. Converts waitlist to active users.

- [ ] **Task 7: RAG Service Deployment + Knowledge Base**
  - File(s): `rag/`, `app/api/kb/*`
  - Description: Deploy vector DB (Pinecone/Supabase pgvector) for RAG. Update knowledge base with real autism resources. Connect to chatbot.

- [ ] **Task 8: Push Notifications**
  - File(s): `app/api/push/route.ts`, `lib/push-service.ts`
  - Description: Web push for milestone achievements, daily reminders, weekly report ready notifications.

- [ ] **Task 9: Performance Optimization + PWA**
  - File(s): `next.config.js`, `manifest.json`, `app/icon/`
  - Description: Add service worker, offline support, PWA manifest for mobile install. Lighthouse score 90+.

- [ ] **Task 10: Stripe Freemium Upgrade Flow**
  - File(s): `app/api/stripe/*`, `app/pricing/page.tsx`
  - Description: Connect Stripe. Free tier = 1 child, basic tracking. Paid = unlimited children, PDF reports, WhatsApp alerts.

---

## Current Status
- Phase 1: ✅ Complete (landing, dashboard, chatbot, analytics, wellness)
- Phase 2: In Progress
- Dev URL: http://localhost:3000
- Live URL: https://autism-saas.vercel.app (mock data)
