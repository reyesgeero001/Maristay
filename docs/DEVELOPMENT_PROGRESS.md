# MariStay — Development Progress Tracker

> Persistent hand-off file. A new session should read this file, `docs/PROJECT_REQUIREMENTS.md` and `docs/COMPLIANCE_CHECKLIST.md` first.

**Last updated:** 2026-11-26 · **Current phase:** Phase 9 (finalization) complete. Every mandatory requirement that can be completed locally is **implemented and verified**. The remaining items need the student's own accounts, recording or approval (see *Remaining mandatory requirements*).

## Environment (verified 2026-11-26)

| Tool | Status |
|---|---|
| Node.js / npm / Git | v24.21.0 / 11.19.0 / 2.49.0 |
| MySQL | XAMPP install at `C:\xampp\mysql\bin` (**not on PATH**). The server is **MariaDB 10.4.32** (MySQL-compatible) on port 3306; `mysqldump.exe` is in the same folder. Oracle MySQL is not installed; on 2026-11-27 compatibility was verified with a temporary, portable MySQL 8.4.11 LTS server on port 3307 (Compliance Checklist §6). |
| Databases | `maristay_db`: demo data; migrated and seeded; contains the accidental-run records, cancelled or deactivated (E9). `maristay_test_db`: recreated by every `npm run test:e2e`. `maristay_postman_db`: full Postman/Newman runs on port 3001; rebuilt by `npm run postman:reset`. Other XAMPP databases are untouched. |
| Local secrets | `.env` (git-ignored) holds the DB settings, a `JWT_SECRET` (rotated 2026-11-26) and a strong random `SEED_DEMO_PASSWORD` (22 characters, never committed). Read them from `.env`; never print or commit them. |
| Doc tooling | `npm run docs:build` (marked + local mermaid + headless Edge → PDF). |
| Slide tooling | `node backend/scripts/build-presentation.js` needs `npm install --no-save pptxgenjs`. PowerPoint 16 is installed and was used to render the slides for checking. |
| Collection runner | `npm run postman:newman` needs `npm install --no-save newman`. Install it together with pptxgenjs, because each `--no-save` install removes the other. |

## Completed tasks
- **Phase 1:** scaffold, dependencies, Git, environment validation, common layer, requirements doc.
- **Phase 2:** 8 entities and relations; migration with CHECK constraints; `db:create`; idempotent seed. Constraints verified.
- **Phase 3:** unified login, JWT, global guards (Throttler → JWT → Roles), ownership checks, Guests module.
- **Phase 4:** Rooms (full CRUD, filters, date availability); Reservations (row-locked READ COMMITTED booking, update, confirm, cancel).
- **Phase 5:** Payments and BillingService; StayService check-in/check-out; Digital Keys; Housekeeping; Staff; Service Orders; simulated notifications.
- **Phase 6:** 33 unit and 46 e2e tests, all passing. Postman collection (11 folders, 122 requests) and environment. `database/maristay.sql` produced by mysqldump; re-import verified.
- **Phase 7:** README, SYSTEM_ARCHITECTURE, DATABASE_DESIGN, API_DOCUMENTATION, AUTHENTICATION_SECURITY, TESTING_REPORT; final documentation sources in `docs/final/`, assembled into `FINAL_DOCUMENTATION.md` and `MariStay_Final_Documentation.pdf`.
- **Phase 8:** PRESENTATION_GUIDE, VIDEO_DEMO_SCRIPT, DEFENSE_QUESTIONS (34 Q&A).
- **Phase 9 (2026-11-26), finalization:**
  - **Postman:**
    - Isolated Postman environment (`maristay_postman_db`, port 3001, `backend/scripts/postman-instance.js`).
    - Collection bugs found by real runs and fixed (B6, B7).
    - Three Newman runs: 122/122 requests, 177/177 assertions each.
    - Folders 1 + 10 (the video workflow) verified on their own: 25 requests, 43/43 assertions.
  - **Security review:**
    - Full Git-history secret scan: clean.
    - JWT secret rotated; regression 33/33 unit and 46/46 e2e passed; a token signed with the old secret now gets 401.
    - Postman workspace files git-ignored.
  - **Compliance checklist:** `docs/COMPLIANCE_CHECKLIST.md`, also added to the PDF.
  - **Documentation completed:** problem statement, technologies, database-server section, installation guide, evidence list, recommendations.
  - **Slides:** editable deck `docs/MariStay_Presentation.pptx` (15 slides with speaker notes at the time; 16 since Phase 12).
  - **Video script:** rewritten for the required order plus the extra parts.
  - **SQL export:** re-verified.
