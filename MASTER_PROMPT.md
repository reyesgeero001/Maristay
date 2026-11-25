# MASTER DEVELOPMENT PROMPT — MARISTAY

## 1. Your Role and Responsibilities

Act as a Senior Full-Stack Software Engineer, NestJS Backend Developer, Database Architect, Systems Integration Specialist, Security Engineer, Software QA Engineer, and Technical Documentation Specialist.

Your task is to develop a complete, functional, secure, maintainable, and presentation-ready hotel management and digital guest services system for my college final project in ITEC 116 — Systems Integration and Architecture 2.

You are responsible for implementing the actual system inside my workspace, not merely providing code examples, tutorials, pseudocode, or recommendations.

Develop the system incrementally, execute available terminal commands, install required dependencies, create necessary files, test the implementation, identify errors, and resolve them.

Our target is to finish the mandatory requirements within one day of focused development, with a second day available for improvements if needed.

Prioritize working functionality, academic requirements, security, maintainability, and simplicity over unnecessary complexity.

---

## 2. Project Information

**System Name:** MariStay

**Complete System Title:** MariStay: Hotel Management and Digital Guest Services System

**Course:** ITEC 116 — IT Elective 4 (Systems Integration and Architecture 2)

**Project Type:** Individual Final Project

**Developer:** Geero Andrei E. Reyes

**Section:** BSIT 4C

**Instructor:** John Vincent A. Dallego, MIT

**Project Type:** Systems Integration Backend Prototype

This project must follow my previously completed Laboratory Activities 03, 04, 05, and 06.

Do not replace the existing system concept with an unrelated hotel management system.

---

## 3. Reference Documents

The following documents are the official foundation of this project:

- `09_Final_Project_Student_Copy.pdf`
- `Reyes_Lab#3 (1).pdf`
- `REYES_GEEROANDREI_LAB#4 (1).pdf`
- `REYES_GEERO ANDREI_ACT5.pdf`
- `Reyes_Geero_Andrei_Activity06 (1).pdf`

Read and analyze every available reference document before implementing the project.

Laboratory Activity 03 defines the system description, intended users, system architecture, features, and information flow.

Laboratory Activity 04 defines the database entities, attributes, relationships, primary keys, foreign keys, and data dictionary.

Laboratory Activity 05 defines REST API resources, endpoint conventions, HTTP methods, access permissions, request bodies, response bodies, and status codes.

Laboratory Activity 06 defines authentication, authorization, JWT, password hashing, security measures, and protected resources.

The Final Project Student Copy defines the mandatory requirements, deliverables, grading criteria, and presentation requirements.

If the documents conflict, prioritize the mandatory final project requirements while preserving the original system concept.

Document any necessary modifications to the original laboratory designs. Do not silently change important features or database structures.

If the original PDFs are unavailable, use the detailed requirements contained in this prompt and identify any assumptions.

---

## 4. System Overview

MariStay is an integrated hotel management and digital guest services platform designed to unify:

- Guest registration and authentication
- Hotel room management
- Room reservations
- Payment recording
- Digital check-in
- Digital check-out
- Keyless room access
- Housekeeping management
- Hotel staff management
- Food and amenity ordering
- Room service tracking
- Hotel service coordination

The system aims to solve the following problems:

- Long queues during hotel check-in and check-out.
- Delayed updates regarding room availability and cleaning status.
- Manual room reservation management.
- Manual room service tracking.
- Poor communication between hotel guests and staff.
- Inefficient management of hotel operations.
- Fragmented information across different hotel departments.

The system must demonstrate actual integration between different backend modules.

Do not develop modules that work independently without meaningful relationships and business workflows.

---

## 5. Required Technology Stack

Use the following mandatory technologies:

- Backend Framework: NestJS
- Programming Language: TypeScript
- ORM: TypeORM
- Database: MySQL
- Database Driver: mysql2
- Authentication: JWT
- Password Hashing: bcrypt
- Input Validation: class-validator and class-transformer
- API Testing: Postman
- Version Control: Git and GitHub
- Package Manager: npm

Recommended supporting technologies:

- @nestjs/config
- @nestjs/typeorm
- @nestjs/jwt
- @nestjs/passport
- passport
- passport-jwt
- @nestjs/throttler
- @nestjs/swagger
- Helmet
- Jest
- Supertest

Optional technologies:

- React
- Vite
- Tailwind CSS
- Docker

Use compatible, stable dependency versions.

Do not introduce unnecessary frameworks, microservices, Redis, Kubernetes, message brokers, or paid third-party services.

The required architecture is a modular monolithic NestJS application.

MySQL is mandatory. Do not replace MySQL with SQLite, PostgreSQL, MongoDB, Firebase, or Supabase.

---

## 6. Mandatory Academic Requirements

The finished project must satisfy ALL of the following:

1. A complete and working NestJS backend.
2. A functioning MySQL database.
3. TypeORM entities for every database table.
4. Correct primary keys and foreign keys.
5. Correct entity relationships.
6. At least two additional complete CRUD modules aside from authentication.
7. At least 20 functional REST API endpoints.
8. GET, POST, PUT or PATCH, and DELETE methods.
9. JWT authentication.
10. Protected API routes.
11. Secure password hashing.
12. Input validation.
13. Appropriate HTTP response status codes.
14. Postman API testing.
15. Exported Postman Collection in JSON format.
16. Exported MySQL database in SQL format.
17. GitHub-ready repository.
18. At least five separate, meaningful Git commits.
19. Complete README.md.
20. Proper .gitignore.
21. Complete technical documentation.
22. Preparation materials for a 5–10 minute narrated video demonstration.
23. Presentation materials for a 10–15 minute defense.
24. No hardcoded credentials, database passwords, or JWT secrets.
25. Consistency between actual implementation and documentation.

Target approximately 35–40 meaningful REST endpoints if development time allows.

Never compromise the stability of the mandatory requirements simply to increase endpoint count.

---

## 7. User Roles and Authorization

Implement Role-Based Access Control using the following four user roles.

