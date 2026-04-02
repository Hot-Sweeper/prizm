# Module Registry

> Every reusable module in this project is registered here.
> **Before creating new code, CHECK THIS REGISTRY for existing modules that do what you need.**

## How to Use This Registry
1. Search by **purpose** or **domain** before writing new code
2. If a module exists that does what you need — **REUSE IT**
3. If you need to extend it — extend, don't duplicate
4. If no module exists — create it and **REGISTER IT HERE**

---

## Registered Modules

<!-- Add modules as they are created -->
<!-- Format:
### {module-name}
- **Location:** `{path}`
- **Purpose:** {what it does}
- **Exports:** `{function/class names}`
- **Used by:** {which parts of the project use this}
- **Dependencies:** {what this module depends on}
-->

# Module Registry

> Every reusable module in this project is registered here.
> **Before creating new code, CHECK THIS REGISTRY for existing modules that do what you need.**

## How to Use This Registry
1. Search by **purpose** or **domain** before writing new code
2. If a module exists that does what you need — **REUSE IT**
3. If you need to extend it — extend, don't duplicate
4. If no module exists — create it and **REGISTER IT HERE**

---

## Registered Modules

### db
- **Location:** `lib/db/index.ts`, `lib/db/schema.ts`, `lib/db/queries/`
- **Purpose:** PostgreSQL singleton + Drizzle ORM schema (7 tables) + query helpers
- **Exports:** `db`, schema table refs, `getUserJobs()`, `getJobById()`
- **Used by:** All server-side modules
- **Dependencies:** `postgres`, `drizzle-orm`

### auth
- **Location:** `auth.ts`, `middleware.ts`, `app/api/auth/[...nextauth]/route.ts`
- **Purpose:** Auth.js v5 — Google + GitHub OAuth, database sessions, route protection
- **Exports:** `auth`, `handlers`, `signIn`, `signOut`
- **Used by:** All protected routes, generation API, billing API
- **Dependencies:** `next-auth`, `@auth/drizzle-adapter`, `db`

### ai-client
- **Location:** `lib/ai/`
- **Purpose:** CometAPI wrapper (server-only) — image + video generation, model registry
- **Exports:** `generateImage()`, `generateVideo()`, `IMAGE_MODELS`, `VIDEO_MODELS`, `isImageModel()`, `isVideoModel()`, `getModelCreditCost()`
- **Used by:** Workers (image-worker, video-worker)
- **Dependencies:** `openai` SDK, `server-only`

### queue
- **Location:** `lib/queue/`, `workers/`
- **Purpose:** BullMQ job queue for image + video generation with tier-based priority and redis rate limiting
- **Exports:** `enqueueGeneration()`, `imageQueue`, `videoQueue`, `TIER_PRIORITY`
- **Used by:** `app/api/generate/route.ts`, workers
- **Dependencies:** `bullmq`, `ioredis`, `ai-client`

### stripe
- **Location:** `lib/stripe/`
- **Purpose:** Stripe subscription management — checkout, billing portal, webhook handling
- **Exports:** `stripe`, `PLANS`, `createStripeCustomer()`, `getSubscriptionByUserId()`, `handleSubscriptionCreated()`, `handleInvoicePaymentSucceeded()`
- **Used by:** Auth events, billing API routes, webhook handler
- **Dependencies:** `stripe` SDK, `db`

### credits
- **Location:** `lib/credits/`
- **Purpose:** Append-only credit ledger — grant/deduct/forfeit with idempotency
- **Exports:** `deductCredits()`, `grantCredits()`, `grantMonthlyCredits()`, `getBalances()`, `forfeitAllCredits()`
- **Used by:** Generation API, Stripe webhook handler
- **Dependencies:** `db`, `drizzle-orm`

### generation-ui
- **Location:** `components/features/generation/`, `app/(dashboard)/generate/`
- **Purpose:** Full generation flow UI — model picker, form, queue status polling, credit display
- **Exports:** `GenerationForm`, `ModelPicker`, `QueueStatus`, `CreditDisplay`, `GenerateClient`
- **Used by:** `app/(dashboard)/generate/page.tsx`
- **Dependencies:** auth, credits API, queue status API

### gallery-ui
- **Location:** `components/features/gallery/`, `app/(dashboard)/gallery/`
- **Purpose:** Paginated gallery of user's generated content
- **Exports:** `GalleryGrid`, `GenerationCard`
- **Used by:** `app/(dashboard)/gallery/page.tsx`
- **Dependencies:** `lib/db/queries/jobs.ts`

### ui-kit
- **Location:** `components/ui/`
- **Purpose:** Reusable base UI components
- **Exports:** `Spinner`, `Badge`
- **Used by:** generation-ui, gallery-ui
- **Dependencies:** `lucide-react`

