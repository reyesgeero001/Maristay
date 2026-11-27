# MariStay — Hotel Management and Digital Guest Services System

MariStay is a NestJS + TypeORM + MySQL REST API that unifies hotel room reservations, payment recording, digital check-in/check-out, keyless digital room keys, housekeeping and in-room service ordering. It is the backend prototype for the ITEC 116 (Systems Integration and Architecture 2) final project, built from the designs in Laboratory Activities 03–06.

**Developer:** Geero Andrei E. Reyes · BSIT 4C · **Instructor:** John Vincent A. Dallego, MIT

## Features

- **Guests:** register, log in, browse and filter rooms by type, price and date availability, book, change or cancel reservations, check in and out digitally, use a digital room key, order food and amenities, and view their own history.
- **Front desk:** manage reservations, confirm bookings, record and verify payments, assist check-in and check-out, and issue or revoke keys.
- **Housekeeping:** receive cleaning tasks automatically at check-out and update their own tasks. Finishing a task makes the room available again.
- **Manager:** full CRUD for rooms and staff, plus housekeeping assignment and oversight of all operations.
- **Integration:** payments confirm reservations. Check-in sets the room to occupied and issues a key. Check-out settles the bill, revokes keys, and queues cleaning. Each of these runs as one database transaction.
- **Security:** bcrypt hashing, JWT (HS256, expiring), role-based access with ownership checks, strict DTO validation, login rate limiting, Helmet headers, and restricted CORS. No secrets are stored in code.
- **Scale:** 44 REST endpoints with Swagger docs, a Postman collection, and automated unit and e2e tests.

## Technology stack

