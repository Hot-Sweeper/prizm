# System Design

## Architecture Overview
A Next.js full-stack web app with a queue-based AI generation backend. Users interact with the frontend, which triggers API routes. Generation requests are pushed to a Redis-backed BullMQ queue. Workers process jobs by calling CometAPI, store results, and notify the frontend via polling or webhooks.

## Component Diagram
```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────┐
│  Browser (User) │───▶│ Next.js Frontend  │───▶│ Next.js API     │
│  React UI       │     │ (Vercel)          │     │ Routes          │
└─────────────────┘     └──────────────────┘     └───────┬───────┘
                                                        │
                    ┌──────────────────────────────────┤
                    │                                  │
              ┌─────┴───────┐     ┌────────────┐   ┌──┴───────────┐
              │ PostgreSQL  │     │ Redis Queue │   │ Stripe        │
              │ (Supabase)  │     │ (BullMQ)    │   │ (Payments)    │
              │ Users,      │     │ Job queue,  │   │ Subscriptions │
              │ Credits,    │     │ Rate limits │   │ Webhooks      │
              │ History     │     └──────┬─────┘   └───────────────┘
              └─────────────┘            │
                                   ┌────┴───────────┐
                                   │ Queue Workers  │
                                   │ (Railway)      │
                                   └──────┬─────────┘
                                          │
                                   ┌──────┴─────────┐
                                   │ CometAPI        │
                                   │ (AI Generation) │
                                   └──────┬─────────┘
                                          │
                                   ┌──────┴─────────┐
                                   │ R2 / Supabase   │
                                   │ Storage         │
                                   └────────────────┘
```

## Data Flow
1. User submits a generation request (image or video)
2. API route validates input, checks user has credits, deducts credits
3. Job is enqueued in BullMQ with user ID, prompt, model, and settings
4. User gets a job ID and can poll for status / see queue position
5. Worker picks up job, calls CometAPI, receives generated content
6. Worker uploads result to storage, updates DB with result URL
7. Frontend shows completed generation to user

## Queue / Rate Limiting Architecture
- **Per-user limits:** X image gens/minute, Y video gens/minute based on tier
- **Global platform limits:** Max N concurrent CometAPI calls (caps total cost)
- **Queue priority:** Higher subscription tiers get priority placement
- **Daily caps:** Per-user daily generation limits based on subscription tier
- **Result:** At maximum capacity, CometAPI spend is bounded and predictable

## Key Design Decisions
- CometAPI as unified AI backend (see ADR template for formal record)
- BullMQ + Redis for queue (battle-tested, supports priorities and rate limiting)
- Credit-based monetization with retention hooks
- Next.js API routes for backend (single deployment, simpler infra)

## External Services
- CometAPI — AI image/video generation
- Stripe — subscription payments and billing
- Supabase / Neon — managed PostgreSQL
- Cloudflare R2 / Supabase Storage — generated content storage
- Vercel — frontend hosting
- Railway — queue workers and Redis
