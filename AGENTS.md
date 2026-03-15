# Project Architectural Memory — autism-saas

## Discord Routing

> **EXECUTIVE CHANNEL (Autism-SaaS HQ):** All main outputs, progress updates, decisions, and architectural artifacts MUST be posted to:
> - **Channel:** `#autism-saas-hq` — ID: `1482741878662103173`
> - OpenClaw's `ralph-builder` listens and reports here.

> **KNOWLEDGE INGESTION CHANNEL (Autism KB Builder):** All raw PDFs, spreadsheets, notes, and URLs for the RAG knowledge base MUST be dropped here:
> - **Channel:** `#autism-kb-builder` — ID: `1482748327400308846`
> - A dedicated KB watcher bot monitors this channel. OpenClaw does NOT trigger on messages here.

> **KNOWLEDGE QUERY CHANNEL (Autism KB Query):** All conversational questions and chat with the RAG knowledge base happen here:
> - **Channel:** `#autism-kb-query` — ID: `1482766291612860458`
> - A dedicated Query bot answers questions here. OpenClaw does NOT trigger on messages here.

**Routing rules:**
- Final summaries, build reports, milestones, architectural decisions → **HQ channel** (`1482741878662103173`)
- Temporary debugging threads, in-progress sub-task coordination → secondary channels as appropriate (`#ralph-builder`, `#alerts`, etc.)
- Approvals / review requests → `#approvals` (`1477017799460257852`) as usual, **plus a summary cross-posted to the HQ channel**
- Raw data for the knowledge base (files, URLs) → **KB builder channel** (`1482748327400308846`)
- Asking questions to the AI about project knowledge → **KB query channel** (`1482766291612860458`)

## Environment
- OS: macOS (Darwin 25.3.0)
- Language/Runtime: Node.js with Next.js 14.2.5, React 18.3.1
- Package Manager: npm

## Architectural Decisions
- Next.js 14 with App Router for the frontend framework
- Tailwind CSS for styling with custom design tokens from SPEC.md
- Client-side localStorage for MVP data persistence (no backend)
- Mobile-first responsive design approach
- Component-based architecture with reusable components

## Constraints
- Next.js 14.x required for App Router
- Tailwind CSS 3.x for styling
- All data stored client-side for MVP
- Must be Vercel-ready for deployment

## Local Setup Quirks
- Dependencies installed via `npm install`
- Build verified with `npm run build`
- Development server runs on `npm run dev`