| Layer | Technology |
|---|---|
| Runtime / language | Node.js 20+ (developed on 24), TypeScript 5.8 |
| Framework | NestJS 11 |
| ORM / database | TypeORM 0.3 with the `mysql2` driver; MySQL-compatible server (developed and tested on XAMPP's MariaDB 10.4.32) |
| Auth | `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt` |
| Validation | `class-validator`, `class-transformer` |
| Security | `helmet`, `@nestjs/throttler` |
| Docs / testing | `@nestjs/swagger`, Jest, Supertest, Postman |

## Prerequisites

- Node.js 20 or newer and npm.
- A MySQL server. Developed on XAMPP's "MySQL", which is MariaDB 10.4.32, and also verified on Oracle MySQL 8.4.11 LTS (migrations, seed, e2e and Postman tests). Start MySQL from the XAMPP Control Panel.
  - On Windows with XAMPP, the `mysql` command is in `C:\xampp\mysql\bin`, which is not on PATH by default. Use the full path or add that folder to PATH.
- Git and Postman.

## Installation

```bash
git clone <repository-url> maristay
cd maristay
npm install
```

## Environment configuration

Copy the template, then edit the copy. Never commit `.env`; it is already in `.gitignore`.

```bash
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```

| Variable | What to put |
|---|---|
| `DB_HOST`, `DB_PORT` | MySQL server, usually `localhost` and `3306` |
| `DB_USERNAME`, `DB_PASSWORD` | Your MySQL account. XAMPP's default `root` has an empty password; use yours if you set one |
| `DB_DATABASE` | `maristay_db` |
| `JWT_SECRET` | A long random value: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `1h` |
| `CORS_ORIGIN` | Front-end origin allowed to call the API (default `http://localhost:5173`) |
| `SEED_DEMO_PASSWORD` | Password given to all demo accounts (8+ characters, letters and numbers) |
| `TEST_DB_DATABASE` | Database used by `npm run test:e2e`. It is recreated on every run, so its name must end with `_test` |

The application refuses to start if a required variable is missing or `JWT_SECRET` is weak.

## Database setup

### Option A: migrations and seed (recommended)

```bash
npm run db:setup          # = db:create + migration:run + seed
```

| Command | Purpose |
|---|---|
| `npm run db:create` | `CREATE DATABASE IF NOT EXISTS maristay_db` (never drops anything) |
| `npm run migration:run` | Create the 8 tables, keys, indexes and CHECK constraints |
| `npm run migration:show` / `npm run migration:revert` | Show or undo migrations |
| `npm run schema:check` | Compare entities with the live schema |
| `npm run seed` | Insert demo data. Safe to re-run: it never duplicates, updates or deletes |

### Option B: import the SQL export

Import [`exports/maristay.sql`](exports/maristay.sql) into an empty server:

- **phpMyAdmin:** open the Import tab, choose `exports/maristay.sql`, click Go.
- **Command line:** `mysql -u root -p < exports/maristay.sql` (XAMPP: `C:\xampp\mysql\bin\mysql.exe -u root -p < exports\maristay.sql`)

The file creates and uses `maristay_db`, and it has no `DROP TABLE` statements. Import it only on a server that does not already have a `maristay_db`; otherwise the import stops at the first table and changes nothing.

The imported demo accounts' password is the one used when the export was made. It is not stored in the repository. Use Option A to create accounts with your own `SEED_DEMO_PASSWORD`.

### Exporting the database again

```bash
mysqldump -u root -p --databases maristay_db --single-transaction --skip-add-drop-table > exports/maristay.sql
```

## Running the application

```bash
npm run build         # compile TypeScript to dist/
npm run start:dev     # development, watch mode
npm run start         # run once
npm run start:prod    # run the compiled build (after npm run build)
```

- API base URL: `http://localhost:3000/api/v1`
- Swagger / OpenAPI: `http://localhost:3000/api/docs`. Log in, click **Authorize**, then paste the `accessToken`.

## Optional React frontend

An optional web interface for all four roles lives in [`frontend/`](frontend/) (React, Vite, TypeScript, Tailwind CSS). It has its own dependencies and uses only the REST API. Postman and Swagger remain the main ways to test the API.

```bash
npm run start:dev          # 1. backend on http://localhost:3000/api/v1 (repository root)
cd frontend
npm install                # 2. first time only
npm run dev                # 3. open http://localhost:5173 and log in (or Sign up as a new guest)
npm run build              # optional: type-check and production build
```

The API URL comes from `VITE_API_BASE_URL` (default `http://localhost:3000/api/v1`; see `frontend/.env.example`). The backend's default `CORS_ORIGIN` already allows `http://localhost:5173`. Architecture, API mapping and test results are in [`docs/FRONTEND.md`](docs/FRONTEND.md).

**Design:** a Modern Luxury Minimalist theme (midnight navy, champagne gold accents, warm white), defined once in `frontend/src/index.css`; see `docs/FRONTEND.md` §1a.

**Guest sign-up:** the login page links to `/register`, which creates a guest account through the existing public `POST /api/v1/guests` endpoint. There is no role choice: the backend always creates a `GUEST` account and rejects extra fields such as `role` with 400. Staff accounts can only be created by a manager. Verified on 2026-11-27: 37/37 browser checks and 49/49 API and database checks (`npm run verify:registration`) on the isolated `maristay_postman_db`.

## Demo accounts

Created by `npm run seed`. All of them are fictional and use `SEED_DEMO_PASSWORD` from your `.env`.

| Role | Email |
|---|---|
| Manager | `manager@maristay.test` |
| Front desk | `frontdesk@maristay.test` |
| Housekeeping | `housekeeping1@maristay.test`, `housekeeping2@maristay.test` |
| Guest | `juan.delacruz@example.com`, `ana.mendoza@example.com` |

The seed also creates 9 rooms (101–104 Standard, 201–202 Deluxe, 301 Suite, 302–303 Family), sample reservations, a payment, a delivered service order, and housekeeping records.

## Postman

The submitted collection is [`exports/MariStay.postman_collection.json`](exports/MariStay.postman_collection.json) (Postman v2.1): 11 folders and 122 requests with test assertions. Import it together with [`exports/MariStay.postman_environment.json`](exports/MariStay.postman_environment.json).

**Live demonstration (port 3000, `maristay_db`):**
1. Select the **MariStay Local** environment.
2. Set `demoPassword` to your `SEED_DEMO_PASSWORD` and **save** the environment (Ctrl+S). Keep this value local.
3. Send single requests, e.g. *1. Authentication → Login - Manager*, then the room CRUD requests in folder 3.

**Full collection run (isolated database, port 3001).** The full run creates guests, staff, reservations and payments, so never run it against your demonstration database.

```bash
npm run postman:reset    # rebuild ONLY maristay_postman_db (fresh seed)
npm run postman:start    # API for Postman on http://localhost:3001/api/v1 (leave running)
npm run postman:env      # writes exports/tmp/MariStay Postman 3001.postman_environment.json
```

1. Import the generated *MariStay Postman 3001* environment, set `demoPassword`, and **save** it.
2. Run the whole collection in the Collection Runner: default order, 1 iteration, sequential.
3. Before every re-run, stop the server, then run `postman:reset` and `postman:start` again. The login rate limit is kept in memory, and the last request deliberately triggers it.

Command-line alternative:
1. Run `npm install --no-save newman` once.
2. Run `npm run postman:newman` while the port-3001 server is running.

The password is read from `.env` in memory and is never shown.

> `npm install --no-save` adds a tool without changing `package.json`, but the next `npm install` removes it again. If you also rebuild the slides, install both tools together: `npm install --no-save newman pptxgenjs`.

## Testing

```bash
npm run test          # unit tests (no database needed)
npm run test:e2e      # end-to-end tests against a real, isolated MySQL test database
npm run test:cov      # unit test coverage report
```

The e2e suite drops and recreates `TEST_DB_DATABASE` (default `maristay_test_db`), runs the migrations, seeds it, and exercises the full API. It refuses to run against a database whose name does not end with `_test` or `_test_db`. Latest results:

* **Unit tests:** 33/33 passed in 4/4 suites.
* **End-to-end tests:** 46/46 passed.
* **Postman Collection Runner** (desktop app, port 3001): **177/177 assertions**, 0 failed, 0 errors.
* **Newman:** the same collection passed in three runs, **122/122 requests and 177/177 assertions** each time.

All of these ran on MariaDB 10.4.32. Results and annotated screenshots are in [`docs/TESTING_REPORT.md`](docs/TESTING_REPORT.md) §8.7.

## Documentation

| Document | Content |
|---|---|
| [`docs/MariStay_Final_Documentation.pdf`](docs/MariStay_Final_Documentation.pdf) | Final technical documentation (PDF). Rebuild with `npm run docs:build` |
| [`docs/FINAL_DOCUMENTATION.md`](docs/FINAL_DOCUMENTATION.md) | Same content as editable Markdown (generated from the chapter files) |
| [`docs/SYSTEM_ARCHITECTURE.md`](docs/SYSTEM_ARCHITECTURE.md) | Architecture, layers, module integration, workflows |
| [`docs/DATABASE_DESIGN.md`](docs/DATABASE_DESIGN.md) | ERD, data dictionary, keys, normalization |
| [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) | All 44 endpoints with examples and status codes |
| [`docs/AUTHENTICATION_SECURITY.md`](docs/AUTHENTICATION_SECURITY.md) | Login flow, JWT, RBAC, validation, rate limiting |
| [`docs/TESTING_REPORT.md`](docs/TESTING_REPORT.md) | Actual test results, with screenshot evidence in §8.7 (images in [`docs/screenshots/`](docs/screenshots/)) |
| [`docs/MariStay_Presentation.pptx`](docs/MariStay_Presentation.pptx) | Editable defense slides with speaker notes |
| [`docs/PRESENTATION_GUIDE.md`](docs/PRESENTATION_GUIDE.md), [`docs/VIDEO_DEMO_SCRIPT.md`](docs/VIDEO_DEMO_SCRIPT.md), [`docs/DEFENSE_QUESTIONS.md`](docs/DEFENSE_QUESTIONS.md) | Presentation, video, and Q&A preparation |
| [`docs/COMPLIANCE_CHECKLIST.md`](docs/COMPLIANCE_CHECKLIST.md) | Every mandatory requirement with its evidence and status |
| [`docs/PROJECT_REQUIREMENTS.md`](docs/PROJECT_REQUIREMENTS.md), [`docs/DEVELOPMENT_PROGRESS.md`](docs/DEVELOPMENT_PROGRESS.md) | Requirements, deviations, and progress tracker |

## Project structure

```text
src/
  auth/ guests/ rooms/ reservations/ payments/ digital-keys/
  housekeeping/ staff/ service-orders/ notifications/
  common/        decorators, guards, enums, filters, pipes, validators, utilities
  config/        environment validation
  database/      connection config, migrations/, seeds/, data-source.ts
  app.module.ts  app.setup.ts  main.ts
test/            e2e tests (Supertest) and test-database setup
frontend/        optional React frontend (own package.json; see docs/FRONTEND.md)
exports/         maristay.sql, Postman collection (v2.1) and environment
docs/            documentation (final/ holds chapter sources for the PDF, screenshots/ the evidence images)
scripts/         build-docs.js (documentation PDF), postman-instance.js (isolated Postman/Newman runs),
                 build-presentation.js (slides)
```

## Simulated integrations and limitations

- **Payment gateway (simulated):** the front desk records payments. No card data is collected and no money moves.
- **SMS and e-mail (simulated):** `NotificationsService` logs masked messages instead of sending them. Key codes are never included.
- **Smart lock (simulated):** `POST /api/v1/digital-keys/validate` returns an access decision. No physical door is opened.
- **HTTP only:** the local demo runs over plain HTTP. HTTPS must be provided by a reverse proxy in deployment.
- **Front-end is optional and basic:** the React app in `frontend/` covers the main workflows for each role. 36 of the 44 endpoints have a screen, including guest sign-up. Use Postman or Swagger UI for the rest (for example `PUT /rooms/:id`). Sign-up has no email verification. See [`docs/FRONTEND.md`](docs/FRONTEND.md) §6.
- **Databases tested:** MariaDB 10.4.32 (XAMPP) and Oracle MySQL 8.4.11 LTS; see [`docs/COMPLIANCE_CHECKLIST.md`](docs/COMPLIANCE_CHECKLIST.md) §6.
