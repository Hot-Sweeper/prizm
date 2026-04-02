# Folder Structure

## Current Structure
```
ai-general-webpage/
├── .github/
│   ├── agents/          — Code Titan v2 + project agents + subagents
│   ├── instructions/    — Stack-matched skills and best practices
│   └── copilot-instructions.md
├── .titan/
│   └── project-brain/   — Project knowledge base
├── .titan-dashboard/    — Visual project dashboard
├── app/                 — Next.js App Router pages
│   ├── (auth)/          — Auth routes (login, register)
│   ├── (dashboard)/     — User dashboard, generation UI, gallery
│   ├── (marketing)/     — Landing page, pricing, about
│   ├── api/             — API routes (generate, queue, webhooks)
│   ├── layout.tsx
│   └── page.tsx
├── components/          — React components
│   ├── ui/              — Reusable UI kit (buttons, cards, modals)
│   └── features/        — Feature-specific components
├── lib/                 — Server-side business logic
│   ├── ai/              — CometAPI client, model configs
│   ├── credits/         — Credit ledger, deduction, balance
│   ├── queue/           — BullMQ setup, workers, rate limiting
│   ├── stripe/          — Stripe client, webhooks, subscription logic
│   ├── db/              — Drizzle schema, migrations, queries
│   └── auth/            — Auth.js config, providers
├── public/              — Static assets, images
├── workers/             — BullMQ worker processes (run on Railway)
└── config files          — next.config, tailwind, tsconfig, drizzle, etc.
```

## Structure Rules
- Group by feature inside `lib/` (credits, queue, stripe, ai, auth)
- `components/ui/` for reusable kit; `components/features/` for page-specific
- Server Components by default; client components only where interactivity is needed
- Workers are separate entry points for Railway deployment

## Where Things Go
| Type of file | Location |
|-------------|----------|
| Pages / Routes | `app/` |
| Reusable UI Components | `components/ui/` |
| Feature Components | `components/features/` |
| Business Logic | `lib/{feature}/` |
| DB Schema & Queries | `lib/db/` |
| Queue Workers | `workers/` |
| API Routes | `app/api/` |
| Config | Root level |
| Assets | `public/` |
