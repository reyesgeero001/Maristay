# Appendix

## A. Setup instructions (summary)

```bash
git clone <repository-url> maristay && cd maristay
npm install
cp .env.example .env          # then edit DB_PASSWORD, JWT_SECRET, SEED_DEMO_PASSWORD
npm run db:setup              # create maristay_db → run migration → seed demo data
npm run start:dev             # http://localhost:3000/api/v1 · Swagger: /api/docs
```
Alternative to `db:setup`: import `exports/maristay.sql` in phpMyAdmin (Import tab).

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
