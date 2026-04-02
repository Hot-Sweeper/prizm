# Tech Stack

## Languages
- TypeScript — all frontend and backend code

## Frameworks
- Next.js 15 (App Router) — SSR/SSG, API routes, React Server Components
- React 19 — UI components
- Tailwind CSS v4 — styling, responsive design

## Libraries
- Auth.js v5 (NextAuth) — authentication, social logins
- Stripe SDK — subscriptions, payment processing
- BullMQ — job queue for AI generation tasks
- OpenAI SDK — CometAPI uses OpenAI-compatible format
- Zod — runtime validation for API inputs
- Drizzle ORM — type-safe database queries

## Database
- PostgreSQL (via Supabase or Neon) — users, subscriptions, credits, generation history
- Redis — queue management, rate limiting, session cache

## AI Backend
- CometAPI — unified AI API gateway (OpenAI-compatible)
  - Image: Flux 2, Nano Banana Pro
  - Video: Sora 2, Kling 2.5, Veo 3.1
  - Base URL: `https://api.cometapi.com/v1`

## Storage
- Cloudflare R2 or Supabase Storage — generated images/videos

## DevOps / Infra
- Vercel — frontend deployment (Next.js optimized)
- Railway — queue workers, Redis
- GitHub Actions — CI/CD

## Package Manager
- pnpm

## Runtime Requirements
- Node.js >= 20
- Redis >= 7
