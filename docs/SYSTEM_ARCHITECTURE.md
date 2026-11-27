# System Architecture

## 3.1 Architecture overview

MariStay is a **modular monolith**: one NestJS application, organised into nine feature modules, backed by one MySQL database. It keeps the layers of Lab 03 (client → API → application server → database / auth service / notifications) and implements them as code.

```mermaid
flowchart TB
    subgraph Clients["Clients"]
        PM["Postman (desktop app / Newman)"]
        FE["React web frontend (optional bonus, Vite, port 5173)"]
    end

    subgraph API["MariStay API — NestJS application server (Node.js, port 3000, prefix /api/v1)"]
        direction TB
        MW["Helmet security headers · CORS · ValidationPipe · ClassSerializer · AllExceptionsFilter"]
        G["Global guards: ThrottlerGuard → JwtAuthGuard → RolesGuard"]
        subgraph Modules["Feature modules (Controller → Service → Repository)"]
            AUTH["Auth"] --- GUESTS["Guests"] --- ROOMS["Rooms"]
            RES["Reservations + StayService"] --- PAY["Payments + Billing"] --- KEYS["Digital Keys"]
            HK["Housekeeping"] --- STAFF["Staff"] --- SO["Service Orders"]
        end
        NOTIF["NotificationsService (SIMULATED SMS / e-mail)"]
    end

    DB[("MySQL — maristay_db (8 tables, InnoDB)")]
    LOCK["Smart lock (SIMULATED via POST /digital-keys/validate)"]
    PG["Payment gateway (SIMULATED: payments are recorded, no money moves)"]

    PM -->|HTTPS in production / HTTP locally · JSON · Bearer JWT| MW
    FE -->|Axios · JSON · Bearer JWT| MW
    MW --> G --> Modules
    Modules -->|TypeORM + mysql2, parameterised SQL| DB
    RES --> NOTIF
    SO --> NOTIF
    KEYS -.-> LOCK
    PAY -.-> PG
```

| Lab 03 component | MariStay implementation |
|---|---|
| Users: guests, front desk, housekeeping, management | Roles `GUEST`, `FRONT_DESK`, `HOUSEKEEPING`, `MANAGER` enforced by `RolesGuard` |
| Client application (web/mobile) | Postman, the required API testing tool, plus an optional React web frontend in `frontend/` for all four roles (15 screens, 36 of the 44 endpoints; see `docs/FRONTEND.md`). A mobile app is future work. |
| API calls | REST/JSON under `/api/v1` (44 endpoints) |
| Application / web server | NestJS 11 on Node.js 24 (Express platform) |
| Auth service | `AuthModule` — bcrypt + JWT (HS256) + passport-jwt |
| Database server | MySQL-compatible server accessed with TypeORM 0.3 and `mysql2`: XAMPP MariaDB 10.4.32 for development, also verified on Oracle MySQL 8.4.11 LTS (Testing §8.9) |
| SMS / e-mail notification | `NotificationsService` — simulated adapter (logs masked messages) |
| Payment gateway | Simulated: `PaymentsModule` records payments only |
| Smart locks | Simulated: `POST /digital-keys/validate` returns an access decision |

## 3.2 System components