### GUEST

Guests must be able to:

- Register an account.
- Log in.
- View available rooms.
- View room information.
- Manage their own profile.
- Create room reservations.
- View their own reservations.
- Cancel eligible reservations.
- View their own payment records.
- Perform digital check-in when eligible.
- Perform digital check-out.
- Access their own authorized digital room keys.
- Place food, amenity, and hotel service orders.
- View their own service orders.

Guests must never access another guest's private information.

### FRONT_DESK

Front desk staff must be able to:

- Log in.
- View guest information necessary for hotel operations.
- Manage reservations.
- Confirm reservations.
- Record payments.
- Verify payment status.
- Assist with guest check-in and check-out.
- View room availability.
- View relevant hotel service orders.

### HOUSEKEEPING

Housekeeping staff must be able to:

- Log in.
- View their assigned housekeeping tasks.
- Update assigned cleaning tasks.
- Mark tasks as in progress or completed.
- Update room readiness through the housekeeping workflow.

Housekeeping staff must not have unauthorized access to payment records, unrelated guest information, or management functions.

### MANAGER

Hotel managers must be able to:

- Log in.
- Manage hotel rooms.
- Manage staff accounts.
- Manage housekeeping assignments.
- View hotel operations.
- View reservations and payments.
- Manage service orders.
- Access authorized operational records.

Implement authorization through NestJS guards, role decorators, and ownership verification.

Do not rely on frontend restrictions for security.

The backend must enforce permissions independently.

---

## 8. System Architecture

Follow this architecture:

Client Application / Postman / Optional React Frontend

→ REST API Request

→ Authentication Guard

→ Role and Ownership Authorization

→ DTO Validation

→ Controller

→ Service

→ TypeORM Repository

→ MySQL Database

→ Service

→ Controller

→ JSON Response

Responsibilities:

### Controller Layer

- Receives HTTP requests.
- Handles route parameters.
- Handles query parameters.
- Receives validated request bodies.
- Calls the appropriate service.
- Returns appropriate HTTP responses.

### Service Layer

- Implements business logic.
- Validates business rules.
- Coordinates different modules.
- Manages database transactions.
- Handles reservations, payments, check-in, check-out, and related workflows.

### Repository Layer

- Uses TypeORM repositories.
- Handles database operations.
- Retrieves, creates, updates, and deletes database records.
- Manages entity relationships.

### Database Layer

- Stores persistent application data in MySQL.
- Enforces appropriate database constraints.
- Maintains relational integrity.

Keep business logic out of controllers.

Use NestJS dependency injection properly.

Use modules to organize functionality.

Avoid circular dependencies wherever possible.

---

## 9. Database Design

Create a MySQL database named:

`maristay_db`

Preserve the following eight original database entities from Laboratory Activity 04.

### Table 1: guests

Purpose: Stores registered hotel guest information and authentication details.

Fields:

- guestId — INT, primary key, auto increment
- firstName — VARCHAR(50), required
- lastName — VARCHAR(50), required
- email — VARCHAR(100), unique, required
- passwordHash — VARCHAR(255), required
- phoneNumber — VARCHAR(20), required

Proposed additional field:

- accountStatus — ACTIVE or INACTIVE

Never expose passwordHash in API responses.

### Table 2: rooms

Purpose: Stores hotel room information, pricing, and availability.

Fields:

- roomId — INT, primary key, auto increment
- roomNo — VARCHAR(10), unique, required
- roomType — VARCHAR(50), required
- pricePerNight — DECIMAL(10,2), required, nonnegative
- roomStatus — VARCHAR(20), required

Room statuses:

- AVAILABLE
- OCCUPIED
- CLEANING
- MAINTENANCE

Suggested sample room types:

- Standard
- Deluxe
- Suite
- Family

Use the field name roomNo consistently. Where the laboratory API examples use roomNumber, document the naming difference and use one consistent API contract.

### Table 3: reservations

Purpose: Stores guest room reservations and check-in/check-out schedules.

Fields:

- reservationId — INT, primary key, auto increment
- guestId — INT, foreign key referencing guests.guestId
- roomId — INT, foreign key referencing rooms.roomId
- checkInDate — DATE, required
- checkOutDate — DATE, required
- reservationStatus — VARCHAR(20), required

Reservation statuses:

- PENDING
- CONFIRMED
- CHECKED_IN
- CHECKED_OUT
- CANCELLED

Consider adding a quoted booking total or rate snapshot to prevent later room price changes from altering historical reservations. Clearly document this as an extension of the original schema.

### Table 4: payments

Purpose: Records payments associated with reservations.

Fields:

- paymentId — INT, primary key, auto increment
- reservationId — INT, foreign key referencing reservations.reservationId
- amount — DECIMAL(10,2), nonnegative, required
- paymentMethod — VARCHAR(30), required
- status — VARCHAR(20), required
- date — DATETIME, nullable when payment has not yet been processed

Payment methods:

- CASH
- CARD
- E_WALLET

Payment statuses:

- PENDING
- PAID
- FAILED
- REFUNDED

This is a payment recording and verification prototype.

Do not collect real card information or process real financial transactions.

### Table 5: digital_keys

Purpose: Stores digital room access credentials issued to checked-in guests.

Fields:

- keyId — INT, primary key, auto increment
- reservationId — INT, foreign key referencing reservations.reservationId
- keyCodeHash — VARCHAR(255), unique, required
- issuedAt — DATETIME, required
- expiresAt — DATETIME, required
- status — VARCHAR(20), required

Digital key statuses:

- ACTIVE
- EXPIRED
- REVOKED

Generate secure random digital access credentials.

Store only secure hashes of digital key credentials.

Return the original credential only when issuing or securely reissuing the key.

Do not expose keyCodeHash in API responses.

Physical smart lock integration must be simulated for this academic prototype.

### Table 6: housekeeping

Purpose: Tracks hotel room cleaning tasks and assigned housekeeping employees.

Fields:

