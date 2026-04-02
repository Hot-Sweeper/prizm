# AI General Webpage — Copilot Instructions

## Project Identity
- **Name:** AI General Webpage
- **Agent Name:** AIWebpage
- **Domain:** Consumer AI content generation platform (Higsfield-style viral AI trends)
- **Build Mode:** Launch-ready
- **Phase:** Phase 0 Complete — ready for Phase 1 implementation

## What This Project Is
A consumer-facing web app where users create viral AI content (images, videos, AI influencers) powered by CometAPI. Monetized via tiered subscriptions with credit-based generation limits. Queue system caps platform costs at a predictable maximum.

## Tech Stack
- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 for styling
- Auth.js v5 for authentication
- Drizzle ORM + PostgreSQL for data
- BullMQ + Redis for queue/rate limiting
- Stripe for subscriptions
- CometAPI for AI generation (OpenAI-compatible)
- Cloudflare R2 for storage

## Agent Workflow
This project uses the **Code Titan v2** agent system:
1. **AIWebpage Creator** — Project setup, stack decisions, agent evolution
2. **AIWebpage Planner** — Strategic planning before implementation
3. **AIWebpage Titan** — Elite builder, the main implementation agent

The Creator intake is complete. Switch to the **AIWebpage Titan** for building.

## Project Brain
All project context lives in `.titan/project-brain/`. Always read `INDEX.md` first.

## The 3 Sacred Gates
Every piece of code must pass:
1. **Performance** — Fast, efficient, no bloat
2. **Quality** — Clean, modular, zero duplication
3. **Security** — Input-safe, auth-aware, OWASP-compliant

## Key Business Rules
- Queue system must cap CometAPI costs at a predictable maximum
- Subscriptions grant monthly image + video credits that stack
- Canceling subscription forfeits accumulated credits
- Higher tiers get priority queue placement

## Coding Conventions
- Check `.titan/project-brain/context/conventions.md` for current rules
- No hardcoded colors — theme tokens only
- No emoji in UI — use Lucide icons
- Server Components by default; client only when interactive

## Skills & Instructions
Stack-matched skills are installed in `.github/instructions/`:
- Accessibility (a11y)
- Performance Optimization
- Security & OWASP
- Self-Explanatory Code
- HTML/CSS Style Guide
- Frontend Design (Anthropic)
- Web Design Guidelines (Vercel)
- SEO Audit
- Brainstorming

## User Language
Check `.titan/project-brain/context/translations.md` before asking for clarification.

## Module Reuse
Check `.titan/project-brain/modules/module-registry.md` before creating new code.
