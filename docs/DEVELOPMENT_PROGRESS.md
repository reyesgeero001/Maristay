# MariStay — Development Progress Tracker

> Persistent hand-off file. A new session should read this file and `docs/PROJECT_REQUIREMENTS.md` first.

**Last updated:** 2026-11-25 · **Current phase:** Phase 1 — Project Initialization (complete) → starting Phase 2

## Environment (verified 2026-11-25)

| Tool | Status |
|---|---|
| Node.js | v24.21.0 |
| npm | 11.19.0 |
| Git | 2.49.0 (global identity configured) |
| MySQL | **Installed via XAMPP but not on PATH**: `C:\xampp\mysql\bin\mysql.exe` (server: MariaDB 10.4.32, XAMPP's MySQL). `mysqld` is running on port 3306; local `root` login works. `mysqldump.exe` is in the same folder. |

## Completed tasks
- Read MASTER_PROMPT.md and all five reference PDFs (Final Project copy, Labs 03–06).
- Located MySQL (XAMPP) and verified connectivity.
- Initialized Git (`main`), `.gitignore` (excludes `references/`, `.env`, `node_modules/`, `dist/`).
- Created NestJS 11 project manually (package.json, tsconfig, nest-cli with Swagger plugin).
- Installed dependencies (NestJS 11.2, TypeORM 0.3.31, mysql2, bcrypt 6, passport-jwt, throttler, helmet, swagger, Jest, Supertest).
- Common layer: enums, env validation, `@Public`, `@Roles`, `@CurrentUser`, RolesGuard, AllExceptionsFilter, ParseIdPipe, money/date utilities, pagination DTO.
- `.env.example` (tracked) and local `.env` (ignored; generated JWT secret + demo password).
- `docs/PROJECT_REQUIREMENTS.md`.
- `npm run build` ✔.

## Pending tasks
- Phase 2: entities, migration, data-source, seed, verify DB.
- Phase 3: auth, guards, guest registration.
- Phase 4–5: all modules and integrated workflow.
- Phase 6: tests, Postman, SQL export.
- Phase 7–8: documentation, presentation.

## Architectural decisions
- **AD1** NestJS 11.2 + TypeORM 0.3.31 instead of the newest majors (NestJS 12 / TypeORM 1.x): mature, well-documented, officially compatible (`@nestjs/typeorm@11` peer `typeorm ^0.3`).
- **AD2** XAMPP's MariaDB 10.4 is used as the MySQL server (it is what the developer's machine provides; MySQL wire-compatible, uses the `mysql2` driver and TypeORM `type: 'mysql'`). No other database technology is used.
- **AD3** Global guards: JwtAuthGuard (opt-out with `@Public()`), RolesGuard (`@Roles()`), ThrottlerGuard.
- **AD4** `npm audit` reports 3 moderate advisories in `glob`/`minimatch` pulled in by TypeORM 0.3 internals; the only fix is TypeORM 1.x (breaking). Risk accepted: entities are passed as classes, no user-controlled globs.

## Git commit history
_(updated after each commit)_

## Next recommended action
Implement the eight TypeORM entities and the initial migration.
