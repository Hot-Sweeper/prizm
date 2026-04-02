# API References

## APIs Used

### CometAPI (Primary AI Backend)
- **Base URL:** `https://api.cometapi.com/v1`
- **Auth:** API key in Authorization header (OpenAI-compatible format)
- **Key Location:** `COMETAPI_API_KEY` in `.env`
- **Rate Limits:** Pay-as-you-go, platform-side queue manages throughput
- **Docs:** https://apidoc.cometapi.com/
- **Notes:** Uses OpenAI SDK with custom base_url. Supports image gen (Flux 2, Nano Banana), video gen (Sora 2 at $0.08/sec, Kling, Veo), and LLMs for prompt enhancement.

### Stripe (Payments)
- **Base URL:** Stripe SDK (server-side)
- **Auth:** Secret key + webhook signing secret
- **Key Location:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` in `.env`
- **Docs:** https://stripe.com/docs/api
- **Notes:** Handles subscription creation, credit recharging, webhook events for payment lifecycle.

---

## Environment Variables

| Variable | Purpose | Location |
|----------|---------|----------|
| `COMETAPI_API_KEY` | CometAPI authentication | `.env` |
| `STRIPE_SECRET_KEY` | Stripe server-side key | `.env` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification | `.env` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe client-side key | `.env` |
| `DATABASE_URL` | PostgreSQL connection string | `.env` |
| `REDIS_URL` | Redis connection string | `.env` |
| `NEXTAUTH_SECRET` | Auth.js session encryption | `.env` |
| `NEXTAUTH_URL` | Auth.js callback URL | `.env` |
| `STORAGE_BUCKET_URL` | R2/Supabase storage endpoint | `.env` |
