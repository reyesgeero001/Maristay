# Appendix

## A. Installation and configuration

**Prerequisites:** Node.js 20 or newer with npm, Git, Postman, and a MySQL-compatible server. Development used XAMPP: start **MySQL** (and Apache for phpMyAdmin) in the XAMPP Control Panel. On Windows the `mysql` client is in `C:\xampp\mysql\bin`, which is not on PATH.

1. **Get the code and install dependencies**
   ```bash
   git clone <repository-url> maristay && cd maristay
   npm install
   ```
2. **Configure the environment.** Copy the template, then edit the copy. Never commit `.env`.
   ```bash
   cp .env.example .env        # PowerShell: Copy-Item .env.example .env
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # paste the output as JWT_SECRET
   ```
   Set `DB_USERNAME` and `DB_PASSWORD`; XAMPP's `root` has an empty password by default. Choose a `SEED_DEMO_PASSWORD` of 8+ characters with letters and numbers. The API refuses to start if a required value is missing or the JWT secret is weak (Appendix C).
3. **Create the database**, using either option:
   * **Option A (recommended):** `npm run db:setup` creates `maristay_db`, runs the migration and seeds the demo data.
   * **Option B:** import `exports/maristay.sql` in phpMyAdmin (Import tab → choose the file → Go) or with `mysql -u root -p < exports/maristay.sql`. The script creates and uses `maristay_db`. Import it only on a server that does not already have `maristay_db`; otherwise it stops at the first table and changes nothing. With Option B, the demo accounts keep the password used when the export was made, so use Option A to choose your own.
4. **Run the API:** `npm run start:dev`. The API is at `http://localhost:3000/api/v1` and Swagger UI at `http://localhost:3000/api/docs` (log in, click **Authorize**, paste the `accessToken`).
5. **Run the automated tests:** `npm run test` (unit tests, no database needed) and `npm run test:e2e`. The e2e tests drop and recreate only `TEST_DB_DATABASE`, default `maristay_test_db`; the name must end in `_test`.
6. **Postman:**
   * **Demonstration:** import `exports/MariStay.postman_collection.json` and `exports/MariStay.postman_environment.json` (*MariStay Local*, port 3000, `maristay_db`). Set and **save** `demoPassword`. Use single requests from folders 1 and 3 for the live demonstration.
   * **Full collection (all 122 requests):** never run it against `maristay_db`, because it creates test records. Instead:
     1. `npm run postman:reset`, then `npm run postman:start`. This serves an isolated `maristay_postman_db` on port 3001.
     2. `npm run postman:env`, then import `exports/tmp/MariStay Postman 3001.postman_environment.json`, set and save `demoPassword`.
     3. Run the whole collection in the Runner, in order and sequentially.
     4. Alternatively, run `npm install --no-save newman` and then `npm run postman:newman`.
     5. Reset and restart before every re-run.
7. **Re-export the database (optional):** `mysqldump -u root -p --databases maristay_db --single-transaction --skip-add-drop-table > exports/maristay.sql`.

## B. Demo accounts (fictional)

| Role | Email |
|---|---|
| MANAGER | manager@maristay.test |
| FRONT_DESK | frontdesk@maristay.test |
| HOUSEKEEPING | housekeeping1@maristay.test, housekeeping2@maristay.test |
| GUEST | juan.delacruz@example.com, ana.mendoza@example.com |

The password for all demo accounts is the `SEED_DEMO_PASSWORD` value chosen in the local `.env`; it is not stored in the repository.

## C. Environment variables

| Variable | Purpose | Example / default |
|---|---|---|
| NODE_ENV | development / production / test | development |
| PORT | HTTP port | 3000 |
| DB_HOST, DB_PORT | MySQL server | localhost, 3306 |
| DB_USERNAME, DB_PASSWORD | MySQL account | root, *(your password)* |
| DB_DATABASE | Database name | maristay_db |
| JWT_SECRET | Token signing secret (≥ 32 chars, required) | *(random)* |
| JWT_EXPIRES_IN | Token lifetime | 1h |
| CORS_ORIGIN | Allowed browser origin(s) | http://localhost:5173 |
| SEED_DEMO_PASSWORD | Password for seeded demo accounts | *(your choice)* |
| TEST_DB_DATABASE | Database recreated by e2e tests (must end in `_test`) | maristay_test_db |
| LOGIN_RATE_LIMIT, API_RATE_LIMIT | Optional rate-limit overrides | 10, 300 |

## D. Status values

| Entity | Values |
|---|---|
| Room | AVAILABLE, OCCUPIED, CLEANING, MAINTENANCE |
| Reservation | PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED |
| Payment | PENDING, PAID, FAILED, REFUNDED (methods: CASH, CARD, E_WALLET) |
| Digital key | ACTIVE, EXPIRED, REVOKED |
| Housekeeping | PENDING, IN_PROGRESS, COMPLETED |
| Service order | PENDING, PREPARING, DELIVERED, CANCELLED |
| Account | ACTIVE, INACTIVE |

## E. Git commit history

See `docs/DEVELOPMENT_PROGRESS.md` for the full list of incremental commits.

## F. Deviations from the laboratory designs

See `docs/PROJECT_REQUIREMENTS.md` §8 (D1–D15) — e.g. `roomNo` instead of `roomNumber`, required password at registration, server-controlled statuses and prices, staff password columns, reservation price snapshot, simulated external services, HTTPS as a deployment requirement.