| Module | Responsibility | Main files |
|---|---|---|
| AuthModule | Login for guests and staff, JWT issuing/validation, cross-table email uniqueness | `auth.service.ts`, `strategies/jwt.strategy.ts`, `guards/jwt-auth.guard.ts`, `identity.service.ts` |
| GuestsModule | Registration, profiles, deactivation, reservation history | `guests.service.ts` |
| RoomsModule | Room catalogue, filtering, date-range availability, manager CRUD | `rooms.service.ts` |
| ReservationsModule | Booking with conflict prevention, updates, confirmation, cancellation, **check-in/check-out orchestration** | `reservations.service.ts`, `stay.service.ts` |
| PaymentsModule | Payment recording/verification, balance computation (`BillingService`) | `payments.service.ts`, `billing.service.ts` |
| DigitalKeysModule | Key issuing/revoking (used by check-in/out), validation (smart-lock simulation) | `digital-keys.service.ts`, `digital-key-access.service.ts` |
| HousekeepingModule | Cleaning tasks, automatic assignment, room release | `housekeeping.service.ts`, `housekeeping-assignment.service.ts` |
| StaffModule | Employee accounts (manager only) | `staff.service.ts` |
| ServiceOrdersModule | Food/amenity/service orders with server-side catalog pricing | `service-orders.service.ts`, `service-catalog.ts` |
| NotificationsModule | Simulated SMS/e-mail adapter | `notifications.service.ts` |
| common/ | Enums, decorators (`@Public`, `@Roles`, `@CurrentUser`), RolesGuard, exception filter, pipes, validators, utilities | `src/common/**` |
| database/ | Connection options, migration, seed, data source for the CLI | `src/database/**` |

## 3.3 Layered architecture

```mermaid
flowchart LR
    C["Client<br/>(Postman)"] -->|HTTP request + JSON| CT["Controller<br/>routes, params,<br/>validated DTO"]
    CT -->|method call| S["Service<br/>business rules,<br/>transactions"]
    S -->|Repository / EntityManager| R["TypeORM Repository<br/>entities ↔ rows"]
    R -->|parameterised SQL via mysql2| D[("MySQL")]
    D -->|rows| R -->|entities| S -->|result object| CT -->|JSON + status code| C
```

* **Controller layer** — receives the request, reads path/query parameters, receives the already-validated DTO, calls one service method and returns its result. Controllers contain no business logic (e.g. [`rooms.controller.ts`](../src/rooms/rooms.controller.ts)).
* **Service layer** — enforces business rules (availability, ownership, status transitions, payment rules) and opens database transactions when several rows must change together (e.g. [`stay.service.ts`](../src/reservations/stay.service.ts)).
* **Repository layer** — TypeORM `Repository<Entity>` or the transaction's `EntityManager` turns entities into parameterised SQL.
* **Database layer** — MySQL stores the data and enforces primary keys, foreign keys (`ON DELETE RESTRICT`), unique indexes and CHECK constraints.

## 3.4 Request and response flow (with security)

```mermaid
sequenceDiagram
    autonumber
    participant P as Postman
    participant N as NestJS pipeline
    participant C as Controller
    participant S as Service
    participant R as TypeORM Repository
    participant DB as MySQL
    P->>N: PATCH /api/v1/rooms/5  {"pricePerNight": 2800}<br/>Authorization: Bearer <JWT>
    N->>N: ThrottlerGuard (≤300 req/min/IP)
    N->>N: JwtAuthGuard — verify signature & expiry,<br/>reload account, must be ACTIVE (else 401)
    N->>N: RolesGuard — @Roles(MANAGER) (else 403)
    N->>N: ParseIdPipe + ValidationPipe (UpdateRoomDto) (else 400)
    N->>C: update(5, dto)
    C->>S: roomsService.update(5, dto)
    S->>R: findOneBy({ roomId: 5 })
    R->>DB: SELECT … FROM rooms WHERE roomId = ?
    DB-->>R: row
    S->>S: business rules (unique roomNo, OCCUPIED lock)
    S->>R: save(room)
    R->>DB: UPDATE rooms SET pricePerNight = ? WHERE roomId = ?
    DB-->>R: OK
    R-->>S: Room entity
    S-->>C: Room
    C-->>N: Room
    N-->>P: 200 OK + JSON (ClassSerializer removes @Exclude fields)
```

Errors at any step become a consistent JSON body via `AllExceptionsFilter`:
`{ "statusCode": 409, "error": "CONFLICT", "message": "Room number 101 already exists", "path": "/api/v1/rooms", "timestamp": "…" }`.
Database errors are translated (duplicate → 409, FK violation → 400/409, CHECK violation → 400) and never expose SQL.

## 3.5 Module integration

