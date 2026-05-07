# Performance Audit Report

**Project:** AI General Webpage (PRIZM)
**Audited By:** Performance Optimizer Agent
**Date:** 2026-05-07
**Status:** ✅ Completed

## Executive Summary

The largest bottleneck was queue polling fan-out in the generate sidebar: each active card performed its own interval fetch to a per-job endpoint. This caused excessive network chatter, repeated React state updates, and UI jank while interacting with the queue and library panel.

Optimizations focused on the three user-reported pain points:
- Queue loading latency
- Library/sidebar responsiveness
- Dropdown opening responsiveness

## Baseline Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Queue status requests (10 active jobs) | ~200 req/min (10 x 20/min) | ~13-30 req/min (1 batched poll) | ~85%-93.5% fewer requests |
| Queue status requests (20 active jobs) | ~400 req/min | ~13-30 req/min | ~92.5%-96.8% fewer requests |
| Queue poll update model | N independent state pipelines | Single centralized update pipeline | Lower render churn |
| Dropdown data prep | Rebuilt provider groups per render | Precomputed static provider groups | Reduced open-time compute |
| Library active/completed split | Repeated filter/find scans in render | Memoized map/set-derived lists | Reduced render CPU |
| Production build time | Not measurable pre-install (missing dependencies) | 9.52s measured, then 2.8s compile / 4.0s TS on final build | Build healthy |

## Bottlenecks Identified

1. Per-card polling in queue sidebar (network fan-out + repeated setState)
2. O(n*m) history lookups for active jobs in render path
3. Rebuilding model provider groups and constant dropdown structures repeatedly
4. Always-on outside-click listener for model picker (even when closed)

## Optimizations Applied

### OPT-001: Batched queue status polling
**Category:** Backend + Client state
**Priority:** 🔴 High

- Added batched queue status API route: `POST /api/queue/statuses`
- Added single-query DB helper for authorized multi-job fetch
- Replaced per-card pollers with a single adaptive poll loop in generate client

**Impact:** dramatic drop in request volume and less React update contention.

### OPT-002: Memoized library/sidebar rendering
**Category:** Client rendering
**Priority:** 🔴 High

- Added memoized `jobsById` map, `activeJobs`, and completed-history derivations
- Eliminated repeated `history.find` and `history.filter` work in hot render path
- Added typed normalization for history cards to keep render clean and predictable

**Impact:** faster queue/library panel updates and reduced interaction lag.

### OPT-003: Dropdown open-path optimization
**Category:** Client interactivity
**Priority:** 🟠 Medium

- Precomputed model provider groups once in model registry
- Memoized provider entry iteration in model picker
- Attached outside-click handler only when dropdown is open

**Impact:** less CPU work on open/close and improved perceived dropdown responsiveness.

## Verification

- `pnpm build` passes
- `pnpm lint` passes with warnings only (no errors)
- Queue batch endpoint included in build route manifest

## Remaining Notes

- Existing lint warnings in unrelated files remain and were not changed by this performance patch.
- Queue runtime behavior depends on Redis availability (`REDIS_URL`). In local builds without Redis, queue features are disabled by design.

## Maintenance Recommendations

1. Keep polling centralized; avoid reintroducing per-item polling hooks.
2. Preserve memoized derived collections for history/active queue paths.
3. If queue load grows further, consider SSE/WebSocket for push updates.
4. Add DB index on generation jobs by `(user_id, created_at)` via migration if production dataset is large.
