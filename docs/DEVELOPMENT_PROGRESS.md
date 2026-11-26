# MariStay — Development Progress Tracker

> Persistent hand-off file. A new session should read this file, `docs/PROJECT_REQUIREMENTS.md` and `docs/COMPLIANCE_CHECKLIST.md` first.

**Last updated:** 2026-11-26 · **Current phase:** Phase 9 (finalization) complete. Every mandatory requirement that can be completed locally is **implemented and verified**. The remaining items need the student's own accounts, recording or approval (see *Remaining mandatory requirements*).

## Environment (verified 2026-11-26)

| Tool | Status |
|---|---|
| Node.js / npm / Git | v24.21.0 / 11.19.0 / 2.49.0 |
| MySQL | XAMPP install at `C:\xampp\mysql\bin` (**not on PATH**). The server is **MariaDB 10.4.32** (MySQL-compatible) on port 3306; `mysqldump.exe` is in the same folder. No Oracle MySQL server is installed, so Oracle MySQL compatibility is expected but not verified (Compliance Checklist §6). |
| Databases | `maristay_db`: demo data; migrated and seeded; contains the accidental-run records, cancelled or deactivated (E9). `maristay_test_db`: recreated by every `npm run test:e2e`. `maristay_postman_db`: full Postman/Newman runs on port 3001; rebuilt by `npm run postman:reset`. Other XAMPP databases are untouched. |
| Local secrets | `.env` (git-ignored) holds the DB settings, a `JWT_SECRET` (rotated 2026-11-26) and a strong random `SEED_DEMO_PASSWORD` (22 characters, never committed). Read them from `.env`; never print or commit them. |
| Doc tooling | `npm run docs:build` (marked + local mermaid + headless Edge → PDF). |
| Slide tooling | `node scripts/build-presentation.js` needs `npm install --no-save pptxgenjs`. PowerPoint 16 is installed and was used to render the slides for checking. |
| Collection runner | `npm run postman:newman` needs `npm install --no-save newman`. Install it together with pptxgenjs, because each `--no-save` install removes the other. |

## Completed tasks
- **Phase 1:** scaffold, dependencies, Git, environment validation, common layer, requirements doc.
- **Phase 2:** 8 entities and relations; migration with CHECK constraints; `db:create`; idempotent seed. Constraints verified.
- **Phase 3:** unified login, JWT, global guards (Throttler → JWT → Roles), ownership checks, Guests module.
- **Phase 4:** Rooms (full CRUD, filters, date availability); Reservations (row-locked READ COMMITTED booking, update, confirm, cancel).
- **Phase 5:** Payments and BillingService; StayService check-in/check-out; Digital Keys; Housekeeping; Staff; Service Orders; simulated notifications.
- **Phase 6:** 33 unit and 46 e2e tests, all passing. Postman collection (11 folders, 122 requests) and environment. `exports/maristay.sql` produced by mysqldump; re-import verified.
- **Phase 7:** README, SYSTEM_ARCHITECTURE, DATABASE_DESIGN, API_DOCUMENTATION, AUTHENTICATION_SECURITY, TESTING_REPORT; final documentation sources in `docs/final/`, assembled into `FINAL_DOCUMENTATION.md` and `MariStay_Final_Documentation.pdf`.
- **Phase 8:** PRESENTATION_GUIDE, VIDEO_DEMO_SCRIPT, DEFENSE_QUESTIONS (34 Q&A).
- **Phase 9 (2026-11-26), finalization:**
  - **Postman:**
    - Isolated Postman environment (`maristay_postman_db`, port 3001, `scripts/postman-instance.js`).
    - Collection bugs found by real runs and fixed (B6, B7).
    - Three Newman runs: 122/122 requests, 177/177 assertions each.
    - Folders 1 + 10 (the video workflow) verified on their own: 25 requests, 43/43 assertions.
  - **Security review:**
    - Full Git-history secret scan: clean.
    - JWT secret rotated; regression 33/33 unit and 46/46 e2e passed; a token signed with the old secret now gets 401.
    - Postman workspace files git-ignored.
  - **Compliance checklist:** `docs/COMPLIANCE_CHECKLIST.md`, also added to the PDF.
  - **Documentation completed:** problem statement, technologies, database-server section, installation guide, evidence list, recommendations.
  - **Slides:** editable deck `docs/MariStay_Presentation.pptx` (15 slides with speaker notes; validated and visually checked).
  - **Video script:** rewritten for the required order plus the extra parts.
  - **SQL export:** re-verified.
