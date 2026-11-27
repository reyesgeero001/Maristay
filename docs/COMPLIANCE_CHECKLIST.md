# Requirements Compliance Checklist

Audit of every mandatory requirement in the ITEC 116 Final Project guidelines (§3 Requirements, §4 Deliverables, §7 Submission Checklist), checked against the implemented system on 2026-11-26. Final regression and Oracle MySQL 8.4 verification on 2026-11-27 (Testing §8.9).

Status key:
- **Complete:** implemented and verified by the evidence listed.
- **Student action:** needs the student's own account, recording or screenshots. It cannot be done or claimed on the student's behalf.
- **Note:** complete, with a qualification that is stated in the row.

## 1. Backend application

| # | Requirement | Implementation | Evidence | Status |
|---|---|---|---|---|
| 1 | Complete NestJS project that builds and runs | NestJS 11 modular monolith, 9 feature modules | `npm run build`: 0 errors. `npm run start:dev`: "Found 0 errors", 44 routes mapped | Complete |
| 2 | Authentication module: login, JWT, protected routes, password hashing, input validation | `backend/src/auth/` (AuthService, JwtStrategy, global JwtAuthGuard, RolesGuard), bcrypt cost 10, global `ValidationPipe` (whitelist, forbid unknown fields) | e2e tests 1–12; Newman folders 1 and 11 | Complete |
| 3 | At least 2 additional CRUD modules | **Rooms** (POST, GET, PATCH, PUT, DELETE) and **Staff** (POST, GET, PATCH, DELETE = deactivate). Guests and Reservations also cover all four operations | e2e 15–21 and 44; Newman folders 3 and 8 | Complete |
| 4 | At least 20 REST endpoints | **44 endpoints** in 9 resources | Start-up log maps 44 routes (`npm run start:dev`, 2026-11-27); [API documentation](API_DOCUMENTATION.md) §5.3 | Complete |
| 5 | GET, POST, PUT or PATCH, DELETE | GET 18 · POST 10 · PATCH 11 · PUT 1 · DELETE 4 | §5.3 endpoint table | Complete |
| 6 | Correct HTTP status codes | 200, 201, 204, 400, 401, 403, 404, 409, 429, 500 with one error format | §5.5; Newman status mix (8.6) | Complete |
| 7 | Database connection works | TypeORM + `mysql2`, settings only from `.env` | Server start log; e2e suite against a real database | Complete |

## 2. Database

| # | Requirement | Implementation | Evidence | Status |
|---|---|---|---|---|
| 8 | MySQL database created and working | `maristay_db` on the XAMPP "MySQL" server, which is **MariaDB 10.4.32**; also verified on **Oracle MySQL 8.4.11 LTS** (see §6 below) | MariaDB: migration, seed, 46 e2e, Newman 177/177. Oracle MySQL 8.4.11: migration, seed, `schema:check` up to date, 46/46 e2e, Newman 177/177, SQL export imported (2026-11-27) | Complete |
| 9 | TypeORM entities for every table | 8 entities: Guest, Room, Reservation, Payment, DigitalKey, Housekeeping, Staff, ServiceOrder | `backend/src/*/entities/*.entity.ts` | Complete |
| 10 | Entity relationships configured | `@ManyToOne` / `@OneToMany` for all 7 relationships | Database Design §4.5 | Complete |
| 11 | Primary keys, foreign keys, normalization | 8 auto-increment PKs, 7 FKs (`ON DELETE RESTRICT`), 3NF, 17 CHECK constraints, unique indexes | §4.4–4.7; constraint tests (Testing §8.3) | Complete |
| 12 | SQL export (`.sql`) | `database/maristay.sql`, produced by `mysqldump` from the live database | Re-imported into a scratch database on 2026-11-26: 8 tables + `migrations`, 7 FKs, 17 CHECKs, 23 indexes. 2026-11-27: also imported into Oracle MySQL 8.4.11 (8 tables, 64 columns, 7 FKs, 17 CHECKs enforced) | Complete |

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
| 18 | All endpoints tested | Jest unit tests, Supertest e2e tests, Postman collection | 33/33 unit, 46/46 e2e (Figures 8.17–8.18); final regression 2026-11-27: 33/33 unit, 46/46 e2e on MariaDB and 46/46 on Oracle MySQL 8.4 (Testing §8.9) | Complete |
| 19 | Postman collection exported (`.json`) | `postman/MariStay.postman_collection.json` (v2.1): 11 folders, 122 requests | 5 Newman runs, each 177/177 assertions: 3 on 2026-11-26, and on 2026-11-27 one on MariaDB and one on Oracle MySQL 8.4 | Complete |
| 20 | Postman testing in the Postman app | Same collection in the Postman desktop Collection Runner, environment *MariStay Postman 3001* (port 3001) | 2026-11-26: 177/177 assertions passed, 0 failed, 0 errors, 17.347 s, average response 13 ms (Testing §8.6, Figure 8.12) | Complete |
| 21 | Representative API screenshots in the documentation | 19 screenshots in `docs/screenshots/` (tokens and key code redacted), with captions: Figure 7.1 and Figures 8.1–8.18 (the Swagger UI screenshot was removed with Swagger on 2026-11-27) | Login 200, room CRUD 201/200/200/204/404, 401, 403, overlap 409, digital check-in and smart lock, phpMyAdmin tables, test runs | Complete |

## 5. Repository, documentation, video and presentation

