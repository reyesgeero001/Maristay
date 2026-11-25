# MariStay — Development Progress Tracker

> Persistent hand-off file. A new session should read this file and `docs/PROJECT_REQUIREMENTS.md` first.

**Last updated:** 2026-11-25 · **Current phase:** Phase 6 — Testing and Debugging (in progress). Phases 1–5 complete.

## Environment (verified 2026-11-25)

| Tool | Status |
|---|---|
| Node.js / npm / Git | v24.21.0 / 11.19.0 / 2.49.0 |
| MySQL | XAMPP install at `C:\xampp\mysql\bin` (**not on PATH**). Server = MariaDB 10.4.32 on port 3306, running. `root` login works locally. `mysqldump.exe` available in the same folder. |
| Databases | `maristay_db` (demo data, migrated + seeded) and `maristay_test_db` (scratch database for smoke / e2e tests) |

## Completed tasks
- Phase 1: project scaffold, dependencies, Git, env validation, common utilities, requirements doc.
- Phase 2: 8 entities + relations, hand-finished migration with CHECK constraints, `db:create`, idempotent seed; constraints verified in MariaDB.
- Phase 3: unified guest/staff login, JWT (HS256, issuer, expiry), global JwtAuthGuard/RolesGuard/ThrottlerGuard, ownership checks, Guests module.
- Phase 4: Rooms (full CRUD + filters + date availability), Reservations (booking with row lock + READ COMMITTED, update, confirm, cancel).
- Phase 5: Payments + BillingService, StayService (check-in / check-out transactions), digital keys, housekeeping, staff, service orders, simulated notifications.
- Manual smoke tests of every endpoint against `maristay_test_db` (scripts kept outside the repo; results summarized below).

## Implemented endpoints (44)

| Module | Endpoints |
|---|---|
| Auth (2) | POST /auth/login · GET /auth/me |
| Guests (6) | POST /guests · GET /guests · GET /guests/:id · PATCH /guests/:id · DELETE /guests/:id · GET /guests/:id/reservations |
| Rooms (6) | GET /rooms · GET /rooms/:id · POST /rooms · PATCH /rooms/:id · PUT /rooms/:id · DELETE /rooms/:id |
| Reservations (8) | POST · GET · GET /:id · PATCH /:id · PATCH /:id/confirm · PATCH /:id/check-in · PATCH /:id/check-out · DELETE /:id |
| Payments (4) | POST · GET · GET /:id · PATCH /:id |
| Digital keys (5) | POST · POST /validate · GET · GET /:id · PATCH /:id/revoke |
| Housekeeping (4) | POST · GET · GET /:id · PATCH /:id |
| Staff (5) | POST · GET · GET /:id · PATCH /:id · DELETE /:id |
| Service orders (4) | POST · GET · GET /:id · PATCH /:id |

## Tested endpoints
All 44 exercised manually with a Node fetch script (positive + negative cases) — see `docs/TESTING_REPORT.md` once written. Automated Jest/Supertest suites: **pending**.

## Database implementation status
Complete. `npm run db:setup` = create DB → run migration → seed. `npm run schema:check` shows only 2 cosmetic MariaDB-specific diffs (nullable default reported as `'NULL'`), which are no-ops.

## Authentication status
Complete: bcrypt (10 rounds), JWT HS256 with expiry, per-request account re-validation (deactivated users lose access immediately), RBAC, ownership, login rate limit 5/min, Helmet, restricted CORS, whitelist validation.

## Current errors
None known.

## Resolved errors
| # | Error | Fix |
|---|---|---|
| E1 | `ER_PARSE_ERROR near 'SHARE'` — TypeORM `pessimistic_read` emits MySQL 8 `FOR SHARE`, unsupported by MariaDB 10.4 | Removed shared lock; booking transactions now run at `READ COMMITTED` with a `FOR UPDATE` lock on the room row (portable across MySQL and MariaDB, still prevents double booking — verified with 5 concurrent requests: 1×201, 4×409) |
| E2 | `schema:log` reports `CHANGE date … NULL` drift | TypeORM `mysql` driver reads MariaDB's `'NULL'` default literally; diff is a no-op. Documented, not "fixed" |
| E3 | Placeholder bcrypt dummy hash in AuthService | Replaced with a real hash generated at startup |

## Architectural decisions
- **AD1** NestJS 11.2 + TypeORM 0.3.31 (mature, officially compatible) instead of NestJS 12 / TypeORM 1.x.
- **AD2** XAMPP MariaDB 10.4 used as the MySQL server (driver `mysql2`, TypeORM `type: 'mysql'`).
- **AD3** Global guards order: Throttler → JwtAuth (`@Public()` opt-out) → Roles (`@Roles()`); ownership in services.
- **AD4** `npm audit`: 3 moderate advisories in TypeORM 0.3's `glob`; fix requires TypeORM 1.x. Accepted (no user-controlled globs).
- **AD5** No `users` table: guests and staff authenticate from their own tables via one AuthService; email unique across both (IdentityService).
- **AD6** Booking concurrency: room row `SELECT … FOR UPDATE` + `READ COMMITTED` transaction.
- **AD7** Workflow orchestration in `reservations/stay.service.ts`; other modules export small transactional helpers (BillingService, DigitalKeysService, HousekeepingAssignmentService) — no circular imports.
- **AD8** Money arithmetic in integer centavos; DECIMAL columns exposed as numbers via a transformer.
- **AD9** Digital key = 32 random bytes, stored as SHA-256 hash (high entropy → fast hash is sufficient and allows lookup).
- **AD10** Payments never auto-downgrade a CONFIRMED reservation (check-in independently requires full payment).
- **AD11** Datetimes stored in UTC (`timezone: 'Z'`); DATE columns returned as `YYYY-MM-DD` strings; "today" uses the server's local date.

## Deviations from the laboratory designs
See `docs/PROJECT_REQUIREMENTS.md` §8 (D1–D15).

## Git commit history
1. `a7964e1` chore: initialize MariStay NestJS backend
2. `e2ec3b1` feat: configure MySQL and TypeORM database entities
3. `874c285` feat: implement JWT authentication and role authorization
4. `f40f47e` feat: implement guest room and reservation management
5. `e4b7f89` feat: integrate payments and digital check-in checkout
6. `ebe0911` feat: implement digital keys housekeeping and service orders

## Remaining mandatory requirements
- Automated tests (unit + e2e) and actual results.
- Postman collection + environment.
- SQL export (`exports/maristay.sql`) via mysqldump.
- README, API documentation, architecture/database/security docs, final documentation (+PDF), presentation, video script, defense Q&A.
- Manual by the student: GitHub repository creation/push, screenshots, video recording, adding links to the cover page.

## Next recommended action
Write Jest unit tests and Supertest e2e tests, then Postman collection and SQL export.