- **Phase 10 (2026-11-27), optional React frontend** (committed and pushed on 2026-11-27):
  - `frontend/`: React 19, Vite, TypeScript, Tailwind CSS, Axios, React Router, Lucide. Separate `package.json`; no backend dependency or code change.
  - One login page for all four roles; JWT in `sessionStorage`; role read from the server (`GET /auth/me`); logout on 401 or token expiry; role-guarded routes.
  - Manager: dashboard with live counts, room CRUD with search and filters, staff, guests, reservations, housekeeping assignment.
  - Front desk: reservations, availability, payments, check-in/out, guests, service orders, digital keys.
  - Guest: availability search and booking, own reservations and cancellation, digital check-in/out, digital key and simulated lock, service requests.
  - Housekeeping: own tasks, start and complete cleaning (the room becomes available through the existing API workflow).
  - 35 of the 44 endpoints had a screen at that point (36 after guest sign-up was added in Phase 10b). The unsupported items are listed in `docs/FRONTEND.md` §6.
  - **Verified on 2026-11-27:** browser UI test 30/30 on a freshly reset `maristay_postman_db`; `npm run build` passed; backend regression 33/33 unit and 46/46 e2e.
- **Phase 10b (2026-11-27), guest sign-up page** (committed and pushed on 2026-11-27):
  - New `/register` page (`frontend/src/pages/RegisterPage.tsx`) and a **Sign up** link on the login page.
  - Fields: first and last name, email, phone, password and confirm password, with show/hide buttons. Browser validation mirrors `CreateGuestDto`. The page has a loading state and server error messages, and redirects to login with a success message.
  - Reuses the existing public `POST /guests`. **No backend change was needed.** The endpoint was already public, always creates a `GUEST` account and hashes with bcrypt. It returns 409 for an email used by any guest or staff account, and 400 for `role` or any other extra field (`forbidNonWhitelisted`). Staff are still created only by a manager.
  - The frontend now has 15 screens and uses 36 of the 44 endpoints.
  - **Verified on 2026-11-27** on a freshly reset `maristay_postman_db` (API port 3101, Vite port 5181): browser UI test **37/37**, including 7 new sign-up checks; API and database checks **49/49**; `npm run build` passed. Backend tests were not re-run because no backend code changed. `maristay_db` was not touched.
  - The 49 checks are saved as `backend/scripts/verify-guest-registration.js` (`npm run verify:registration`). It refuses to run against the demo database and prints no secrets.
- **Scope decision (2026-11-27):** the student considered removing Digital Keys and the simulated smart lock, then decided to keep them, because they are part of the approved Lab 03 proposal (keyless room access, smart locks, information flow) and the Lab 04 ERD (Table 5). Functional scope is frozen: 44 endpoints, 8 tables, 9 API modules, 4 roles, 15 frontend screens, 36 frontend-integrated endpoints.
- **Phase 11 (2026-11-27), final verification** (no feature or code change; nothing committed):
  - Regression on isolated databases: backend build ✔, frontend build ✔, unit **33/33**, e2e **46/46**, Newman **177/177**, browser UI **37/37**, registration **49/49**, security/RBAC matrix **126/126** (Testing §8.9).
  - Oracle MySQL 8.4.11 LTS (portable, port 3307, removed afterwards): migration, seed, `schema:check`, e2e **46/46**, Newman **177/177**, SQL export import and constraint enforcement ✔ (Compliance Checklist §6).
  - ERD in `DATABASE_DESIGN.md` checked against `information_schema`: 8 tables, 64 columns, types, PK/FK/UK and 7 relationships match exactly. API documentation covers all 44 Swagger operations (9 tags; Swagger was removed later, in Phase 13).
  - 37 frontend screenshots captured on the isolated database into `docs/screenshots/frontend/` with `frontend/tests/capture-screenshots.cjs` (key codes masked). They were recaptured in Phase 12 with the final UI.
