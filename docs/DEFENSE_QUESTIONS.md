# Defense Questions and Answers

Answers are specific to MariStay. File references point to the real code, so you can open it if asked.

### NestJS and architecture

**1. Why did you use NestJS instead of plain Express?**
NestJS runs on Express but adds structure: modules, dependency injection, guards, pipes and decorators. That gave me one consistent pattern for nine modules, global security guards and automatic validation. Building the same thing by hand in Express would mean writing all that plumbing myself.

**2. What is a module in your project? Give an example.**
A module groups one business area. `RoomsModule` declares `RoomsController`, provides `RoomsService`, and registers the repositories it needs with `TypeOrmModule.forFeature([Room, Reservation, Housekeeping])`. `AppModule` imports all nine feature modules.

**3. What is the difference between a controller and a service?**
The controller handles HTTP: route, parameters, validated body, and status code. The service holds the business logic and database work. For example, `RoomsController.update()` only calls `roomsService.update(id, dto)`, while the service checks for a duplicate room number, refuses to change an occupied room, and saves.

**4. What is dependency injection, and where do you use it?**
Instead of creating objects with `new`, a class declares what it needs in its constructor and NestJS supplies it. For example, `constructor(@InjectRepository(Room) private readonly rooms: Repository<Room>)` in `RoomsService`, or `StayService`, which receives `BillingService`, `DigitalKeysService`, `HousekeepingAssignmentService` and `NotificationsService`. This also makes testing easier: in `auth.service.spec.ts` I pass mock repositories.

**5. Why a modular monolith and not microservices?**
For one hotel and one developer, a monolith is simpler to build, test and deploy, and it allows real database transactions across modules (check-out changes five tables at once). The modules are still separated, so one could become a service later if needed.

**6. How do you avoid circular dependencies between modules?**
`ReservationsModule` orchestrates the stay and imports `PaymentsModule`, `DigitalKeysModule`, `HousekeepingModule` and `NotificationsModule`. None of them imports `ReservationsModule` back. They export small helper services that take the caller's `EntityManager`.

### TypeORM, repositories and entities

**7. What is TypeORM and what does it give you?**
TypeORM is an ORM: it maps TypeScript classes (entities) to tables and builds parameterised SQL for me. It also provides migrations, relations, transactions and row locking.

**8. What is an entity? Show one relationship.**
An entity is a class decorated with `@Entity()` that represents a table. In `Reservation`, `@ManyToOne(() => Guest) @JoinColumn({ name: 'guestId' }) guest` is the many-to-one side, and `Guest` has `@OneToMany(() => Reservation, r => r.guest) reservations`.

**9. What is a repository?**
A repository is TypeORM's data-access object for one entity: `find`, `findOneBy`, `save`, `update`, `delete` and query builders. Services get it by injection. Inside transactions I use the transaction's `EntityManager`, so all writes belong to the same transaction.

**10. Did you use `synchronize: true`?**
No. `synchronize` is always false. The schema is created by the migration `1764086400000-InitialSchema.ts`, which also adds CHECK constraints. This makes the database reproducible and keeps the app from silently altering tables.

### MySQL, keys and relationships

**11. What are your primary and foreign keys?**
Each table has an auto-increment INT primary key (`guestId`, `roomId`, `reservationId` and so on). There are 7 foreign keys: reservations → guests and rooms; payments, digital_keys and service_orders → reservations; housekeeping → rooms and staff.

**12. Why `ON DELETE RESTRICT` instead of CASCADE?**
Reservations and payments are business records. With CASCADE, deleting a room or guest would silently delete their bookings and payment history. RESTRICT makes the database refuse, so guests and staff are deactivated instead, reservations are cancelled, and rooms with history can't be deleted (409).

**13. Is your database normalized?**
Yes, to 3NF. Guest data lives only in `guests` and room data only in `rooms`; other tables reference them by foreign key. I deliberately store `ratePerNight` and `totalAmount` on reservations and `unitPrice` on orders. That's not duplication: it's the price at the time of the transaction, so a later price change doesn't rewrite history.

**14. Which constraints does the database enforce itself?**
Primary keys, unique email and room number, foreign keys, NOT NULL, and CHECK constraints for every status list, positive amounts, `checkOutDate > checkInDate`, and `expiresAt > issuedAt`. I verified that MariaDB rejects a negative price.

### REST API, HTTP methods and DTOs

**15. What's the difference between PUT and PATCH in your API?**
`PUT /rooms/:id` replaces all mutable fields, so `ReplaceRoomDto` requires roomNo, roomType, pricePerNight and roomStatus (400 if one is missing). `PATCH /rooms/:id` uses `UpdateRoomDto`, where every field is optional, and only what you send changes. This matches my Lab 05 answer.

**16. Why does `DELETE /reservations/:id` return 200 and not delete the row?**
Deleting a reservation would destroy business history and break payment records. DELETE performs a cancellation: status CANCELLED, the record is kept, and the response includes `refundDue`. It returns 200 because there's a body to show. A real deletion like `DELETE /rooms/:id` returns 204.

**17. What is a DTO, and how does it protect the system?**
A Data Transfer Object is a class that defines the allowed input, e.g. `CreateReservationDto` with roomId, checkInDate, checkOutDate and optional guestId. The global ValidationPipe validates it and, with `forbidNonWhitelisted`, rejects any extra property. That stops mass assignment: a guest can't send `reservationStatus: CONFIRMED` or `totalAmount: 1`.

