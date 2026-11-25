# MariStay — Development Progress Tracker

> Persistent hand-off file. A new session should read this file and `docs/PROJECT_REQUIREMENTS.md` first.

**Last updated:** 2026-11-25 · **Current phase:** Phases 1–8 complete. The mandatory backend is **implemented and verified**. The remaining items need the student's own action (see *Remaining mandatory requirements*).

## Environment (verified 2026-11-25)

| Tool | Status |
|---|---|
| Node.js / npm / Git | v24.21.0 / 11.19.0 / 2.49.0 |
| MySQL | XAMPP install at `C:\xampp\mysql\bin` (**not on PATH**). Server: MariaDB 10.4.32 on port 3306. `mysqldump.exe` is in the same folder. |
| Databases | `maristay_db` (demo: migrated + seeded) · `maristay_test_db` (recreated by every `npm run test:e2e`) |
| Local secrets | `.env` (git-ignored) holds the DB settings, a generated `JWT_SECRET` and a strong random `SEED_DEMO_PASSWORD`. The demo accounts in `maristay_db` and `exports/maristay.sql` use that password. Read it from `.env`; never commit it. |
| Doc tooling | `npm run docs:build` (marked + local mermaid + headless Edge → PDF). No LibreOffice, Poppler, or python-pptx is installed, so no .pptx was generated. |