- **Phase 12 (2026-11-27), UI redesign and finalization** (approved by the student; nothing committed):
  - **Modern Luxury Minimalist UI.** Design tokens are in `frontend/src/index.css`. Login and sign-up share a new `AuthLayout`; the sidebar, keycards and guest banner were restyled. No route, API call, permission or test assertion changed. The previous UI is backed up in the git-ignored `exports/tmp/frontend-ui-backup-2026-11-27/`.
  - **Verified on a freshly reset `maristay_postman_db`:** browser UI test **37/37**, registration **49/49**, production build ✔, responsive/accessibility audit **331** checks with 0 findings (Testing §8.10). The main frontend (port 5180 at the time) was confirmed read-only against the API on port 3000 and `maristay_db`.
  - **Screenshots:** all 37 frontend screenshots recaptured with the final UI. The 20 backend screenshots are unchanged. The UI review images were moved out of `docs/` (to the git-ignored `exports/tmp/ui-review-2026-11-27/`).
  - **Video dry-run** of Parts B and C exactly as scripted (`npm run postman:start`, login limit 10/min): Runner folders 1 + 10 → 25/25 requests, 43/43 assertions; then frontend check-in and "Access granted".
  - **Final artifacts rebuilt:** `docs/MariStay_Final_Documentation.pdf` (tall diagrams now scale to fit one page) and `docs/MariStay_Presentation.pptx` (16 slides). Every PDF page and every slide was rendered and checked visually.

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
All 44 endpoints were exercised by the e2e suite and the Postman collection, with positive and negative cases (detailed in the testing report, kept locally and submitted separately).

The full collection passes in Newman against `maristay_postman_db` on port 3001: 122/122 requests, 177/177 assertions, 0 failures. There were three runs on 2026-11-26; the last used the submitted v2.1 file and the rotated JWT secret.

**Passed in the Postman desktop app** on 2026-11-26 (Collection Runner, environment *MariStay Postman 3001*): 177/177 assertions, 0 failed, 0 errors, 17.347 s, average response 13 ms. The two earlier desktop attempts had failed for collection and environment reasons (E9, E10), both since resolved.

## Screenshot evidence
The student captured 21 screenshots on 2026-11-26. 20 were used in the documentation; since Phase 13, 19 are used (the Swagger UI screenshot was removed):

* **Where they appear:** Figure 7.1 and Figures 8.1–8.18 (formerly also Figure 5.1, Swagger UI); Testing §8.7 has the captions and the summary table.
* **Preparation:**
  * The JWTs in the two login responses and the digital key code were redacted.
  * Each image was cropped to the relevant pane.
  * The phpMyAdmin database list, which showed unrelated database names, was cropped out.
  * The files were saved as real PNGs; the captured files had been JPEG data with a `.png` extension.
* **Not used:** one capture duplicated the no-token 401 request. It showed a later environment label but the same response timestamp.
* **Renamed:** `04b-unauthorized-invalid-token.png` showed the *no-token* request, not the invalid-token one, so it was renamed `04a-protected-route-no-token.png`.

The invalid-token 401 case has no screenshot; it is covered by the Runner, Newman and e2e test 7.

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
| E6 | Helmet CSP `upgrade-insecure-requests` would break Swagger UI over HTTP | Directive sent only in production (since Phase 13, without Swagger, Helmet defaults apply everywhere) |
| E7 | Mermaid syntax error (`;` in a sequence message) | Replaced with `,`; all diagrams verified |
| E8 | Weak local demo password would be brute-forceable from hashes in the committed SQL | Rotated to a strong random password before the SQL was ever committed; the 6 demo accounts were re-hashed |
| E9 | First full Postman run, accidentally against `maristay_db` on port 3000: 71 of 176 assertions failed | 32 request bodies quoted numeric placeholders, so the API rejected them (400). Fixed in the collection; validation unchanged. `maristay_db` was backed up first (git-ignored `exports/tmp/`). Through the API, leftover PENDING bookings #5 and #7 were cancelled and guest #4 was deactivated; nothing was deleted |
| E10 | Postman desktop run on port 3001: 138 failures, all protected requests 401 | All six logins failed because `demoPassword` did not reach the requests (Newman reproduced the pattern only with an empty or wrong value). Login - Manager now has a pre-request guard with a clear message |
| E11 | `database/maristay.sql` starts with `CREATE DATABASE IF NOT EXISTS maristay_db; USE maristay_db;`, so importing it on this machine targets the existing demo database | No change to the file (correct for a fresh server). An accidental import here stopped at the first `CREATE TABLE` with no changes (verified). Import guidance added to README, Appendix A and Database Design §4.9; verification now uses a scratch copy without those two lines |

