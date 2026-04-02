# Coding Conventions

## Naming
- **Files:** kebab-case for components and pages (e.g., `credit-balance.tsx`)
- **Variables:** camelCase
- **Functions:** camelCase, descriptive verbs (e.g., `deductCredits`, `enqueueGeneration`)
- **Classes/Types:** PascalCase
- **Constants:** UPPER_SNAKE_CASE for env vars and config; camelCase for module-level constants
- **API routes:** kebab-case paths (e.g., `/api/generate-image`)

## Structure
- Next.js App Router: one route per folder in `app/`
- Group by feature for non-route code (`lib/credits/`, `lib/queue/`, `lib/stripe/`)
- Server Components by default; `"use client"` only when interactivity is needed
- API routes handle validation with Zod before any business logic

## Patterns Used
- Server Actions for mutations where possible
- BullMQ workers for async AI generation jobs
- Credit ledger pattern: every generation deducts from user's credit balance
- Queue position tracking via Redis sorted sets

## Import Order
1. React / Next.js
2. Third-party packages
3. Internal aliases (`@/lib/`, `@/components/`)
4. Relative imports

## Error Handling
- API routes return structured JSON errors with status codes
- Queue workers log failures and retry with exponential backoff
- Client-side: toast notifications for user-facing errors

## Comments
- Only explain WHY, not what
- Follow self-explanatory code skill in `.github/instructions/`

## Design Rules
- No hardcoded colors — use CSS custom properties / Tailwind theme tokens
- No emoji characters in UI — use Lucide icons (SVG)
- Use royalty-free stock images for marketing/hero sections
- Match visual style to the AI/creative content domain
