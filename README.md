# DevoverFlow

A developer Q&A community built with Next.js, Clerk and MongoDB: questions, answers, voting, saved questions, tags, profiles, and optional AI answers.

## Run locally

Use Node 22.14+ (Node 22 LTS is recommended).

```sh
npm ci
# Copy .env.example to .env.local and fill in development settings.
npm run dev
```

The normal app requires Clerk and MongoDB. With missing settings, requests go to `/setup`; writes and API requests return 503. This does not create a demo login or bypass authentication.

- Use MongoDB Atlas or a MongoDB replica set. Multi-document changes use transactions; a standalone MongoDB server is insufficient. `MONGODB_DB_NAME` defaults to the original `First` database.
- Configure Clerk sign-in and sign-up routes as shown in `.env.example`. Register `/api/webhook` for `user.created`, `user.updated`, and `user.deleted`, and set `CLERK_WEBHOOK_SECRET`. Existing Clerk accounts need a corresponding database profile; webhook retries are safe.
- Tiny Cloud is optional. Without its public API key, question/answer forms use a basic textarea.
- AI answers are optional. Set a server-only `GOOGLE_API_KEY` and an available model ID in `GOOGLE_AI_MODEL`. The app authenticates requests, limits input/output, sanitizes HTML and allows 10 requests per account per hour using a shared MongoDB counter.
- Keep `.env.local` private. This app needs a Next.js server runtime; it is not a static HTML export.

## Checks

```sh
npm test                  # Unit/component tests; no real service credentials
npm run test:integration  # Real, disposable local MongoDB replica set
npm run test:all          # Both suites
npm run typecheck
npm run lint
npm run build
npm start
```

The first integration run downloads the official MongoDB 8.0.20 binary into the user's cache (the Windows archive is about 800 MB). Later runs reuse it. Tests create and stop their own local replica set, populate synthetic records, and never use your real MongoDB URL. Authentication and cache invalidation are mocked.

Coverage includes signed-out requests, forged author/voter IDs, ownership, profile field permissions, vote transitions and concurrent votes, concurrent view deduplication, transaction rollback, deletion cleanup, saved/tag pagination, sorting by vote count, raw-body webhook signatures/replays, HTML sanitization, AI quotas/errors, search/history behavior, and question form validation/errors.

## Offline visual preview

```sh
npm run preview:offline
```

Open `http://127.0.0.1:4173`. The separate Vite test harness renders the actual navigation, cards and forms with clearly labeled sample data and mocked actions. It does not connect to Clerk, MongoDB, Tiny Cloud or Google. It is not part of the Next.js routes or deployment and is not evidence of a real sign-in or AI response. Browser screenshots, when generated, are kept in the ignored `qa/` directory.

## Repair notes

- Updated Next.js 14 to 16, React, Clerk, editor and validation dependencies; migrated async route parameters and authentication APIs.
- Enforced server-side identity and ownership, protected private profile fields, and removed publicly callable user synchronization actions.
- Corrected voting/reputation transitions, atomic database changes, connection reuse/retry, reference cleanup, pagination and count-based ranking.
- Moved AI generation behind authenticated server actions and removed the Google key from public Next.js build configuration.
- Sanitized stored/rendered/generated HTML; fixed form errors, accessible tag controls, profile navigation, filter/history synchronization, and mobile navigation.

Real Clerk sign-in/webhook delivery, a hosted MongoDB deployment, Tiny Cloud loading and Google responses still need a connected-environment smoke test.
