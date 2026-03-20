# Implementation Plan — Phase 2

## Tasks (ordered by priority)

- [x] **Task 1: Supabase Auth Integration**
  - File(s): `middleware.ts`, `lib/supabase/server.ts`, `lib/supabase/client.ts`
  - Description: Wire up real Supabase auth. Create sign-up/sign-in flows, session management. Replace mock test user with real auth.

- [x] **Task 2: Supabase Database Schema**
  - File(s): `lib/types/database.ts`, `supabase/schema.sql`
  - Description: Create DB tables: children, activity_logs, episodes, strategies, check_ins, milestones. Update TypeScript interfaces.

- [x] **Task 3: WhatsApp Parent Companion**
  - File(s): `app/api/whatsapp/route.ts`, `lib/whatsapp.ts`
  - Description: Twilio WhatsApp integration. Daily check-ins, milestone alerts, weekly summaries. India market focus.

- [x] **Task 4: Weekly PDF Progress Reports**
  - File(s): `app/api/reports/weekly/route.ts`, `lib/report-generator.ts`
  - Description: Auto-generate PDF reports for IEP meetings. "Week X: Y episodes, top triggers, effective strategies."

- [x] **Task 5: Therapist Portal**
  - File(s): `app/therapist/page.tsx`, `app/therapist/TherapistPortalClient.tsx`, `app/api/therapist/assignments/route.ts`, `app/api/therapist/notes/route.ts`
  - Description: Separate login for therapists to view assigned children, add notes, suggest strategies.

- [x] **Task 6: Waitlist → Onboarding Email Sequence**
  - File(s): `app/api/onboarding/route.ts`, `lib/email-sequence.ts`
  - Description: Day 1 resource → day 3 check-in → day 7 trial invite. Converts waitlist to active users.

- [ ] **Task 7: RAG Service Deployment**
  - File(s): `rag/`, `app/api/kb/*`
  - Description: Deploy vector DB (Pinecone/pgvector) for RAG. Connect chatbot to real knowledge base.

- [ ] **Task 8: Push Notifications**
  - File(s): `app/api/push/route.ts`, `lib/push-service.ts`
  - Description: Web push for milestones, daily reminders, weekly report ready.

- [ ] **Task 9: PWA + Performance**
  - File(s): `next.config.js`, `manifest.json`, `public/sw.js`
  - Description: Service worker, offline support, PWA manifest. Lighthouse 90+.

- [ ] **Task 10: Stripe Freemium Upgrade**
  - File(s): `app/api/stripe/*`, `app/pricing/page.tsx`
  - Description: Free = 1 child, basic. Paid = unlimited + PDF + WhatsApp.

---

## Current Status
- Phase 1: ✅ Complete
- Phase 2: Starting
- Dev: http://localhost:3000
- Live: https://autism-saas.vercel.app