**18. When do you return 401, 403, 404 and 409?**
401: no token, an invalid or expired token, wrong login, or a deactivated account. 403: logged in but the role or ownership doesn't allow it. 404: the id doesn't exist. 409: the request conflicts with current data, such as a duplicate email, an overlapping booking, an invalid status change, an unpaid balance, or a room not ready.

### JWT, hashing, authentication and authorization

**19. How does JWT work in MariStay?**
After the password is verified, `AuthService` signs a token with HS256 and `JWT_SECRET` containing `sub` (id), `accountType`, `role` and `email`, expiring in one hour. The client sends `Authorization: Bearer <token>`. `JwtStrategy` checks the signature and expiry, then reloads the account from MySQL, so a deactivated user is rejected immediately.

**20. Where is the JWT secret stored? What if it's missing?**
Only in `.env`, which is git-ignored. `validateEnv()` runs at startup and refuses to start if `JWT_SECRET` is missing, shorter than 32 characters, or still the placeholder. There is no fallback secret in the code.

**21. How are passwords stored?**
As bcrypt hashes with cost 10 (`$2b$10$…`); bcrypt adds a random salt. Login uses `bcrypt.compare`. The hash column is `select: false` and `@Exclude()`, so it's never loaded or returned unless the login query asks for it.

**22. What is the difference between authentication and authorization in your code?**
Authentication is "who are you?": `JwtAuthGuard`, which fails with 401. Authorization is "what may you do?": `RolesGuard` with `@Roles(...)`, plus ownership checks like `assertGuestOwnerOrStaff()`, which fail with 403.

**23. Roles aren't enough. How do you stop a guest from reading another guest's reservation?**
Ownership verification. After loading the reservation, the service compares `reservation.guestId` with the token's user id and throws 403 if they differ. List endpoints automatically filter guests to their own records. An e2e test checks this.

**24. What protects the login from brute force?**
`@nestjs/throttler` limits login to 10 attempts per minute per IP (then 429), and bcrypt makes each guess slow. The error message is the same for an unknown email and a wrong password, so attackers can't discover which emails exist.

### Business logic, transactions and integration

**25. How do you prevent double booking?**
Three things. First, the overlap rule `existing.checkIn < new.checkOut AND existing.checkOut > new.checkIn` for PENDING, CONFIRMED and CHECKED_IN reservations, which uses half-open ranges so same-day turnover is allowed. Second, the booking runs in a transaction that locks the room row with `SELECT … FOR UPDATE`. Third, the transaction uses READ COMMITTED, so after getting the lock it sees bookings that were just committed. Six parallel requests for the same room produced one 201 and five 409s.

**26. What is a database transaction, and where do you use one?**
A group of changes that succeed or fail together. Check-in updates the reservation (CHECKED_IN), the room (OCCUPIED), and inserts a digital key. Check-out cancels open orders, updates the reservation, revokes keys, sets the room to CLEANING, and creates a housekeeping task. If anything fails, for example an unpaid balance, everything rolls back.

**27. Why don't you use `roomStatus` to decide if a room is free next week?**
`roomStatus` describes the room right now (occupied, cleaning). Future availability depends on reservations for those dates. A room OCCUPIED today may be free next week. Only MAINTENANCE blocks booking.

**28. Why doesn't the guest send the price of a service order?**
Clients can't be trusted with prices. The guest sends `itemCode` and `quantity`; the server takes `unitPrice` from `service-catalog.ts` and computes `totalAmount`. Sending a price field returns 400.

**29. How are digital keys secured?**
The key is 32 random bytes (`MSK-…`). Only its SHA-256 hash is stored, under a unique index. The plaintext is shown once at check-in or reissue and never logged or included in SMS. Validation checks that the key exists, is ACTIVE, isn't expired, belongs to a CHECKED_IN reservation for that exact room, and that the caller owns it. Reissue and check-out revoke old keys. I used SHA-256 rather than bcrypt because the key is high-entropy random data and must be looked up by hash.

**30. Which parts are simulated, and why?**
The payment gateway (payments are recorded only), SMS and e-mail (`NotificationsService` logs masked messages), and smart locks (validation returns a decision). Real providers need paid accounts and hardware. Each one sits behind a single class, so a real API can replace it without changing the callers.

**31. What does "system integration" mean in your project?**
Separate hotel functions share data and trigger each other through one API and database. A payment confirms a reservation; check-in occupies the room and issues a key; delivered orders are added to the bill; check-out revokes the key and creates a housekeeping task; finishing the task makes the room bookable. In Lab 03 these were separate departments.

**32. What bugs did you find, and how?**
Running real requests against MariaDB showed that TypeORM's shared lock produces `FOR SHARE`, which MariaDB 10.4 doesn't support; I switched to a row lock with READ COMMITTED. Comparing timestamps in responses showed an 8-hour mismatch between app-written and database-default times; I set one time zone for both and corrected the seed data.

**33. How did you test the system?**
33 Jest unit tests cover the logic, and 46 Supertest end-to-end tests run the real app against a fresh MySQL test database: auth, roles, ownership, CRUD, conflicts, concurrency, and the whole check-in-to-housekeeping workflow. All pass. Postman has 122 requests in 11 folders for the live demo.

**34. Is HTTPS implemented?**
Not locally. The demo uses HTTP on localhost. In production, HTTPS would be handled by a reverse proxy in front of the API. I documented this instead of claiming it.