```mermaid
flowchart LR
    RES["ReservationsModule<br/>ReservationsService · StayService"]
    PAY["PaymentsModule<br/>BillingService"]
    KEYS["DigitalKeysModule<br/>DigitalKeysService"]
    HK["HousekeepingModule<br/>HousekeepingAssignmentService"]
    NOTIF["NotificationsModule"]
    SO["ServiceOrdersModule"]
    GUESTS["GuestsModule"] --> AUTH["AuthModule<br/>IdentityService"]
    STAFF["StaffModule"] --> AUTH
    RES --> PAY
    RES --> KEYS
    RES --> HK
    RES --> NOTIF
    SO --> NOTIF
```

The arrows are NestJS module imports. `ReservationsModule` orchestrates the guest stay and imports the helpers it needs; none of those modules imports `ReservationsModule` back, so there are **no circular dependencies**. Helpers that take part in a workflow accept the caller's `EntityManager`, so their writes join the caller's transaction.

| Workflow | Modules involved (one transaction) |
|---|---|
| Book room | Reservations (+ Rooms row lock, Guests) |
| Record payment | Payments + Billing + Reservations (auto-confirm) |
| Check-in | Reservations + Billing + Rooms (→ OCCUPIED) + Digital Keys (issue) → Notifications (after commit) |
| Service order | Service Orders + Reservations (lock, must be CHECKED_IN) |
| Check-out | Reservations + Service Orders (cancel open) + Billing + Digital Keys (revoke) + Rooms (→ CLEANING) + Housekeeping (assign) → Notifications |
| Finish cleaning | Housekeeping + Rooms (→ AVAILABLE) |

## 3.6 Integrated business workflow

```mermaid
stateDiagram-v2
    [*] --> PENDING: POST /reservations<br/>(overlap check, room locked)
    PENDING --> CONFIRMED: PAID payments ≥ room total<br/>or PATCH /:id/confirm
    PENDING --> CANCELLED: DELETE /:id
    CONFIRMED --> CANCELLED: DELETE /:id (refundDue reported)
    CONFIRMED --> CHECKED_IN: PATCH /:id/check-in<br/>paid · date valid · room AVAILABLE<br/>→ room OCCUPIED, key issued
    CHECKED_IN --> CHECKED_OUT: PATCH /:id/check-out<br/>balance = 0<br/>→ keys REVOKED, room CLEANING,<br/>housekeeping task created
    CHECKED_OUT --> [*]
    CANCELLED --> [*]
```

```mermaid
stateDiagram-v2
    direction LR
    state "Room status" as RS {
        AVAILABLE --> OCCUPIED: check-in
        OCCUPIED --> CLEANING: check-out
        CLEANING --> AVAILABLE: housekeeping COMPLETED
        AVAILABLE --> CLEANING: manager assigns cleaning
        AVAILABLE --> MAINTENANCE: manager
        MAINTENANCE --> AVAILABLE: manager
    }
```

## 3.7 External service integration

All three external services from Lab 03 are **simulated** so the prototype runs offline with no paid subscriptions. Each lives behind a single class so a real provider can be plugged in later without touching callers.

| External service | Prototype behaviour | Integration point for a real provider |
|---|---|---|
| Payment gateway | Front desk records payments (`POST /payments`); no card data is collected and no money moves | Call the gateway in `PaymentsService.create()` before saving, store its transaction reference |
| SMS / e-mail | `NotificationsService` logs masked recipients and returns `{ status: "SIMULATED_SENT" }`; messages never contain key codes | Replace `NotificationsService.deliver()` with an SMS API / SMTP client |
| Smart lock | `POST /digital-keys/validate` returns `accessGranted: true` or 403; no door is opened | A lock controller would call this endpoint (or a signed variant) and act on the decision |

## 3.8 Deployment note (HTTP vs HTTPS)

The local demonstration runs on plain **HTTP** at `http://localhost:3000`. Lab 03/06 specify HTTPS; in a real deployment TLS would be terminated by a reverse proxy (e.g. Nginx or a cloud load balancer) in front of the API, and `CORS_ORIGIN` would be set to the real front-end origin. HTTPS is **not** configured in this prototype.
