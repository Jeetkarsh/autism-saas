# Project Architectural Memory

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