## Completed tasks
- **Phase 1:** scaffold, dependencies, Git, environment validation, common layer, requirements doc.
- **Phase 2:** 8 entities and relations; migration with CHECK constraints; `db:create`; idempotent seed. Constraints verified.
- **Phase 3:** unified login, JWT, global guards (Throttler → JWT → Roles), ownership checks, Guests module.
- **Phase 4:** Rooms (full CRUD, filters, date availability); Reservations (row-locked READ COMMITTED booking, update, confirm, cancel).
- **Phase 5:** Payments and BillingService; StayService check-in/check-out; Digital Keys; Housekeeping; Staff; Service Orders; simulated notifications.
- **Phase 6:** 33 unit and 46 e2e tests, all passing. Postman collection (11 folders, 122 requests) and environment. `exports/maristay.sql` produced by mysqldump and re-import verified.
- **Phase 7:** README, SYSTEM_ARCHITECTURE, DATABASE_DESIGN, API_DOCUMENTATION, AUTHENTICATION_SECURITY, TESTING_REPORT; final documentation sources in `docs/final/`, assembled into `FINAL_DOCUMENTATION.md` and `MariStay_Final_Documentation.pdf` (all 9 Mermaid diagrams verified to render).
- **Phase 8:** PRESENTATION_GUIDE (12-slide outline with speaker notes), VIDEO_DEMO_SCRIPT (instructor's required order plus checklist), DEFENSE_QUESTIONS (34 Q&A).
- Optional React front-end: **not started** (the master prompt allows it only after the backend; deferred).

## Implemented endpoints (44)

| Module | Endpoints |
|---|---|
| Auth (2) | POST /auth/login · GET /auth/me |
| Guests (6) | POST · GET · GET /:id · PATCH /:id · DELETE /:id · GET /:id/reservations |
| Rooms (6) | GET · GET /:id · POST · PATCH /:id · PUT /:id · DELETE /:id |
| Reservations (8) | POST · GET · GET /:id · PATCH /:id · PATCH /:id/confirm · PATCH /:id/check-in · PATCH /:id/check-out · DELETE /:id |
| Payments (4) | POST · GET · GET /:id · PATCH /:id |
| Digital keys (5) | POST · POST /validate · GET · GET /:id · PATCH /:id/revoke |
| Housekeeping (4) | POST · GET · GET /:id · PATCH /:id |
| Staff (5) | POST · GET · GET /:id · PATCH /:id · DELETE /:id |
| Service orders (4) | POST · GET · GET /:id · PATCH /:id |

## Tested endpoints
All 44 were exercised by the e2e suite and/or the manual smoke scripts, including positive and negative cases. Details are in `docs/TESTING_REPORT.md`. The Postman collection is statically validated but **not yet run in Postman**: an automated Newman run was not permitted in the development session.

## Database implementation status
Complete. `npm run db:setup` = create → migrate → seed. `npm run schema:check` shows only 2 cosmetic MariaDB-specific no-op diffs. Timestamps use the server's local time zone.

## Authentication status
Complete: bcrypt (10), JWT HS256 with a 1h expiry and issuer, per-request account re-validation, RBAC, ownership checks, login limit 10/min (429 verified), Helmet (headers verified), restricted CORS (verified), whitelist validation.

## Current errors
None known.

## Resolved errors
| # | Error | Fix |
|---|---|---|
| E1 | `ER_PARSE_ERROR near 'SHARE'`: TypeORM `pessimistic_read` emits MySQL 8 `FOR SHARE`, which MariaDB 10.4 rejects | Booking transactions use `READ COMMITTED` plus `FOR UPDATE` on the room row (6 concurrent bookings → 1×201, 5×409) |
| E2 | `schema:log` reports `CHANGE … NULL` drift | The MariaDB `'NULL'` default literal; the diff is a no-op. Documented |
| E3 | Placeholder bcrypt dummy hash in AuthService | Real hash generated at startup |
| E4 | App-written DATETIMEs (UTC) and DB defaults (local) differed by 8 h | `timezone: 'local'`; seeded rows corrected by the measured offset; SQL re-exported |
| E5 | Login limit 5/min was lower than the 6 role logins in Postman folder 1 | Default raised to 10/min |
| E6 | Helmet CSP `upgrade-insecure-requests` would break Swagger UI over HTTP | Directive sent only in production |
| E7 | Mermaid syntax error (`;` in a sequence message) | Replaced with `,`; all diagrams verified |
| E8 | Weak local demo password would be brute-forceable from hashes in the committed SQL | Rotated to a strong random password; the 6 demo accounts were re-hashed |

## Architectural decisions
- **AD1** NestJS 11.2 + TypeORM 0.3.31 (mature, officially compatible) instead of NestJS 12 / TypeORM 1.x.
- **AD2** XAMPP MariaDB 10.4 is the MySQL server (driver `mysql2`, TypeORM `type: 'mysql'`).
- **AD3** Global guard order: Throttler → JwtAuth (`@Public()` opt-out) → Roles (`@Roles()`). Ownership is checked in services.
- **AD4** 3 moderate `npm audit` advisories in TypeORM 0.3's `glob`. The fix would require TypeORM 1.x. Risk accepted.
- **AD5** No `users` table. One AuthService serves the guests and staff tables; email is unique across both.
- **AD6** Booking concurrency: room row `FOR UPDATE` plus a `READ COMMITTED` transaction.
- **AD7** Workflow orchestration lives in `reservations/stay.service.ts`. Helpers take the caller's EntityManager. No circular imports.
- **AD8** Money arithmetic in integer centavos; DECIMAL columns are exposed as numbers.
- **AD9** Digital key = 32 random bytes, stored as a SHA-256 hash.
- **AD10** A CONFIRMED reservation is never auto-downgraded; check-in requires full payment regardless.
- **AD11** DATETIMEs use the server's local time zone (`timezone: 'local'`), matching MySQL `CURRENT_TIMESTAMP`. DATE columns are `YYYY-MM-DD` strings.
- **AD12** Final documentation is generated from chapter files (`docs/final/*.md` plus the docs/*.md chapters) by `scripts/build-docs.js`, so the PDF and the docs stay consistent.

## Deviations from the laboratory designs
See `docs/PROJECT_REQUIREMENTS.md` §8 (D1–D15).

## Git commit history
1. `a7964e1` chore: initialize MariStay NestJS backend
2. `e2ec3b1` feat: configure MySQL and TypeORM database entities
3. `874c285` feat: implement JWT authentication and role authorization
4. `f40f47e` feat: implement guest room and reservation management
5. `e4b7f89` feat: integrate payments and digital check-in checkout
6. `ebe0911` feat: implement digital keys housekeeping and service orders
7. `fe48d88` test: add API collections integration tests and validation
8. `cfcaa17` fix: use local time zone for DATETIME columns (this commit also included the first two architecture/database docs)
9. docs: finalize project documentation and setup guide (this update)

## Remaining mandatory requirements (student action needed)
1. **GitHub:** create a repository under your account (public, or private with the instructor as collaborator), then `git remote add origin …` and `git push -u origin main`. Nothing has been pushed.
2. **Postman:** run the collection once in Postman and record the pass count in `docs/TESTING_REPORT.md` §8.6.
3. **Screenshots:** capture the list in `docs/TESTING_REPORT.md` §8.7 and add them to the documentation.
4. **Video:** record with your own narration using `docs/VIDEO_DEMO_SCRIPT.md`, upload it, and test the link in incognito.
5. **Cover page:** put the GitHub and video links in `docs/final/00-cover.md`, then run `npm run docs:build` to regenerate the PDF.
6. **Slides:** build them in PowerPoint or Google Slides from `docs/PRESENTATION_GUIDE.md`.
7. Decide whether `MASTER_PROMPT.md` (committed in the first commit) should stay in the public repository.

## Next recommended action
Push to GitHub, run the Postman collection, then record the video.