| # | Requirement | Implementation | Evidence | Status |
|---|---|---|---|---|
| 22 | Repository under the student's own GitHub account, public or private with the instructor as collaborator | https://github.com/reyesgeero001/Maristay (public, remote `origin`) | 2026-11-27: `main` pushed and opens publicly. All commits are by `Reyesgeero001`; the history was rewritten once, with the student's approval, to remove automatic co-author trailers | Complete |
| 23 | README describing the project, tech stack and how to run it | `README.md` | All npm commands it mentions exist in `package.json` | Complete |
| 24 | `.gitignore` excluding `node_modules` and `.env` | `.gitignore` also excludes `dist/`, backups, `postman/tmp/` and Postman workspace files (only the two exported Postman JSON files in `postman/` are tracked) | `git check-ignore` | Complete |
| 25 | At least 5 separate, meaningful commits | More than 20 incremental commits on `main` (25–27 Nov 2026) | `git log`; GitHub commit history | Complete |
| 26 | Documentation PDF with all required chapters | `docs/MariStay_Final_Documentation.pdf`, built from the chapter files | Rebuilt 2026-11-27: cover, table of contents, Chapters 1–9, References, Appendix A–G (with the final frontend screenshots) and the compliance checklist; every page rendered and checked visually | Complete (video link and date pending) |
| 27 | GitHub link and video link on the cover page | `docs/final/00-cover.md` | GitHub link added; video link and submission date still placeholders | Student action (video link, date) |
| 28 | Video 5–10 min with narration, in the required order | `docs/VIDEO_DEMO_SCRIPT.md` | Not recorded | Student action |
| 29 | Presentation slides (10–15 min) | `docs/MariStay_Presentation.pptx`: 16 editable slides with speaker notes, including one bonus frontend slide; `docs/PRESENTATION_GUIDE.md` | Rebuilt 2026-11-27; every slide rendered and checked visually | Complete (rehearsal by the student) |
| 30 | Documentation matches the implementation | Generated from the same sources; counts re-checked | This checklist | Complete |
| — | Optional React front-end (bonus) | `frontend/` (React 19, Vite, TypeScript, Tailwind CSS); all four roles; 15 screens; 36 of 44 endpoints; approved Modern Luxury Minimalist design; see `docs/FRONTEND.md` | 2026-11-27, after the UI redesign: browser UI test 37/37 and registration 49/49 on a freshly reset isolated database; production build passed; responsive audit 331 checks with 0 findings. 37 screenshots recaptured with the final UI (`docs/screenshots/frontend/`, key codes masked; Figures G.1–G.8) | Complete |
| — | Guest self-registration page (front-end) | `/register` → existing public `POST /api/v1/guests`; no role field; `GUEST` role enforced by the backend (guests table; `forbidNonWhitelisted` rejects `role`); staff created only by a manager | 2026-11-27 on `maristay_postman_db`: 7 browser checks and 49 API/database checks passed (201 without hash, bcrypt `$2b$10$`, login as GUEST, duplicate 409, invalid input 400, `role` MANAGER/FRONT_DESK/HOUSEKEEPING rejected with 400, new guest 403 on staff routes, four demo roles still log in) | Complete |

## 6. MySQL requirement: MariaDB and Oracle MySQL verification

* **Development server:** XAMPP's bundled database server, which phpMyAdmin and the XAMPP Control Panel label "MySQL". It is actually **MariaDB 10.4.32** (`SELECT VERSION()` → `10.4.32-MariaDB`). MariStay connects through the MySQL driver (`mysql2`, TypeORM `type: 'mysql'`).
* **Oracle MySQL verification (2026-11-27):** the official **MySQL Community Server 8.4.11 LTS** ZIP archive (binaries signed by Oracle America, Inc.) ran as a separate, temporary server on `127.0.0.1:3307` with its own data folder. XAMPP MariaDB, its databases and other local projects were not touched. Only environment variables were changed (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `TEST_DB_DATABASE`); no code was changed.

  | Check on Oracle MySQL 8.4.11 | Result |
  |---|---|
  | Connection (`STRICT_TRANS_TABLES` and `ONLY_FULL_GROUP_BY` enabled by default) | ✔ |
  | `npm run db:setup`: create database, run the TypeORM migration, seed | ✔ |
  | `npm run schema:check` (entities vs schema) | ✔ "Your schema is up to date" |
  | Schema compared with MariaDB `maristay_db` via `information_schema` | ✔ identical: 8 tables + `migrations`, 64 application columns, 7 FKs (`ON DELETE RESTRICT ON UPDATE CASCADE`), 17 CHECK constraints, 13 unique indexes |
  | Seed data | ✔ 4 staff, 2 guests, 9 rooms, 3 reservations, 2 payments, 2 housekeeping tasks, 1 service order |
  | Backend e2e suite (`npm run test:e2e`, `maristay_mysql8_test`) | ✔ **46/46** |
  | Postman collection with Newman (API on port 3001 backed by MySQL 8.4) | ✔ **177/177** assertions, 137 requests, 0 failures |
  | `database/maristay.sql` imported (copy without the `CREATE DATABASE`/`USE` lines) | ✔ imported; only deprecation warnings (`utf8` alias, integer display width) from the MariaDB dump header |
  | Constraint enforcement on the imported data | ✔ FK (1451, 1452), CHECK (3819) and UNIQUE (1062) violations rejected |

* **One cosmetic difference, no functional impact:** MariaDB's `mysqldump` omits `ON DELETE RESTRICT` because it is the default, so a MySQL import of the dump shows the foreign keys as `ON DELETE NO ACTION`. In InnoDB, `NO ACTION` and `RESTRICT` behave identically: the delete is rejected immediately (verified above). Databases created through the TypeORM migration, which is the documented setup, show `RESTRICT` on both servers.
* **Conclusion:** MariStay runs unchanged on both MariaDB 10.4.32 and Oracle MySQL 8.4.11 LTS.