## Architectural decisions
- **AD1** NestJS 11.2 + TypeORM 0.3.31 (mature, officially compatible) instead of NestJS 12 / TypeORM 1.x.
- **AD2** XAMPP MariaDB 10.4 is the MySQL server (driver `mysql2`, TypeORM `type: 'mysql'`). Also verified on Oracle MySQL 8.4.11 LTS on 2026-11-27.
- **AD3** Global guard order: Throttler → JwtAuth (`@Public()` opt-out) → Roles (`@Roles()`). Ownership is checked in services.
- **AD4** 3 moderate `npm audit` advisories in TypeORM 0.3's `glob`. The fix would require TypeORM 1.x. Risk accepted.
- **AD5** No `users` table. One AuthService serves the guests and staff tables; email is unique across both.
- **AD6** Booking concurrency: room row `FOR UPDATE` plus a `READ COMMITTED` transaction.
- **AD7** Workflow orchestration lives in `reservations/stay.service.ts`. Helpers take the caller's EntityManager. No circular imports.
- **AD8** Money arithmetic in integer centavos; DECIMAL columns are exposed as numbers.
- **AD9** Digital key = 32 random bytes, stored as a SHA-256 hash.
- **AD10** A CONFIRMED reservation is never auto-downgraded; check-in requires full payment regardless.
- **AD11** DATETIMEs use the server's local time zone (`timezone: 'local'`), matching MySQL `CURRENT_TIMESTAMP`. DATE columns are `YYYY-MM-DD` strings.
- **AD12** Final documentation is generated from chapter files by `backend/scripts/build-docs.js`, so the PDF and the docs stay consistent.
- **AD13** The full Postman collection runs only against `maristay_postman_db` (port 3001, reset before every run), never against the demo database.
- **AD14** `postman/MariStay.postman_collection.json` (v2.1) is the single committed collection; Newman runs exactly this file. The Postman desktop app's file-sync copies (`.postman/`, everything in `postman/` except the two exported JSON files, `*.environment.yaml`) are git-ignored. After editing in Postman, export v2.1 again over the committed file.

## Deviations from the laboratory designs
See `docs/PROJECT_REQUIREMENTS.md` §8 (D1–D15).

## Git commit history
1. `33cf23a` chore: initialize MariStay NestJS backend
2. `f6fa020` feat: configure MySQL and TypeORM database entities
3. `d70247d` feat: implement JWT authentication and role authorization
4. `de13a77` feat: implement guest room and reservation management
5. `01f02b8` feat: integrate payments and digital check-in checkout
6. `404f2b3` feat: implement digital keys housekeeping and service orders
7. `cd1a654` test: add API collections integration tests and validation
8. `246d06b` fix: use local time zone for DATETIME columns
9. `aaa37e2` docs: finalize project documentation and setup guide

10. test: run Postman collection on isolated database and fix collection bugs
11. docs: add compliance checklist and complete final documentation
12. docs: add presentation slides and video demonstration script

Remote `origin` = https://github.com/reyesgeero001/Maristay (public). On 2026-11-27 `main` was pushed. The history was then rewritten once, with the student's approval, to remove automatic co-author trailers (pushed with `--force-with-lease`); later commits were pushed normally. A backup of the earlier history is kept locally (branch `backup/pre-trailer-removal` and a git-ignored bundle in `exports/tmp/`). The MariStay repository has a repo-local Git identity, `Reyesgeero001`.

