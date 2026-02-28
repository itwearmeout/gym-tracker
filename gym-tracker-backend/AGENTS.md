# Gym Tracker Backend - Agent Instructions

The role of this file is to describe common mistakes, strict boundaries, and confusion points that agents might encounter while working in this project. 

**DO NOT add architectural overviews, folder structures, or tech stack summaries to this file.** You are fully capable of reading `package.json`, `prisma/schema.prisma`, and the codebase to figure those out on your own.

## 1. Strict Project Boundaries
* **Backend ONLY:** You are acting strictly as a backend engineer. Do not create, modify, or suggest frontend code. Ignore `app/page.tsx`, `app/layout.tsx`, and `public/`.
* **Routing:** All routes must be created exclusively within the `app/api/...` directory as Next.js Route Handlers.
* **Secrets:** NEVER attempt to read `.env`, `.env.local`, or any secret files. Assume variables like `DATABASE_URL` are available.

## 2. Agent Feedback Loop
If you ever encounter something in the project that surprises you, confuses you, or seems poorly architected, **please alert the developer working with you**. Indicate that this is the case and suggest updating this file to help prevent future agents from having the same issue. (The developer will use this feedback to fix the codebase itself).

## 3. Current Development State
* This is a greenfield project with no active users in production. 
* Do not worry about backwards compatibility or complex backfill data patterns. If a database schema change is needed to fix a problem, you are free to alter it drastically.

## 4. Phased Scaffolding Protocol
To optimize token usage, execute tasks in strict phases. When asked to "scaffold" or "initialize" a module, ONLY perform Phase 1 unless instructed otherwise:
* **Phase 1: Skeleton Scaffolding:** Create directory structures, blank files, TypeScript interfaces, Zod schemas, and empty function signatures with `// TODO: Implement logic in Phase 2`. DO NOT write database queries or core business logic.
* **Phase 2: Implementation:** Only write internal logic and Prisma queries when the user explicitly says "Proceed to Phase 2".