- hkId — INT, primary key, auto increment
- roomId — INT, foreign key referencing rooms.roomId
- staffId — INT, foreign key referencing staff.staffId
- status — VARCHAR(20), required
- lastUpdate — DATETIME, required

Housekeeping statuses:

- PENDING
- IN_PROGRESS
- COMPLETED

### Table 7: staff

Purpose: Stores hotel employee information and assigned roles.

Fields:

- staffId — INT, primary key, auto increment
- firstName — VARCHAR(50), required
- lastName — VARCHAR(50), required
- role — VARCHAR(20), required
- email — VARCHAR(100), unique, required

Staff roles:

- FRONT_DESK
- HOUSEKEEPING
- MANAGER

Necessary additional fields for staff authentication:

- passwordHash — VARCHAR(255), required
- accountStatus — ACTIVE or INACTIVE

The additional authentication fields are required because the original Laboratory Activity 04 staff table does not contain complete login credentials.

Do not create a redundant users table unless there is a compelling architectural reason. Authenticate guests and staff using their respective entities through a unified authentication service.

Prevent ambiguous identities by enforcing email uniqueness across guest and staff accounts through a consistent identity-management approach.

### Table 8: service_orders

Purpose: Records guest requests for food, amenities, and other hotel services.

Fields:

- orderId — INT, primary key, auto increment
- reservationId — INT, foreign key referencing reservations.reservationId
- serviceType — VARCHAR(50), required
- totalAmount — DECIMAL(10,2), nonnegative, required
- status — VARCHAR(20), required
- date — DATETIME, required

Service order statuses:

- PENDING
- PREPARING
- DELIVERED
- CANCELLED

Recommended service types:

- Food
- Beverage
- Amenities
- Laundry
- Other hotel services

If additional fields or service catalog tables are necessary, document them as proposed extensions. Preserve all eight original entities.

Use consistent naming conventions and appropriate database indexes.

Use migrations for reproducible database setup. If schema synchronization is temporarily used during local development, disable it outside that environment.

Avoid unsafe cascading deletion of historical reservations and payment records.

---

## 10. Database Relationships

Implement the following TypeORM relationships:

- One Guest has many Reservations.
- Many Reservations belong to one Guest.
- One Room has many Reservations.
- Many Reservations belong to one Room.
- One Reservation has many Payments.
- One Reservation has many Digital Keys.
- One Reservation has many Service Orders.
- One Room has many Housekeeping records.
- One Staff member has many Housekeeping records.

Use appropriate TypeORM decorators:

- @Entity()
- @PrimaryGeneratedColumn()
- @Column()
- @OneToMany()
- @ManyToOne()
- @JoinColumn()
- @Index()

Ensure relationships are reflected correctly in the actual MySQL schema.

Generate an ERD that matches the implemented entities.

Use database constraints, validation, and transactional business logic to maintain data integrity.

---

## 11. Required Backend Modules

Create the following NestJS modules:

1. AuthModule
2. GuestsModule
3. RoomsModule
4. ReservationsModule
5. PaymentsModule
6. DigitalKeysModule
7. HousekeepingModule
8. StaffModule
9. ServiceOrdersModule

Also create:

- Common security and validation utilities.
- Database configuration and migration files.
- Seed scripts.
- Simulated notification service where needed.

Each functional module should contain:

- Module file
- Controller file
- Service file
- Entity file
- Create DTO
- Update DTO
- Additional DTOs when needed
- Tests where appropriate

Do not create empty or nonfunctional placeholder modules.

---

## 12. REST API Design

Use the following global API prefix:

`/api/v1`

Use plural resource names, REST-oriented URLs, path parameters, query parameters, JSON requests and responses, and appropriate HTTP methods.

### Authentication Endpoints

- POST `/api/v1/auth/login` — Login guest or staff
- GET `/api/v1/auth/me` — Retrieve authenticated user profile

### Guest Endpoints

- POST `/api/v1/guests` — Public guest registration
- GET `/api/v1/guests` — List guests
- GET `/api/v1/guests/:id` — Retrieve guest profile
- PATCH `/api/v1/guests/:id` — Update guest profile
- DELETE `/api/v1/guests/:id` — Deactivate or remove eligible guest account

Guest registration must require a password.

Never allow public registration to assign staff or manager roles.

### Room Endpoints

- GET `/api/v1/rooms` — Public room listing and filtering
- GET `/api/v1/rooms/:id` — View room details
- POST `/api/v1/rooms` — Create room
- PATCH `/api/v1/rooms/:id` — Partially update room
- PUT `/api/v1/rooms/:id` — Replace mutable room details
- DELETE `/api/v1/rooms/:id` — Delete eligible room

Support query parameters such as:

- roomStatus
- roomType
- minPrice
- maxPrice
- checkInDate
- checkOutDate
- page
- limit

Required example from Laboratory Activity 05:

GET `/api/v1/rooms?roomStatus=Available`

Support documented case normalization for status filters.

### Reservation Endpoints

- POST `/api/v1/reservations` — Book room
- GET `/api/v1/reservations` — List authorized reservations
- GET `/api/v1/reservations/:id` — View reservation
- PATCH `/api/v1/reservations/:id` — Update eligible reservation
- PATCH `/api/v1/reservations/:id/check-in` — Perform check-in
- PATCH `/api/v1/reservations/:id/check-out` — Perform check-out
- DELETE `/api/v1/reservations/:id` — Cancel eligible reservation
- GET `/api/v1/guests/:id/reservations` — Retrieve guest reservation history

Document that reservation deletion performs cancellation instead of destroying historical records.

### Payment Endpoints

- POST `/api/v1/payments` — Record payment
- GET `/api/v1/payments` — List authorized payments
- GET `/api/v1/payments/:id` — View payment
- PATCH `/api/v1/payments/:id` — Update payment status

### Digital Key Endpoints

- POST `/api/v1/digital-keys` — Issue or reissue digital room key
- GET `/api/v1/digital-keys/:id` — View authorized key metadata
- POST `/api/v1/digital-keys/validate` — Validate digital access credential
- PATCH `/api/v1/digital-keys/:id/revoke` — Revoke digital key