- Optional React front-end: **not implemented** (optional bonus; excluded by the student's instruction).

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

By method: GET 18 · POST 10 · PATCH 11 · PUT 1 · DELETE 4.

## Tested endpoints
All 44 endpoints were exercised by the e2e suite and the Postman collection, with positive and negative cases (`docs/TESTING_REPORT.md`).

The full collection passes in Newman against `maristay_postman_db` on port 3001: 122/122 requests, 177/177 assertions, 0 failures. There were three runs on 2026-11-26; the last used the submitted v2.1 file and the rotated JWT secret.

**Not yet passed in the Postman desktop app.** The two earlier desktop attempts failed for collection and environment reasons (E9, E10), both since resolved.

## Database implementation status
Complete. `npm run db:setup` = create → migrate → seed. `npm run schema:check` shows only 2 cosmetic MariaDB-specific no-op diffs. Timestamps use the server's local time zone.

## Authentication status
Complete:
- bcrypt (cost 10);
- JWT HS256 with a 1 h expiry and issuer check (secret rotated 2026-11-26);
- account re-validated on every request;
- RBAC and ownership checks;
- login limit of 10/min (429 verified);
- Helmet headers and restricted CORS (both verified);
- whitelist validation.

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
| E8 | Weak local demo password would be brute-forceable from hashes in the committed SQL | Rotated to a strong random password before the SQL was ever committed; the 6 demo accounts were re-hashed |
| E9 | First full Postman run, accidentally against `maristay_db` on port 3000: 71 of 176 assertions failed | 32 request bodies quoted numeric placeholders, so the API rejected them (400). Fixed in the collection; validation unchanged. `maristay_db` was backed up first (git-ignored `exports/tmp/`). Through the API, leftover PENDING bookings #5 and #7 were cancelled and guest #4 was deactivated; nothing was deleted |
| E10 | Postman desktop run on port 3001: 138 failures, all protected requests 401 | All six logins failed because `demoPassword` did not reach the requests (Newman reproduced the pattern only with an empty or wrong value). Login - Manager now has a pre-request guard with a clear message |
| E11 | `exports/maristay.sql` starts with `CREATE DATABASE IF NOT EXISTS maristay_db; USE maristay_db;`, so importing it on this machine targets the existing demo database | No change to the file (correct for a fresh server). An accidental import here stopped at the first `CREATE TABLE` with no changes (verified). Import guidance added to README, Appendix A and Database Design §4.9; verification now uses a scratch copy without those two lines |

## Architectural decisions
- **AD1** NestJS 11.2 + TypeORM 0.3.31 (mature, officially compatible) instead of NestJS 12 / TypeORM 1.x.
- **AD2** XAMPP MariaDB 10.4 is the MySQL server (driver `mysql2`, TypeORM `type: 'mysql'`). Not verified on Oracle MySQL.
- **AD3** Global guard order: Throttler → JwtAuth (`@Public()` opt-out) → Roles (`@Roles()`). Ownership is checked in services.
- **AD4** 3 moderate `npm audit` advisories in TypeORM 0.3's `glob`. The fix would require TypeORM 1.x. Risk accepted.
- **AD5** No `users` table. One AuthService serves the guests and staff tables; email is unique across both.
- **AD6** Booking concurrency: room row `FOR UPDATE` plus a `READ COMMITTED` transaction.
- **AD7** Workflow orchestration lives in `reservations/stay.service.ts`. Helpers take the caller's EntityManager. No circular imports.
- **AD8** Money arithmetic in integer centavos; DECIMAL columns are exposed as numbers.
- **AD9** Digital key = 32 random bytes, stored as a SHA-256 hash.
- **AD10** A CONFIRMED reservation is never auto-downgraded; check-in requires full payment regardless.
- **AD11** DATETIMEs use the server's local time zone (`timezone: 'local'`), matching MySQL `CURRENT_TIMESTAMP`. DATE columns are `YYYY-MM-DD` strings.
- **AD12** Final documentation is generated from chapter files by `scripts/build-docs.js`, so the PDF and the docs stay consistent.
- **AD13** The full Postman collection runs only against `maristay_postman_db` (port 3001, reset before every run), never against the demo database.
- **AD14** `exports/MariStay.postman_collection.json` (v2.1) is the single committed collection; Newman runs exactly this file. The Postman desktop app's file-sync copies (`.postman/`, `postman/`, `exports/MariStay API/`, `exports/*.environment.yaml`) are git-ignored. After editing in Postman, export v2.1 again over the committed file.

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
8. `cfcaa17` fix: use local time zone for DATETIME columns
9. `ff2ed95` docs: finalize project documentation and setup guide

10. test: run Postman collection on isolated database and fix collection bugs
11. docs: add compliance checklist and complete final documentation
12. docs: add presentation slides and video demonstration script

Nothing has been pushed; publication waits for the student's approval.

## Remaining mandatory requirements (student action needed)
1. ~~Approve and commit the Phase 9 changes~~: done (commits 10–12).
2. **GitHub:** create a repository under your account (public, or private with the instructor as collaborator). Then run `git remote add origin …` and `git push -u origin main`. Nothing has been pushed.
3. **Postman desktop run:** reset and start port 3001, run all 122 requests in the Runner, and capture the summary (§8.6–8.7).
4. **Screenshots:** capture the evidence list in `docs/TESTING_REPORT.md` §8.7 and add the images.
5. **Video:** record with your own narration using `docs/VIDEO_DEMO_SCRIPT.md`, upload it, and test the link in an incognito window.
6. **Cover page:** put the GitHub and video links and the date in `docs/final/00-cover.md`, then run `npm run docs:build`.
7. **Slides:** review and rehearse `docs/MariStay_Presentation.pptx` (about 13 minutes).
8. ~~Decide about `MASTER_PROMPT.md`~~: done. It was removed from the tracked files and added to `.gitignore`, and the local copy is kept. It still exists in the first commits, because history was deliberately not rewritten; it contains no secrets.
9. Optional: verify on Oracle MySQL 8 (Compliance Checklist §6).

## Next recommended action
Approve publication and push to GitHub. Then run the collection once in Postman desktop, take the screenshots, record the video, add both links to the cover page, and rebuild the PDF.
