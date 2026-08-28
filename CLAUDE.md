# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository

Turborepo monorepo (Yarn 4 workspaces) for BuildTheEarth's web presence: `apps/*` (frontend, dashboard, api, api-v2) and `packages/*` (db, prettier-config, typescript-config). TypeScript only — ignore/do not add JavaScript files.

## Commands

All commands run from the repo root. `yarn ws <workspace> <script>` is an alias for `yarn workspace`.

```bash
yarn install                 # install (Yarn 4, never npm/pnpm)
yarn dev                     # all apps (turbo) — starts docker postgres, waits, migrates, then dev
yarn dev:frontend            # frontend only
yarn build                   # all (turbo caches; only changed packages rebuild)
yarn build:api               # or build:frontend
yarn lint                    # turbo lint across workspaces
yarn prettier                # format all workspaces
```

Database (`packages/db` owns the single Prisma schema):

```bash
yarn generate:db             # prisma generate — required after schema changes or a fresh clone
yarn migrate:db              # prisma migrate deploy
yarn studio:db               # prisma studio
yarn ws @repo/db up          # docker compose up -d (postgres:18 on :5432)
yarn ws @repo/db pull:db     # introspect an existing database into the schema
yarn git:pull                # git pull + install + generate:db
```

Each app has its own `env:copy` script (`yarn ws frontend env:copy`); `packages/db` and `apps/api-v2` also ship `.env.example`. The README's root-level `yarn env:copy` does not exist.

### Tests

Only `apps/api-v2` has tests (Jest + ts-jest). There is no turbo `test` task, so run them through the workspace:

```bash
yarn ws api-v2 test                                   # all specs
yarn ws api-v2 test test/sections/claims              # by path
yarn ws api-v2 test -t "should apply pagination"      # single test by name
yarn ws api-v2 test:watch
yarn ws api-v2 test:cov
```

Jest's `testRegex` is `test/.*\.spec\.ts$` — specs live in `apps/api-v2/test/`, mirroring `src/`, never beside the source file. `^src/(.*)$` is mapped, so specs import from `src/...`.

On a fresh clone the suite fails to resolve `@repo/db` until that package has been compiled, because it resolves through `main: dist/index.js`. Run `yarn ws @repo/db build` (after `yarn generate:db`) once before running tests. `eslint` currently reports 6 pre-existing `@typescript-eslint/unbound-method` errors in `test/bootstrap/main.spec.ts`, `test/common/db/prisma.service.spec.ts` and the three `test/common/decorators/*` specs, so a non-zero `lint` exit is not necessarily caused by your change.

## Architecture

### Two API generations

`apps/api` (v1, in production) and `apps/api-v2` (v2, actively being built) are separate services with different stacks and auth models. New API work goes in `api-v2` unless the task explicitly concerns v1.

**`apps/api` (v1)** — Express 5, ESM (`"type": "module"`, so relative imports need `.js` extensions). A single `Core` class (`src/Core.ts`) constructs and owns every subsystem — Winston logger, Keycloak + KeycloakAdmin, Prisma, AWS S3, Discord integration, cron jobs — and hands itself to `Web` (`src/web/Web.ts`), which instantiates all controllers and registers routes via `src/web/routes/index.ts` using a `Router` helper. Auth is Keycloak (`keycloak-connect`) plus permission middleware in `src/web/routes/utils/`. Validation is express-validator/yup declared inline at route registration. Everything is served under `/api/v1`.

**`apps/api-v2`** — NestJS 11, URI versioning with default version `2` (routes are `/v2/...`), Swagger at `/v2/docs` (`docs.json` / `docs.yaml`). Source layout: `src/sections/<name>/` holds `<name>.module.ts`, `.controller.ts`, `.service.ts` and `dto/`; nested resources nest further (`sections/applications/questions/`). Cross-cutting code lives in `src/common/{db,decorators,dto,guards,interceptors}`.

Conventions that matter when adding an api-v2 endpoint:

- **Response envelope** is applied globally by `ResponseInterceptor`. Controllers return raw data (typed `ControllerResponse`) and get `{ status, message, data }`; returning `{ data, meta }` (typed `PaginatedControllerResponse`) yields the paginated envelope. Errors go through `ExceptionsFilter` as `{ status, timestamp, path, error, message }` — throw Nest HTTP exceptions rather than shaping errors by hand.
- **Query features come in decorator pairs**: a method decorator declaring options + Swagger params (`@Paginated`, `@Sortable`, `@Filtered`) and a param decorator reading them back off reflector metadata (`@Pagination`, `@Sorting`, `@Filter`). Both must be present, and `@Sortable`'s `allowedFields` is enforced — an unlisted `sortBy` throws 400.
- **Swagger schemas** use `@ApiDefaultResponse(Dto)`, `@ApiPaginatedResponseDto(Dto)`, `@ApiErrorResponse({ status, description })` from `common/decorators/api-response.decorator.ts` rather than raw `@ApiResponse`.
- **Auth is deny-by-default**: `AuthGuard` is registered as a global `APP_GUARD`. Opt out per route with `@SkipAuth()` (public) or `@OptionalAuth()` (token parsed if present, rejected if invalid). Authenticated requests carry `req.token` (a `BuildTeamProfileDto`, typed in `src/typings/express.d.ts`) — scope queries by `req.token.id`, which is the BuildTeam id.
- **Auth model is per-BuildTeam, not per-user**: a team exchanges its stored `token` (client secret) for a JWT via `POST /auth`, signed with `JWT_SECRET`. There is no Keycloak in v2.
- Modules must list `PrismaService` in their own `providers`; it is not a global module.
- **Slow or external work is queued, not awaited**: `QueueService` (`common/queue/`) adds BullMQ jobs to the `EventQueue` that `apps/worker` consumes, so reverse geocoding, Discord messages and build team webhooks never run inside a request. Job names and payload shapes live in `common/queue/jobs.ts` and mirror the Zod schemas in `apps/worker/src/tasks/` — a change to either has to be made on both. `QueueModule` is `@Global()`, unlike `PrismaService`, because it owns a Redis connection. Without `REDIS_URL` dispatching is a logged no-op, and a dispatch that fails is logged rather than thrown, so a queue outage never fails a write that already committed.
- `src/main.ts` exports `bootstrap()` and only self-invokes under `require.main === module`, so tests can import it.
- `apps/api-v2/roadmap.md` documents the intended URL/response/auth contract for v2 — consult it before designing a new endpoint.

### Frontends

`apps/frontend` (public site, port 3000) and `apps/dashboard` (team/admin dashboard, port 3001) are both Next.js 15 + Mantine 7 + Mapbox, authenticated with next-auth against Keycloak and gated by `src/middleware.ts`. They differ in data access: the frontend is a pages-router app that talks to the v1 API over HTTP via `src/utils/Fetcher.tsx` + SWR, while the dashboard is an app-router app that uses server actions in `src/actions/` querying Prisma directly through the singleton in `src/util/db.ts` (which adds a computed `upload.src` CDN URL). The frontend is localized with next-i18next/Crowdin.

### Shared packages

`packages/db` is the only place a Prisma schema exists; it re-exports the entire generated client (`export * from '@prisma/client'`) so apps import types and enums from `@repo/db`, never from `@prisma/client`. Turbo makes `build` depend on `generate:db`. `packages/typescript-config` exposes `base/expressjs/nestjs/nextjs` presets; `packages/prettier-config` is the root `prettier` config.

## Conventions

- **Commits**: conventional commits with a gitmoji, scope `<subrepo>/<scope>` — e.g. `feat(api/v2): :sparkles: Implement GET /applications/:id`. Use `mono` as the scope for repo-wide changes.
- **Formatting**: Prettier with tabs, single quotes, 120 columns, from `@repo/prettier-config`, everywhere. `apps/api-v2` does not declare `prettier` itself, so its `yarn ws api-v2 prettier` script fails with "command not found" — run `npx prettier <paths> --write` from the repo root instead. `apps/api-v2/test/` is not covered by that script's `./src` glob and is currently unformatted.
- `apps/api-v2` lint is `eslint --fix` with type-checked rules; the other apps lint with `--max-warnings 0`.

## CI/CD

Pushes to `main` trigger per-app GitHub Actions (`.github/workflows/{api,dashboard,frontend}.yml`) that use `turbo-ignore` to skip unchanged apps, then build the app's Dockerfile and push to ghcr.io. `apps/api-v2` has no Dockerfile or workflow yet — it is not deployed.