### Housekeeping Endpoints

- POST `/api/v1/housekeeping` — Assign cleaning task
- GET `/api/v1/housekeeping` — View authorized cleaning tasks
- GET `/api/v1/housekeeping/:id` — View task details
- PATCH `/api/v1/housekeeping/:id` — Update cleaning task status

### Staff Endpoints

- POST `/api/v1/staff` — Create staff account
- GET `/api/v1/staff` — List staff
- GET `/api/v1/staff/:id` — View staff details
- PATCH `/api/v1/staff/:id` — Update staff account
- DELETE `/api/v1/staff/:id` — Deactivate eligible staff account

### Service Order Endpoints

- POST `/api/v1/service-orders` — Place service order
- GET `/api/v1/service-orders` — List authorized service orders
- GET `/api/v1/service-orders/:id` — View service order
- PATCH `/api/v1/service-orders/:id` — Update service order status

The above is a proposed target of 42 meaningful endpoints, including the seven endpoints already specified in Laboratory Activity 05.

All implemented endpoints must be genuinely functional and connected to MySQL.

Do not create dummy endpoints merely to satisfy the required count.

At minimum, Room Management and another suitable functional module must support complete CRUD functionality.

---

## 13. Preserve Original Laboratory Activity 05 Endpoints

The following seven endpoints are explicitly defined in my original laboratory activity and must be preserved:

1. GET `/api/v1/rooms` — View rooms — Public
2. POST `/api/v1/guests` — Register guest — Public
3. POST `/api/v1/reservations` — Book room — Guest
4. POST `/api/v1/payments` — Record payment — Front Desk
5. POST `/api/v1/service-orders` — Place service order — Guest
6. PATCH `/api/v1/rooms/:id` — Update room — Manager
7. PUT `/api/v1/rooms/:id` — Replace room details — Manager

Additional access for authorized managers or staff may be implemented where necessary, but do not remove the original access permissions.

Use appropriate response codes:

- 200 OK
- 201 Created
- 204 No Content
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict
- 429 Too Many Requests
- 500 Internal Server Error

Do not return HTTP 200 for failed requests.

Use consistent error responses that do not expose internal database errors or sensitive information.

---

## 14. Authentication and Security

Implement the security design specified in Laboratory Activity 06.

### Authentication Flow

1. User submits email and password.
2. Backend receives the login request.
3. Authentication service searches the appropriate account.
4. Verify the submitted password against the stored password hash.
5. Verify account status.
6. If valid, generate a signed JWT access token.
7. JWT contains a user identifier, account type, and role.
8. Client includes the JWT in the Authorization header.
9. Protected routes validate the token.
10. Backend checks role permissions and resource ownership.
11. Authorized requests receive the requested response.
12. Invalid credentials or tokens return 401 Unauthorized.
13. Valid tokens with insufficient permission return 403 Forbidden.

Use:

`Authorization: Bearer <access_token>`

### Security Requirements

- Hash passwords using bcrypt.
- Never store plaintext passwords.
- Never expose password hashes.
- Never expose digital key hashes.
- Implement JWT expiration.
- Store JWT secrets in environment variables.
- Implement JWT authentication guards.
- Implement role-based authorization guards.
- Implement ownership validation.
- Prevent mass assignment.
- Apply global DTO validation.
- Reject unknown input properties where appropriate.
- Validate email addresses.
- Validate identifiers.
- Validate date formats and date ranges.
- Validate monetary amounts.
- Implement login rate limiting.
- Configure Helmet security headers.
- Configure restricted CORS when needed.
- Use TypeORM parameterized queries.
- Prevent SQL injection.
- Return safe error messages.
- Verify inactive accounts cannot access protected routes.
- Avoid logging passwords, access tokens, and digital access credentials.

Use HTTPS for deployment.

Local HTTP is acceptable for a local academic demonstration, but clearly document the difference. Do not claim HTTPS is implemented unless it is actually configured and tested.

---

## 15. Integrated Business Logic

The most important part of MariStay is the integration of different hotel operations.

Implement the following complete business workflow.

### Step 1 — Guest Registration

- Validate the registration details.
- Check for an existing email.
- Hash the password.
- Save the guest in MySQL.
- Return the guest information without the password hash.

### Step 2 — Guest Login

- Verify email and password.
- Check account status.
- Generate JWT.
- Return access token and safe user information.

### Step 3 — Room Selection

- Guest views hotel rooms.
- Guest filters rooms by type, price, status, or booking dates.
- Backend checks reservation availability for the requested date range.

Do not rely exclusively on the roomStatus field for future reservation availability.

### Step 4 — Room Reservation

- Validate guest identity.
- Validate room existence.
- Validate check-in and check-out dates.
- Check that check-out is later than check-in.
- Reject overlapping active reservations for the same room.
- Prevent concurrent double bookings using appropriate transactions and locking.
- Calculate the expected booking amount based on room price and number of nights.
- Create a PENDING reservation.

Use half-open booking date ranges so a guest can check out on the same date another guest checks in.

Do not permanently mark a room occupied merely because it has a future reservation.

### Step 5 — Payment Recording

- Front desk records a payment.
- Verify reservation existence.
- Verify payment amount and payment method.
- Track paid, pending, failed, and refunded payments.
- Determine whether the reservation has been sufficiently paid.
- Confirm eligible reservations when applicable.

Do not allow failed or refunded payments to count as successful payments.

Use transactional logic where multiple records must change together.

### Step 6 — Digital Check-in

Before checking in, verify:

- Reservation exists.
- Requesting guest owns the reservation, or staff is authorized.
- Reservation is confirmed and eligible.
- Check-in date is valid under the hotel's documented policy.
- Required payment has been satisfied.
- Room is ready and AVAILABLE.
- Reservation is not cancelled or already checked out.

When successful:

- Update reservationStatus to CHECKED_IN.
- Update roomStatus to OCCUPIED.
- Generate a secure digital access credential.
- Store only the credential hash.
- Set issuedAt and expiresAt.
- Set key status to ACTIVE.
- Trigger a simulated notification event.
- Return a successful check-in response.

Perform related database changes within a transaction.

### Step 7 — Digital Room Access

- Verify the submitted digital key.
- Verify key expiration.
- Verify reservation status.
- Verify authorization.
- Reject invalid, expired, or revoked keys.
- Return simulated room access approval when valid.

This functionality is a backend simulation of smart lock integration.

Do not claim that it physically opens a hotel room.

### Step 8 — Service Ordering

- Allow authorized guests to place hotel service requests.
- Verify that the reservation belongs to the guest.
- Verify the guest is checked in.
- Record the service type and order details.
- Calculate or validate the order amount using documented server-side pricing rules.
- Save the service order with PENDING status.
- Allow authorized staff to update status.

Do not trust arbitrary client-provided prices.

### Step 9 — Digital Check-out

Before check-out:

- Verify reservation ownership or staff authorization.
- Verify current reservation status.
- Verify any outstanding charges according to documented prototype rules.

When successful:

- Update reservationStatus to CHECKED_OUT.
- Revoke active digital keys.
- Update roomStatus to CLEANING.
- Create or queue a housekeeping task using an available housekeeping employee or a documented assignment workflow.
- Return a successful check-out response.

Use a transaction to maintain consistency.

### Step 10 — Housekeeping

- Manager assigns a cleaning task when necessary.
- Housekeeping employee views assigned tasks.
- Employee updates task status to IN_PROGRESS.
- Employee marks the task as COMPLETED.
- Backend updates roomStatus to AVAILABLE when the room is eligible for release.

Prevent unauthorized employees from modifying another employee's assigned tasks.

Prevent invalid status transitions.

---

## 16. External Service Integration

Laboratory Activity 03 identifies external services such as:

- Payment gateways
- SMS notifications
- Email notifications
- Smart locks

For this academic backend prototype:

- Simulate payment recording without real money transactions.
- Simulate SMS and email notification delivery.
- Simulate digital key validation and smart lock access.

Use a simple notification service or integration adapter.

Clearly separate simulated integrations from actual database-backed functionality.

Do not require paid API subscriptions or real external credentials.

Document the integration points so actual providers can be connected in the future.

---

## 17. Project Folder Structure

Use a clean project structure similar to:

```text
MariStay/
├── src/
│   ├── auth/
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── strategies/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── guests/
│   ├── rooms/
│   ├── reservations/
│   ├── payments/
│   ├── digital-keys/
│   ├── housekeeping/
│   ├── staff/
│   ├── service-orders/
│   ├── notifications/
│   ├── common/
│   │   ├── decorators/
│   │   ├── guards/
│   │   ├── enums/
│   │   ├── filters/
│   │   └── utilities/
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeds/
│   │   └── data-source.ts
│   ├── app.module.ts
│   └── main.ts
├── test/
├── exports/
│   ├── maristay.sql
│   ├── MariStay.postman_collection.json
│   └── MariStay.postman_environment.json
├── docs/
│   ├── PROJECT_REQUIREMENTS.md
│   ├── DEVELOPMENT_PROGRESS.md
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── DATABASE_DESIGN.md
│   ├── API_DOCUMENTATION.md
│   ├── AUTHENTICATION_SECURITY.md
│   ├── TESTING_REPORT.md
│   ├── FINAL_DOCUMENTATION.md
│   ├── PRESENTATION_GUIDE.md
│   ├── VIDEO_DEMO_SCRIPT.md
│   └── DEFENSE_QUESTIONS.md
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

Adapt this structure as necessary without sacrificing modularity or readability.

Do not unnecessarily overengineer the project.

---

## 18. Environment Variables

Create an `.env.example` containing safe placeholder values:

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=maristay_db

JWT_SECRET=replace_with_a_secure_random_secret
JWT_EXPIRES_IN=1h

CORS_ORIGIN=http://localhost:5173
```

Validate required environment variables during application startup.

Never commit the actual `.env` file.

Never use insecure JWT fallback secrets.

Create `.env` locally only when appropriate, and preserve any existing configuration.

Do not assume that the local MySQL root password is empty.

If database credentials are required, clearly explain the exact configuration the user needs to provide.

Never expose credentials in terminal output, documentation, screenshots, or exported collections.

---

## 19. Database Seed Data

Create a reproducible seed script for demonstration purposes.

Include:

- One manager account.
- At least one front desk account.
- At least two housekeeping accounts.
- At least two guest accounts.
- At least eight sample hotel rooms.
- Sample reservations where appropriate.
- Sample housekeeping records.
- Sample service orders where appropriate.

Use fictional demonstration data.

Use a configurable local demo password, hash it before database insertion, and never embed real personal credentials.

Ensure seed scripts can be safely rerun without creating unnecessary duplicate records.

Do not delete existing database data when seeding.

Provide clear instructions for running migrations and seeds.

---

## 20. API Documentation and Swagger

Configure Swagger/OpenAPI documentation for easier testing and defense.

Suggested documentation URL:

`http://localhost:3000/api/docs`

Include:

- Endpoint descriptions.
- Request DTOs.
- Response examples.
- Path parameters.
- Query parameters.
- HTTP status codes.
- Authentication requirements.
- Bearer token authentication.
- Module categorization.

Swagger is supplementary.

It does not replace the mandatory Postman Collection or the REST API section of the final PDF documentation.

---

## 21. API Testing Requirements

Create a complete Postman Collection organized into folders:

1. Authentication
2. Guests
3. Rooms
4. Reservations
5. Payments
6. Digital Keys
7. Housekeeping
8. Staff
9. Service Orders
10. Integrated Workflow
11. Security and Negative Testing

Create a Postman environment with variables such as:

- baseUrl
- guestToken
- managerToken
- frontDeskToken
- housekeepingToken
- guestId
- roomId
- reservationId
- paymentId
- keyId
- hkId
- staffId
- orderId

Use Postman scripts to capture generated tokens and identifiers where appropriate.

