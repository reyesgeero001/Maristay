# Requirements Compliance Checklist

Audit of every mandatory requirement in the ITEC 116 Final Project guidelines (§3 Requirements, §4 Deliverables, §7 Submission Checklist), checked against the implemented system on 2026-11-26.

Status key:
- **Complete:** implemented and verified by the evidence listed.
- **Student action:** needs the student's own account, recording or screenshots. It cannot be done or claimed on the student's behalf.
- **Note:** complete, with a qualification that is stated in the row.

## 1. Backend application

| # | Requirement | Implementation | Evidence | Status |
|---|---|---|---|---|
| 1 | Complete NestJS project that builds and runs | NestJS 11 modular monolith, 9 feature modules | `npm run build`: 0 errors. `npm run start:dev`: "Found 0 errors", 44 routes mapped | Complete |
| 2 | Authentication module: login, JWT, protected routes, password hashing, input validation | `src/auth/` (AuthService, JwtStrategy, global JwtAuthGuard, RolesGuard), bcrypt cost 10, global `ValidationPipe` (whitelist, forbid unknown fields) | e2e tests 1–12; Newman folders 1 and 11 | Complete |
| 3 | At least 2 additional CRUD modules | **Rooms** (POST, GET, PATCH, PUT, DELETE) and **Staff** (POST, GET, PATCH, DELETE = deactivate). Guests and Reservations also cover all four operations | e2e 15–21 and 44; Newman folders 3 and 8 | Complete |
| 4 | At least 20 REST endpoints | **44 endpoints** in 9 resources | Swagger `/api/docs-json`: 44 operations; [API documentation](API_DOCUMENTATION.md) §5.3 | Complete |
| 5 | GET, POST, PUT or PATCH, DELETE | GET 18 · POST 10 · PATCH 11 · PUT 1 · DELETE 4 | §5.3 endpoint table | Complete |
| 6 | Correct HTTP status codes | 200, 201, 204, 400, 401, 403, 404, 409, 429, 500 with one error format | §5.5; Newman status mix (8.6) | Complete |
| 7 | Database connection works | TypeORM + `mysql2`, settings only from `.env` | Server start log; e2e suite against a real database | Complete |

## 2. Database

| # | Requirement | Implementation | Evidence | Status |
|---|---|---|---|---|
| 8 | MySQL database created and working | `maristay_db` on the XAMPP "MySQL" server, which is **MariaDB 10.4.32** (see §6 below) | Migration and seed run; 46 e2e tests and 3 Newman runs against it | Note: verified on MariaDB, not on Oracle MySQL |
| 9 | TypeORM entities for every table | 8 entities: Guest, Room, Reservation, Payment, DigitalKey, Housekeeping, Staff, ServiceOrder | `src/*/entities/*.entity.ts` | Complete |
| 10 | Entity relationships configured | `@ManyToOne` / `@OneToMany` for all 7 relationships | Database Design §4.5 | Complete |
| 11 | Primary keys, foreign keys, normalization | 8 auto-increment PKs, 7 FKs (`ON DELETE RESTRICT`), 3NF, 17 CHECK constraints, unique indexes | §4.4–4.7; constraint tests (Testing §8.3) | Complete |
| 12 | SQL export (`.sql`) | `exports/maristay.sql`, produced by `mysqldump` from the live database | Re-imported into a scratch database on 2026-11-26: 8 tables + `migrations`, 7 FKs, 17 CHECKs, 23 indexes | Complete |

## 3. Authentication and security

| # | Requirement | Implementation | Evidence | Status |
|---|---|---|---|---|
| 13 | JWT authentication | HS256, 1 h expiry, issuer check, account re-validated on every request | e2e 4, 7, 8, 12 | Complete |
| 14 | Protected routes | Global `JwtAuthGuard`; only routes marked `@Public()` are open | e2e 6; Newman "Protected Route Without Token → 401" | Complete |
| 15 | Password hashing | bcrypt (cost 10); hash column never selected or serialized | e2e 1; database shows only `$2b$10$…` | Complete |
| 16 | Input validation | DTOs with class-validator; unknown properties rejected | e2e 3, 11, 14, 22; Newman 400 cases | Complete |
| 17 | No passwords, API keys or credentials in the repository | Secrets only in git-ignored `.env`; `.env.example` holds placeholders | Full Git history scan (9 commits, 158 file versions): no secret values or tokens | Complete |

