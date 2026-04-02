# PROJECT BRAIN INDEX

> **This is the routing table for the Project Brain.**
> ALWAYS read this file first. Only load the files you need for your current task.

## Quick Reference

| When you need to...                        | Read this file                              |
|--------------------------------------------|---------------------------------------------|
| Understand what this project is            | `context/project-overview.md`               |
| Know the tech stack & dependencies         | `architecture/tech-stack.md`                |
| See the folder structure                   | `architecture/folder-structure.md`          |
| Understand system architecture             | `architecture/system-design.md`             |
| Know why a decision was made               | `architecture/decisions/`                   |
| Follow coding conventions                  | `context/conventions.md`                    |
| Respect user preferences                   | `context/user-preferences.md`              |
| Know the user as a person                   | `context/user-profile.md`                  |
| Understand what the user means              | `context/translations.md`                   |
| Work with APIs                             | `context/api-references.md`                 |
| See what's been built                      | `progress/changelog.md`                     |
| Know current work status                   | `progress/current-phase.md`                 |
| Check project health scores               | `progress/health-report.md`                 |
| Check known issues                         | `progress/blockers.md`                      |
| Find reusable code                         | `modules/module-registry.md`                |
| Check if an error was solved before        | `learnings/error-solutions.md`              |
| See discovered patterns                    | `learnings/patterns.md`                     |

---

## Session Start Checklist

1. Read `context/project-overview.md`
2. Read `progress/current-phase.md`
3. Read `context/conventions.md`
4. Read `context/translations.md` (know the user's language!)
5. Read `context/user-profile.md` (know the user as a person!)
6. Scan `modules/module-registry.md` for available modules

## Before Implementing a Feature

1. Read `architecture/system-design.md`
2. Read `architecture/folder-structure.md`
3. Read `modules/module-registry.md` — find reusable code!
4. Check `learnings/error-solutions.md` for relevant past errors
5. Check `context/api-references.md` if APIs are involved
6. Check `context/translations.md` if the request has unclear terms

## Before Making an Architecture Decision

1. Read existing ADRs in `architecture/decisions/`
2. Check `architecture/tech-stack.md` for constraints
3. Create a new ADR after the decision is made

## After Every Implementation

1. Update `progress/changelog.md`
2. Update `modules/module-registry.md` (if new modules created)
3. Update `progress/health-report.md`
4. Update `progress/current-phase.md`
5. Sync dashboard data

---

## Skills Reference

> Skills installed in `.github/instructions/` are listed here with when to use them.

| Skill | Purpose | Use when... |
|-------|---------|-------------|
| Accessibility (a11y) | WCAG 2.1 AA compliance | Building any UI component |
| Performance Optimization | Frontend/backend/DB optimization | Profiling or optimizing code |
| Security & OWASP | OWASP Top 10 security practices | Handling user input, auth, data |
| Self-Explanatory Code | Code commenting standards | Writing or reviewing code |
| HTML/CSS Style Guide | HTML/CSS styling standards | Writing markup and styles |
| Frontend Design (Anthropic) | Modern UI patterns | Designing UI components |
| Web Design Guidelines (Vercel) | Layout, typography, color | Making design decisions |
| SEO Audit | Meta tags, structured data, crawlability | Optimizing for search engines |
| Brainstorming | Structured ideation methodology | Exploring ideas and solutions |