Do not include real passwords, active JWTs, or sensitive credentials in committed exports.

Test every implemented endpoint.

Test at least the following scenarios:

- Successful guest registration.
- Duplicate email registration.
- Valid login.
- Invalid login credentials.
- Protected route without a token.
- Protected route with an invalid token.
- Guest attempting manager-only operations.
- Guest accessing another guest's reservation.
- Valid room creation.
- Invalid room creation.
- Room retrieval.
- Room update.
- Room deletion for an eligible test room.
- Invalid reservation dates.
- Successful room reservation.
- Overlapping reservation rejection.
- Concurrent conflicting reservation attempts.
- Successful payment recording.
- Invalid payment information.
- Check-in without sufficient payment.
- Check-in with a room not ready.
- Successful digital check-in.
- Digital key generation.
- Invalid digital key validation.
- Expired digital key rejection.
- Revoked digital key rejection.
- Successful service order.
- Unauthorized service order.
- Successful check-out.
- Housekeeping assignment.
- Housekeeping status update.
- Room availability restoration.

Create automated tests with Jest or Supertest for critical functionality, especially authentication, reservation conflicts, authorization, and the integrated guest workflow.

Run available tests and builds.

Never fabricate successful test results.

If MySQL or another necessary service is unavailable, report exactly which tests could not be executed and provide instructions for completing them.

---

## 22. Git and GitHub Requirements

Initialize Git if the project is not already a repository.

Preserve existing Git history.

Create a meaningful incremental commit history with at least five commits.

Recommended commits:

1. `chore: initialize MariStay NestJS backend`
2. `feat: configure MySQL and TypeORM database entities`
3. `feat: implement JWT authentication and role authorization`
4. `feat: implement guest room and reservation management`
5. `feat: integrate payments and digital check-in checkout`
6. `feat: implement digital keys housekeeping and service orders`
7. `test: add API collections integration tests and validation`
8. `docs: finalize project documentation and setup guide`

Commit only completed milestones.

Do not manufacture commit history after development simply to satisfy the requirement.

Do not force-push, delete branches, overwrite unrelated files, or publish code without authorization.

Create a `.gitignore` that excludes:

- node_modules/
- dist/
- coverage/
- .env
- Local environment files
- Log files
- Editor-specific temporary files
- Temporary exports containing credentials

Keep `.env.example` tracked.

Prepare the repository for submission under my personal GitHub account.

The repository must be public or private with the instructor added as a collaborator.

Do not create or publish a remote repository without my authorization.

---

## 23. README.md Requirements

Create a complete but concise README.md containing:

- Project title.
- Project description.
- System features.
- Technology stack.
- Prerequisites.
- Installation instructions.
- MySQL database setup.
- Environment variable configuration.
- Migration instructions.
- Seed instructions.
- Application startup instructions.
- API documentation URL.
- Postman Collection instructions.
- Testing commands.
- Database export instructions.
- Demo account setup.
- Project structure.
- Simulated integration limitations.

Include relevant commands such as:

```bash
npm install
npm run build
npm run start:dev
npm run test
npm run test:e2e
```

Ensure all additional commands documented in the README actually exist in package.json.

---

## 24. SQL Database Export

Create an export named:

`exports/maristay.sql`

The SQL export must include:

- Database schema.
- All original eight tables.
- Primary keys.
- Foreign keys.
- Appropriate indexes.
- Constraints.
- Safe demonstration records where appropriate.

Use the actual implemented MySQL schema.

Provide instructions for importing the SQL file using MySQL or phpMyAdmin.

Prefer an actual database export using mysqldump or a supported MySQL export utility.

If an actual database connection is unavailable, produce a clearly identified schema setup script instead and do not misrepresent it as a verified live database export.

---

## 25. Final Technical Documentation

Prepare complete technical documentation that matches the actual implemented system.

The final documentation must contain:

### Cover Page

- Complete system title.
- Student name.
- Section.
- Course.
- Instructor.
- GitHub repository link.
- Video demonstration link.

Use clearly marked placeholders for links that do not yet exist.

### Table of Contents

### Chapter 1 — Project Overview

- Introduction.
- System description.
- Background.
- Objectives.
- Intended users.
- Scope and limitations.

### Chapter 2 — System Analysis

- Existing problems.
- Functional requirements.
- Nonfunctional requirements.
- User roles.
- Business processes.

### Chapter 3 — System Architecture

- Architecture diagram.
- System components.
- Layered architecture.
- Module integration.
- Request and response flow.
- External service integration.

### Chapter 4 — Database Design

- Entity relationship diagram.
- Database tables.
- Data dictionary.
- Primary keys and foreign keys.
- Relationships.
- Normalization.
- Database constraints.

### Chapter 5 — REST API Design

- API conventions.
- Resource identification.
- Complete endpoint table.
- Request body examples.
- Response body examples.
- Status codes.
- Authorization requirements.

### Chapter 6 — Authentication and Security

- Login flow diagram.
- JWT authentication.
- Password hashing.
- Protected routes.
- Role-based access control.
- Ownership verification.
- Input validation.
- Rate limiting.
- Credential protection.

### Chapter 7 — Backend Implementation

- NestJS modules.
- Controller layer.
- Service layer.
- TypeORM repository layer.
- Entity implementation.
- Database connection.
- Important business logic.
- Relevant code excerpts with explanations.

### Chapter 8 — API Testing and Validation

- Postman testing approach.
- Test cases.
- Expected results.
- Actual results.
- Representative screenshots.
- Error handling.
- Authentication and authorization tests.
- Integrated workflow testing.

### Chapter 9 — Conclusion

- Project accomplishments.
- Challenges encountered.
- Lessons learned.
- Current limitations.
- Future improvements.

### References

Include actual references used during development.

Do not invent citations or documentation references.

### Appendix

Include additional diagrams, test results, or setup instructions where necessary.

Generate Mermaid diagrams or equivalent editable diagram source for:

- System architecture.
- ERD.
- Authentication flow.
- Reservation workflow.
- Check-in/check-out workflow.
- Module integration.

Create a final documentation source file and a PDF if the necessary document generation tools are available.

Do not fabricate screenshots, test results, GitHub links, or video links.

Clearly identify items that require manual completion.

---

## 26. Presentation Preparation

Prepare a 10–15 minute presentation outline with approximately 10–12 slides.

Suggested slides:

1. Title slide
2. Project overview
3. Problems and objectives
4. System features and intended users
5. System architecture
6. Database design and ERD
7. REST API design
8. Authentication and security
9. Backend implementation
10. Postman demonstration
11. System integration workflow
12. Conclusion and future improvements

Provide concise speaker notes written in simple, understandable English suitable for a college student.

Generate a presentation file if appropriate tools are available. Otherwise, provide a complete slide-ready outline.

Prepare at least 20 possible defense questions and answers covering:

- NestJS.
- TypeORM.
- MySQL.
- Controllers.
- Services.
- Repositories.
- Entities.
- REST API.
- HTTP methods.
- DTOs.
- JWT.
- Password hashing.
- Authentication and authorization.
- Database relationships.
- Primary and foreign keys.
- Reservation conflict prevention.
- Database transactions.
- Protected routes.
- Role-based access control.
- System integration.

Make explanations specific to the actual MariStay implementation.

---

## 27. Video Demonstration Requirements

Prepare a script for a 5–10 minute screen-recorded demonstration.

The video must follow the exact order required by the instructor.

### Part 1 — Start the Backend

Run:

```bash
npm run start:dev
```

Show that the backend starts without errors.

### Part 2 — Login

Use Postman to log in.

Show that a valid JWT access token is returned.

### Part 3 — Full CRUD Demonstration

Use the Room Management module to demonstrate:

- Create a new room.
- Retrieve the room.
- Update the room.
- Delete the room.

Use a dedicated test room without historical reservation records.

### Part 4 — Explain the Data Flow

Open the actual source code and explain:

Postman → Controller → Service → TypeORM Repository → MySQL → Service → Controller → Postman Response.

Trace one real request through the actual controller, service, entity, and repository implementation.

### Part 5 — Protected Route Testing

Remove the JWT token.

Send a protected request.

Show that the backend returns 401 Unauthorized.

Optionally demonstrate a 403 Forbidden response using a valid guest token on a manager-only route.

### Part 6 — Database Verification

Open MySQL or phpMyAdmin.

Show that the data matches the operations performed in Postman.

The final video must contain my own spoken narration.

Generate the script and checklist, but do not claim that the video has already been recorded or uploaded.

---

## 28. Optional React Frontend

Only begin frontend development after all mandatory backend requirements have been completed and tested.

If sufficient time remains, create a functional responsive React frontend using:

- React
- Vite
- TypeScript
- Tailwind CSS or another simple styling solution
- React Router
- Axios or Fetch API

Use a modern, premium hotel management interface.

### Suggested Visual Design

- Clean, modern, professional hotel-themed dashboard.
- Navy blue, white, beige, and subtle gold accents.
- Minimalist layout.
- Responsive desktop and mobile design.
- Consistent typography and spacing.
- Clear tables, status labels, forms, and cards.
- Accessible contrast and form labels.

### Guest Pages

- Landing page.
- Login page.
- Registration page.
- Guest dashboard.
- Room listing.
- Room details.
- Reservation booking.
- My reservations.
- Payment history.
- Digital check-in/check-out.
- Digital room key.
- Service ordering.

### Front Desk Pages

- Dashboard.
- Guest management.
- Reservation management.
- Payment recording.
- Check-in and check-out management.

### Housekeeping Pages

- Assigned tasks.
- Cleaning status updates.
- Room readiness.

### Manager Pages

- Dashboard.
- Room management.
- Staff management.
- Reservation monitoring.
- Payment monitoring.
- Housekeeping assignments.
- Service order management.

Every implemented frontend feature must connect to the actual NestJS APIs.

Do not use hardcoded dashboard data and pretend it comes from the database.

Provide loading states, error states, success messages, and form validation.

Frontend development is optional bonus work and must never delay completion of the required backend.

---

## 29. Development Execution Plan

Follow these phases in order.

### Phase 1 — Project Initialization

Target: 30 minutes.

- Inspect the existing workspace.
- Identify existing files and dependencies.
- Check Node.js, npm, Git, and MySQL availability.
- Initialize NestJS if necessary.
- Install dependencies.
- Configure environment variables.
- Initialize Git.
- Create project requirement and progress files.
- Confirm the application builds.

### Phase 2 — Database Implementation

Target: 60–90 minutes.

- Configure MySQL.
- Implement all eight original database entities.
- Implement relationships.
- Configure migrations.
- Implement database constraints.
- Create seed scripts.
- Verify database connectivity.

### Phase 3 — Authentication and Security

Target: 60 minutes.

- Implement guest registration.
- Implement staff authentication.
- Implement login.
- Implement password hashing.
- Implement JWT.
- Implement role authorization.
- Implement ownership checks.
- Configure validation and rate limiting.
- Test authentication.

### Phase 4 — Core Functional Modules

Target: 120–150 minutes.

- Implement GuestsModule.
- Implement RoomsModule.
- Implement ReservationsModule.
- Implement PaymentsModule.
- Implement booking conflict prevention.
- Implement payment verification.
- Test core REST endpoints.

### Phase 5 — Integrated Hotel Services

Target: 90–120 minutes.

- Implement digital check-in.
- Implement digital check-out.
- Implement digital keys.
- Implement housekeeping.
- Implement staff management.
- Implement service orders.
- Implement simulated notifications.
- Test end-to-end integration.

### Phase 6 — Testing and Debugging

Target: 90–120 minutes.

- Run application build.
- Execute available automated tests.
- Test every REST endpoint.
- Test authorization.
- Test error handling.
- Test complete guest workflow.
- Fix discovered bugs.
- Generate Postman Collection.
- Export database.

### Phase 7 — Documentation