## 4. API testing

| # | Requirement | Implementation | Evidence | Status |
|---|---|---|---|---|
| 18 | All endpoints tested | Jest unit tests, Supertest e2e tests, Postman collection | 33/33 unit, 46/46 e2e | Complete |
| 19 | Postman collection exported (`.json`) | `exports/MariStay.postman_collection.json` (v2.1): 11 folders, 122 requests | 3 Newman runs: 122/122 requests, 177/177 assertions | Complete |
| 20 | Postman testing in the Postman app | Same collection in the Postman desktop app | Not yet passed in the desktop app (earlier attempts failed because of environment setup) | Student action |
| 21 | Representative API screenshots in the documentation | List in Testing §8.7 | None captured yet | Student action |

## 5. Repository, documentation, video and presentation

| # | Requirement | Implementation | Evidence | Status |
|---|---|---|---|---|
| 22 | Repository under the student's own GitHub account, public or private with the instructor as collaborator | Local Git repository ready | Not published | Student action |
| 23 | README describing the project, tech stack and how to run it | `README.md` | All npm commands it mentions exist in `package.json` | Complete |
| 24 | `.gitignore` excluding `node_modules` and `.env` | `.gitignore` also excludes `dist/`, backups, `exports/tmp/` and Postman workspace files | `git check-ignore` | Complete |
| 25 | At least 5 separate, meaningful commits | 9 incremental commits | `git log` | Complete (final changes still to be committed) |
| 26 | Documentation PDF with all required chapters | `docs/MariStay_Final_Documentation.pdf`, built from the chapter files | Cover, table of contents, Chapters 1–9, References, Appendix | Complete (links and screenshots pending) |
| 27 | GitHub link and video link on the cover page | Placeholders in `docs/final/00-cover.md` | — | Student action |
| 28 | Video 5–10 min with narration, in the required order | `docs/VIDEO_DEMO_SCRIPT.md` | Not recorded | Student action |
| 29 | Presentation slides (10–15 min) | `docs/MariStay_Presentation.pptx` (15 slides with speaker notes) and `docs/PRESENTATION_GUIDE.md` | — | Complete (rehearsal by the student) |
| 30 | Documentation matches the implementation | Generated from the same sources; counts re-checked | This checklist | Complete |
| — | Optional React front-end | Not built (optional bonus only) | — | Not implemented by choice |

## 6. MySQL requirement: MariaDB compatibility and Oracle MySQL verification

* **What was used:** XAMPP's bundled database server, which phpMyAdmin and the XAMPP Control Panel label "MySQL". It is actually **MariaDB 10.4.32** (`SELECT VERSION()` → `10.4.32-MariaDB`).
* **Why it satisfies the course requirement in practice:** MariaDB is a fork of MySQL that keeps the MySQL client protocol, SQL dialect and tools. MariStay connects through the MySQL driver (`mysql2`, TypeORM `type: 'mysql'`). The schema, the `mysqldump` export and the phpMyAdmin demonstration are all standard MySQL tooling.
* **What is verified:** every automated test, the SQL export and all three Newman runs, on MariaDB 10.4.32 only.
* **What is not verified:** no test has been run on **Oracle MySQL** (for example MySQL 8.0 or 8.4). The code uses only features both servers support:
  * row locks (`SELECT … FOR UPDATE`) and `READ COMMITTED` isolation,
  * CHECK constraints (enforced by MySQL from 8.0.16),
  * `utf8mb4_unicode_ci`, `DATETIME(6)` and `DECIMAL`.

  One MariaDB-specific problem was already found and removed (TypeORM's `FOR SHARE` lock, bug B1). Compatibility with Oracle MySQL is therefore **expected, not proven**.
* **Optional verification (student, about 15 minutes):** this does not touch XAMPP.
  1. Download the MySQL Community Server "ZIP Archive" (no installer).
  2. Initialise a separate data folder with `bin\mysqld --initialize-insecure --datadir=<folder>`.
  3. Start it on another port with `bin\mysqld --datadir=<folder> --port=3307 --console`.
  4. Run the e2e suite against it from PowerShell: `$env:DB_PORT='3307'; npm run test:e2e`. The variable lasts only for that terminal, and the suite uses only the `_test` database.
  5. Record the result in Testing §8.