## Remaining mandatory requirements (student action needed)
1. ~~Approve and commit the Phase 9 changes~~: done (commits 10–12).
2. ~~**GitHub:** push the project~~: done on 2026-11-27 (public repository, `main`).
3. ~~Postman desktop run~~: done, 177/177 (§8.6).
4. ~~Screenshots~~: done and integrated (§8.7).
5. **Video:** record with your own narration using the video demo script (kept locally, not published), upload it, and test the link in an incognito window.
6. **Cover page:** the GitHub link is in. Add the video link and the submission date to the cover of the final documentation (kept locally and submitted separately), then export it to PDF from Word (same file name).
7. **Slides:** review and rehearse `docs/MariStay_Presentation.pptx` (about 13 minutes).
8. ~~Decide about `MASTER_PROMPT.md`~~: done. It was removed from the tracked files and added to `.gitignore`, and the local copy is kept. It still exists in the first commits, because history was deliberately not rewritten; it contains no secrets.
9. ~~Optional: verify on Oracle MySQL 8~~: done, MySQL 8.4.11 LTS (Compliance Checklist §6).

- **Phase 13 (2026-11-27), Swagger UI removed** (requested by the student; the code change was committed by the student as "Remove Swagger UI"):
  - Reason: the ITEC 116 guidelines require Postman for API testing; Swagger isn't required.
  - Removed: `@nestjs/swagger` (and `swagger-ui-dist`), the Nest CLI Swagger plugin, `setupSwagger()`, the `/api/docs` start-up log, and 193 `@Api…` decorators. The 44 endpoint summaries are kept as code comments.
  - `PartialType`/`OmitType` now come from `@nestjs/mapped-types` (same validation behaviour).
  - Helmet uses its defaults everywhere.
  - Documentation, PDF, slides, video script and presentation guide were updated. Figure 5.1 (Swagger screenshot) was removed; its image is kept in the git-ignored `exports/tmp/`. The video script now demonstrates the backend only (no frontend part).
  - Verified (Testing §8.11): build ✔; `npm run start:dev` maps 44 routes; unit 33/33; e2e 46/46; Newman 177/177; browser 37/37; registration 49/49; security 126/126.

- **Phase 14 (2026-11-28), repository restructure** (approved by the student):
  - Root reduced to `backend/`, `database/`, `docs/`, `frontend/`, `postman/`, `.gitattributes`, `.gitignore` and `README.md`. The backend (`src/`, `test/`, `scripts/`, `package.json`, configuration, `.env.example`) moved into `backend/`; `maristay.sql` into `database/`; the Postman collection and environment into `postman/`.
  - Moved with `git mv`, so file history is kept; no history was rewritten. Paths were updated in the scripts, documentation and README. The local `.env` now belongs in `backend/.env`.
  - Verified (Testing §8.12): 468/468 checks, plus a fresh-clone installation.

- **Phase 15 (2026-11-28), official documentation** (requested by the student):
  - The student's revised 25-page `docs/MariStay_Final_Project_Documentation.docx` is the official documentation; its PDF is exported from Word. Its paths, setup commands, testing instructions and repository structure were updated for the new layout, and its headings were set to Arial (they had been rendering in the theme font). The page layout and table-of-contents page numbers are unchanged.
  - The detailed report built from the Markdown chapters is archived as `docs/reference/MariStay_Technical_Reference.pdf` (with `TECHNICAL_REFERENCE.md`); `npm run docs:build` now writes there.
  - The 126-check security matrix is now `backend/scripts/security-check.js` (`npm run security:check`).

- **Phase 16 (2026-11-28), repository cleanup for final submission** (requested by the student):
  - The final documentation (`.docx`/`.pdf`) is submitted separately. It was removed from the repository, together with the video demo script, the testing report, the defense questions and the archived technical reference (`docs/reference/`). Local copies are kept, the files are listed in `.gitignore`, and no history was rewritten. The phase entries above describe these files as they were at the time.
  - `npm run docs:build` still works without the private testing report: it puts a short placeholder note in that chapter. It writes its output to the git-ignored `docs/reference/`.

## Next recommended action
1. ~~**GitHub:** push the Swagger UI removal~~: done on 2026-11-27.
2. **Video:** record it with the video demo script (kept locally), upload it, and test the link in an incognito window.
3. **Cover:** add the video link and the submission date to the cover of the final documentation (kept locally), export the PDF from Word, and submit it separately; it is not committed.
4. Rehearse the defense with `docs/PRESENTATION_GUIDE.md` and the defense questions (kept locally).
