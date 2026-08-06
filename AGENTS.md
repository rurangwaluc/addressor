# Addressor Agent Rules

You are working on Addressor, a Rwanda-first business discovery and business account platform.

## Core product principles

1. Build for Time Savings  
Every feature must reduce manual effort, remove repeated work, or help owners/customers act faster.

2. Solve Problems at Scale  
Prioritize repeated high-impact problems that many businesses and customers will have.

## Development rules

- Inspect files before changing them.
- Do not guess architecture.
- Make the smallest correct change.
- Keep existing design language.
- Avoid AI-looking gradients, glows, noisy borders, and random visual effects.
- Use simple business language, not technical wording.
- Treat responsive design and PWA behavior as mandatory.
- Do not break mobile.
- Avoid text wrapping on buttons and navigation. Use `whitespace-nowrap` where needed.
- For business account pages, keep sidebar behavior consistent.
- Internal navigation must feel instant.
- Prefer Next `Link`, route prefetching, cached local access, and shared layouts.
- Do not introduce full-page blank loading when cached data is available.
- After changes, always run `pnpm check`.

## Current stack

- Monorepo with pnpm
- apps/api
- apps/web
- apps/mobile
- Next.js App Router for web
- TypeScript
- Fastify API
- Postgres/Supabase style database layer

## Git rules

Before committing:

- Run `pnpm check`.
- Inspect `git status`.
- Inspect `git diff`.

After successful checks:

- Add only changed files.
- Commit with a clear message.
- Push to GitHub.

Never commit before `pnpm check` passes.
