# Changelog

## Format
Each entry: `[DATE] CATEGORY: Description`

Categories: `FEATURE`, `FIX`, `REFACTOR`, `DOCS`, `INFRA`, `TEST`

---

## Log

[2025-04-02] INFRA: Code Titan v2 bootstrapped — agents, brain, dashboard, and skills installed
[2025-04-02] DOCS: Creator intake complete — project vision, tech stack, business model, and queue architecture locked in
[2025-04-02] INFRA: Phase 1 complete — Next.js 15 scaffold, Tailwind v4, Auth.js v5, Drizzle ORM (7 tables), CometAPI client, BullMQ queue workers, Stripe subscriptions + webhooks, credit ledger (grant/deduct/forfeit/idempotency), generation UI (form/model-picker/queue-status/gallery). TypeScript clean, dev server boots.

<!-- Entries added automatically by the Titan after each implementation -->

- [2025-04-02] REFACTOR: Switched icon library from lucide-react to @tabler/icons-react globally to make UI styling unique compared to overused libraries.

- [2025-04-02] REFACTOR: Switched icon library to @phosphor-icons/react and implemented SSR-safe rendering, establishing a completely bespoke iconography.

- [2025-04-02] UI: Refined landing page card hovers to only emit a soft primary-color glow, removing the harsh border outline.

- [2025-04-02] UI: Adjusted model cards hover effect to use CSS variables for conditional glow coloration based on model type (image vs video). Changed glow to a subtle inset blur/bobbing instead of an outer neon beam map.

- [2025-04-02] UI: Fixed ModelCard style replacement failure to ensure image models glow with the correct purple variant, and switched the card hover state to an inner subtle blurred bobbing glow over an aggressive drop-shadow.

- [2025-04-03] INFRA: Fixed Railway deployment failure by adding required \packages\ field in pnpm-workspace.yaml.

- [2025-04-05] FEATURE: All generations (including whitelisted direct) now persist to database. Direct generations save completed job with resultUrl to generationJobs table. Failed direct attempts also logged.
- [2025-04-05] UI: Redesigned sidebar active job cards with animated spinner throbber, shimmer effect, prompt text preview, and "Queued" badge with pulsing dot. Added global `spin` and `pulse` keyframes to globals.css.
- [2025-04-05] FEATURE: Image upload in generation form — drag & drop, Ctrl+V paste, and upload button. Supports PNG/JPEG/WebP/GIF, max 5 images at 10 MB each. Reference images sent as base64 data URLs through API and stored in job settings.