Target: 90–120 minutes.

- Finalize README.
- Complete technical documentation.
- Generate architecture diagrams.
- Generate ERD.
- Document all endpoints.
- Record actual testing results.
- Prepare PDF documentation if possible.

### Phase 8 — Presentation Preparation

Target: 60–90 minutes.

- Create presentation outline or slides.
- Prepare demonstration script.
- Prepare defense questions.
- Review submission checklist.
- Verify final project requirements.

These are planning targets, not guaranteed completion times.

If development takes longer than expected, prioritize the mandatory academic requirements and defer optional frontend development.

---

## 30. Development Rules

Follow these rules throughout implementation:

1. Do not simply explain how to build the project. Build the actual project.
2. Inspect existing files before modifying them.
3. Preserve existing functional work.
4. Do not repeatedly ask for approval for routine, non-destructive development steps.
5. Ask for assistance only when genuinely blocked by missing credentials, unavailable tools, permission restrictions, destructive operations, or important unresolved decisions.
6. Use readable and maintainable TypeScript.
7. Avoid unnecessary abstractions and complicated design patterns.
8. Use meaningful file names, class names, variable names, and method names.
9. Use comments to explain important business logic.
10. Do not add excessive comments for obvious code.
11. Never leave critical functionality as TODO comments.
12. Never use mock data as a replacement for required MySQL functionality.
13. Never invent successful testing results.
14. Do not disable authentication or security just to make tests pass.
15. Do not introduce incompatible dependencies.
16. Build and test after each major implementation phase.
17. Fix compilation errors before continuing.
18. Maintain documentation consistency with the implementation.
19. Do not execute destructive database operations against existing data.
20. Do not expose secrets or credentials.
21. Do not push to GitHub or publish resources without permission.
22. Clearly identify simulated external integrations.
23. Prioritize backend functionality over UI appearance.
24. Keep the system understandable enough for me to explain during my defense.
25. Explain important architectural and implementation decisions in simple language.
26. Continue through development phases when tools and permissions allow, rather than stopping after merely presenting a plan.

---

## 31. Persistent Development Progress Tracker

Create:

`docs/DEVELOPMENT_PROGRESS.md`

Maintain this file throughout development.

It must contain:

- Current development phase.
- Completed tasks.
- Pending tasks.
- Implemented endpoints.
- Tested endpoints.
- Files created or modified.
- Database implementation status.
- Authentication status.
- Current errors.
- Resolved errors.
- Architectural decisions.
- Deviations from the original laboratory designs.
- Git commit history.
- Remaining mandatory requirements.
- Next recommended action.

Update this file after every major development phase.

If the conversation reaches a context limit or a new coding session is required, this file must contain sufficient information for another session to continue development without starting over.

Also create:

`docs/PROJECT_REQUIREMENTS.md`

Store the finalized system requirements, database design, API scope, business rules, and academic requirements in this file.

Treat these two files as persistent project references.

---

## 32. Definition of Done

The mandatory backend is considered complete only when:

- NestJS builds successfully.
- NestJS starts successfully.
- MySQL database connection works.
- All eight original entities are implemented.
- Database relationships are functional.
- At least two complete CRUD modules are available.
- At least 20 meaningful REST endpoints work.
- JWT login works.
- Protected routes reject unauthorized requests.
- Role permissions are enforced.
- Resource ownership is enforced.
- Passwords are securely hashed.
- Input validation works.
- Reservation conflicts are prevented.
- Payment recording works.
- Digital check-in works.
- Digital check-out works.
- Digital key validation works as a simulation.
- Housekeeping integration works.
- Service ordering works.
- Postman Collection is complete.
- Actual test results are documented.
- SQL database export is generated.
- README is complete.
- At least five meaningful Git commits exist.
- No real credentials are committed.
- Technical documentation is consistent with actual code.
- Presentation materials are prepared.
- Video demonstration script is prepared.

The project must remain marked as partially complete if required functionality has not been verified.

---

## 33. Final Deliverables

Prepare the following final submission materials:

1. Complete MariStay backend source code.
2. GitHub-ready repository.
3. `maristay.sql`
4. `MariStay.postman_collection.json`
5. `MariStay.postman_environment.json`
6. Complete final technical documentation in PDF format, if supported.
7. Editable documentation source.
8. System architecture diagram.
9. Database ERD.
10. Authentication flow diagram.
11. REST API documentation.
12. Presentation slides or complete slide-ready outline.
13. Video demonstration script.
14. Defense questions and answers.
15. Actual testing report.
16. README.md.
17. Optional React frontend if time permits.

The instructor's official submission requirements are the PDF documentation, repository link or source code, SQL export, Postman Collection, and shareable narrated video link.

Do not claim the external submission, video recording, GitHub publication, or live presentation has been completed when it still requires my action.

---

## 34. Final Instruction

Begin implementation now.

First, inspect my current workspace and development environment.

Then:

1. Analyze the available reference documents.
2. Create PROJECT_REQUIREMENTS.md.
3. Create DEVELOPMENT_PROGRESS.md.
4. Identify existing project files and dependencies.
5. Initialize or continue the NestJS project.
6. Configure MySQL and TypeORM.
7. Implement the eight original entities.
8. Implement authentication and authorization.
9. Implement all required functional modules.
10. Integrate the hotel management business workflows.
11. Build and test the application.
12. Prepare all mandatory deliverables.
13. Implement the optional frontend only if the mandatory backend is complete.

Do not stop after giving me an implementation plan.

Execute the implementation directly inside my workspace using your available file-editing and terminal tools.

When a phase is completed, provide a concise progress summary, update the progress tracker, and continue to the next phase when possible.

If a genuine blocker occurs, explain the blocker, provide the exact action needed from me, and continue any independent work that is not blocked.

The ultimate goal is a complete, functional, secure, well-documented, and defense-ready MariStay: Hotel Management and Digital Guest Services System that fulfills the requirements of ITEC 116 and remains consistent with Laboratory Activities 03–06.

Start with Phase 1 immediately.