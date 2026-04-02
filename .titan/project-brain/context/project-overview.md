# Project Overview

## What Is This Project?
A consumer-facing AI content generation platform — think Higsfield meets a subscription SaaS. Users come to create viral AI content: AI-generated images, AI videos, AI influencer content, and trending visual effects. Powered by CometAPI as the unified AI backend.

## Goals
- Let consumers create viral AI content (images + videos) through a polished web UI
- Monetize via tiered subscriptions with credit-based generation limits
- Cap platform costs at a predictable maximum through queue-based rate limiting
- Achieve always-expanding profit: revenue scales with users, costs are capped by queue throughput
- Sticky retention model: credits accumulate, canceling forfeits them

## Target Users
- Content creators chasing viral AI trends
- Social media influencers wanting AI-generated content
- Casual consumers who want to try the latest AI image/video trends
- AI influencer creators building digital personas

## Core Features
- **AI Image Generation** — Multiple models (Flux 2, Nano Banana, Midjourney-style) via CometAPI
- **AI Video Generation** — Sora 2, Kling, Veo via CometAPI
- **Trend Templates** — Pre-built prompts/workflows for viral AI trends
- **Queue System** — Users see position, wait for their turn; caps platform cost
- **Credit System** — Subscription tiers grant image + video credits monthly
- **Credit Stacking** — Unused credits accumulate; canceling forfeits them
- **User Gallery** — Browse and share generated content
- **Social Sharing** — Easy export to TikTok, Instagram, X, etc.

## Business Model
- **Subscription tiers** (e.g., Free/Starter/Pro/Max)
- Each tier grants monthly image credits (generous) + video credits (limited)
- Credits recharge monthly and stack across months
- Canceling subscription forfeits accumulated credits (retention hook)
- Queue system limits concurrent generations → predictable max CometAPI spend
- Higher tiers get priority queue placement

## Status
- **Phase:** Phase 0 — Bootstrap + Creator Intake Complete
- **Started:** 2025-04-02
- **Last Updated:** 2025-04-02
