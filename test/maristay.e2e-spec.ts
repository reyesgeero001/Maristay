import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { configureApp } from '../src/app.setup';
import { toDateString } from '../src/common/utilities/date.util';
import { DigitalKey } from '../src/digital-keys/entities/digital-key.entity';
import { prepareTestDatabase, TEST_PASSWORD } from './test-database';

/**
 * End-to-end tests: real NestJS app + real MySQL (isolated *_test database).
 * Requests go through the same guards, pipes and filters as production.
 * The suite is ordered: later steps reuse ids created by earlier ones.
 */
const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return toDateString(d);
};

describe('MariStay API (e2e)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;
  const api = (path: string) => `/api/v1${path}`;
  const token: Record<'manager' | 'frontDesk' | 'hk1' | 'hk2' | 'juan' | 'ana', string> = {} as never;
  const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });

  beforeAll(async () => {
    process.env.LOGIN_RATE_LIMIT = '1000';
    await prepareTestDatabase();
    const { AppModule } = await import('../src/app.module'); // load after DB_DATABASE is set
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    http = request(app.getHttpServer());

    const login = async (email: string) =>
      (await request(app.getHttpServer()).post(api('/auth/login')).send({ email, password: TEST_PASSWORD }).expect(200))
        .body.accessToken as string;
    token.manager = await login('manager@maristay.test');
    token.frontDesk = await login('frontdesk@maristay.test');
    token.hk1 = await login('housekeeping1@maristay.test');
    token.hk2 = await login('housekeeping2@maristay.test');
    token.juan = await login('juan.delacruz@example.com');
    token.ana = await login('ana.mendoza@example.com');
  });

  afterAll(async () => {
    await app?.close();
  });

  // ------------------------------------------------------------ authentication
  describe('Authentication & authorization', () => {
    let newGuestId: number;

    it('registers a guest (201) without exposing the password hash', async () => {
      const res = await request(app.getHttpServer())
        .post(api('/guests'))
        .send({ firstName: 'Maria', lastName: 'Santos', email: 'Maria.Santos@Example.com', password: 'MariaPass123', phoneNumber: '0917 555 1234' })
        .expect(201);
      newGuestId = res.body.guestId;
      expect(res.body.email).toBe('maria.santos@example.com');
      expect(res.body.phoneNumber).toBe('09175551234');
      expect(res.body.passwordHash).toBeUndefined();
      expect(res.body.accountStatus).toBe('ACTIVE');
    });

    it('rejects a duplicate email (409), also across staff accounts', async () => {
      await request(app.getHttpServer())
        .post(api('/guests'))
        .send({ firstName: 'X', lastName: 'Y', email: 'maria.santos@example.com', password: 'MariaPass123', phoneNumber: '09170000000' })
        .expect(409);
      await request(app.getHttpServer())
        .post(api('/guests'))
        .send({ firstName: 'X', lastName: 'Y', email: 'manager@maristay.test', password: 'MariaPass123', phoneNumber: '09170000000' })
        .expect(409);
    });

    it('rejects invalid registration data and unknown properties (400)', async () => {
      const res = await request(app.getHttpServer())
        .post(api('/guests'))
        .send({ firstName: '', lastName: 'Y', email: 'not-an-email', password: 'weak', phoneNumber: 'abc', role: 'MANAGER' })
        .expect(400);
      expect(res.body.message).toEqual(expect.arrayContaining(['property role should not exist']));
    });

    it('logs in with valid credentials and returns a JWT (200)', async () => {
      const res = await request(app.getHttpServer())
        .post(api('/auth/login'))
        .send({ email: 'maria.santos@example.com', password: 'MariaPass123' })
        .expect(200);
      expect(res.body.accessToken).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
      expect(res.body.user).toMatchObject({ id: newGuestId, role: 'GUEST', accountType: 'GUEST' });
    });

    it('rejects invalid credentials (401)', async () => {
      await request(app.getHttpServer())
        .post(api('/auth/login'))
        .send({ email: 'maria.santos@example.com', password: 'WrongPass999' })
        .expect(401);
    });

    it('rejects a protected route without a token (401)', () =>
      request(app.getHttpServer()).get(api('/auth/me')).expect(401));

    it('rejects a protected route with an invalid / tampered token (401)', async () => {
      await request(app.getHttpServer()).get(api('/auth/me')).set(bearer('not.a.jwt')).expect(401);
      const [h, p] = token.juan.split('.');
      await request(app.getHttpServer()).get(api('/auth/me')).set(bearer(`${h}.${p}.forgedsignature`)).expect(401);
    });

    it('returns the current profile with a valid token (200)', async () => {
      const res = await request(app.getHttpServer()).get(api('/auth/me')).set(bearer(token.juan)).expect(200);
      expect(res.body.profile.email).toBe('juan.delacruz@example.com');
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    });

    it('returns 403 when a guest calls a manager-only route', () =>
      request(app.getHttpServer())
        .post(api('/rooms'))
        .set(bearer(token.juan))
        .send({ roomNo: '999', roomType: 'Suite', pricePerNight: 1 })
        .expect(403));

    it("returns 403 when a guest reads another guest's profile", () =>
      request(app.getHttpServer()).get(api(`/guests/${newGuestId}`)).set(bearer(token.juan)).expect(403));

    it('rejects a non-numeric id (400)', () =>
      request(app.getHttpServer()).get(api('/guests/abc')).set(bearer(token.manager)).expect(400));

    it('blocks a deactivated account immediately, even with an unexpired token', async () => {
      const login = await request(app.getHttpServer())
        .post(api('/auth/login'))
        .send({ email: 'maria.santos@example.com', password: 'MariaPass123' });
      const mariaToken = login.body.accessToken;
      await request(app.getHttpServer()).delete(api(`/guests/${newGuestId}`)).set(bearer(mariaToken)).expect(204);
      await request(app.getHttpServer()).get(api('/auth/me')).set(bearer(mariaToken)).expect(401);
      await request(app.getHttpServer())
        .post(api('/auth/login'))
        .send({ email: 'maria.santos@example.com', password: 'MariaPass123' })
        .expect(401);
    });
  });

  // ------------------------------------------------------------ rooms CRUD
  describe('Room management (full CRUD)', () => {
    let roomId: number;

    it('lists rooms publicly with the Lab 05 filter ?roomStatus=Available', async () => {
      const res = await request(app.getHttpServer()).get(api('/rooms?roomStatus=Available')).expect(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.every((r: { roomStatus: string }) => r.roomStatus === 'AVAILABLE')).toBe(true);
    });

    it('rejects an invalid status filter (400)', () =>
      request(app.getHttpServer()).get(api('/rooms?roomStatus=Vacant')).expect(400));

    it('creates a room (201)', async () => {
      const res = await request(app.getHttpServer())
        .post(api('/rooms'))
        .set(bearer(token.manager))
        .send({ roomNo: 't-901', roomType: 'deluxe', pricePerNight: 2750.5 })
        .expect(201);
      roomId = res.body.roomId;
      expect(res.body).toMatchObject({ roomNo: 'T-901', roomType: 'Deluxe', pricePerNight: 2750.5, roomStatus: 'AVAILABLE' });
    });

    it('rejects invalid room data (400) and a duplicate room number (409)', async () => {
      await request(app.getHttpServer())
        .post(api('/rooms'))
        .set(bearer(token.manager))
        .send({ roomNo: '', roomType: 'Palace', pricePerNight: -1 })
        .expect(400);
      await request(app.getHttpServer())
        .post(api('/rooms'))
        .set(bearer(token.manager))
        .send({ roomNo: 'T-901', roomType: 'Deluxe', pricePerNight: 1 })
        .expect(409);
    });

    it('retrieves the room (200)', async () => {
      const res = await request(app.getHttpServer()).get(api(`/rooms/${roomId}`)).expect(200);
      expect(res.body.roomNo).toBe('T-901');
    });

    it('updates the room with PATCH (200)', async () => {
      const res = await request(app.getHttpServer())
        .patch(api(`/rooms/${roomId}`))
        .set(bearer(token.manager))
        .send({ roomStatus: 'Maintenance' })
        .expect(200);
      expect(res.body.roomStatus).toBe('MAINTENANCE');
    });

    it('replaces the room with PUT (200) and requires every field (400)', async () => {
      await request(app.getHttpServer())
        .put(api(`/rooms/${roomId}`))
        .set(bearer(token.manager))
        .send({ roomNo: 'T-901', roomType: 'Suite' })
        .expect(400);
      const res = await request(app.getHttpServer())
        .put(api(`/rooms/${roomId}`))
        .set(bearer(token.manager))
        .send({ roomNo: 'T-901', roomType: 'Suite', pricePerNight: 5000, roomStatus: 'AVAILABLE' })
        .expect(200);
      expect(res.body).toMatchObject({ roomType: 'Suite', pricePerNight: 5000, roomStatus: 'AVAILABLE' });
    });

    it('deletes the test room (204) and then returns 404', async () => {
      await request(app.getHttpServer()).delete(api(`/rooms/${roomId}`)).set(bearer(token.manager)).expect(204);
      await request(app.getHttpServer()).get(api(`/rooms/${roomId}`)).expect(404);
    });

    it('refuses to delete a room with reservation history (409)', async () => {
      const rooms = await request(app.getHttpServer()).get(api('/rooms?roomType=Deluxe'));
      const room201 = rooms.body.data.find((r: { roomNo: string }) => r.roomNo === '201');
      await request(app.getHttpServer()).delete(api(`/rooms/${room201.roomId}`)).set(bearer(token.manager)).expect(409);
    });
  });

  // ------------------------------------------------------------ reservations
  describe('Reservations and conflict prevention', () => {
    let room102: number;
    beforeAll(async () => {
      const rooms = await request(app.getHttpServer()).get(api('/rooms?roomType=Standard'));
      room102 = rooms.body.data.find((r: { roomNo: string }) => r.roomNo === '102').roomId;
    });

    it('rejects invalid reservation dates (400)', async () => {
      await request(app.getHttpServer())
        .post(api('/reservations'))
        .set(bearer(token.juan))
        .send({ roomId: room102, checkInDate: day(5), checkOutDate: day(3) })
        .expect(400);
      await request(app.getHttpServer())
        .post(api('/reservations'))
        .set(bearer(token.juan))
        .send({ roomId: room102, checkInDate: day(-2), checkOutDate: day(1) })
        .expect(400);
      await request(app.getHttpServer())
        .post(api('/reservations'))
        .set(bearer(token.juan))
        .send({ roomId: room102, checkInDate: '2026-02-30', checkOutDate: day(1) })
        .expect(400);
    });

    it('books a room (201) as PENDING with a server-calculated total', async () => {
      const res = await request(app.getHttpServer())
        .post(api('/reservations'))
        .set(bearer(token.juan))
        .send({ roomId: room102, checkInDate: day(20), checkOutDate: day(23) })
        .expect(201);
      expect(res.body).toMatchObject({ reservationStatus: 'PENDING', ratePerNight: 1800, totalAmount: 5400 });
    });

    it('rejects an overlapping reservation (409) but allows same-day turnover', async () => {
      await request(app.getHttpServer())
        .post(api('/reservations'))
        .set(bearer(token.ana))
        .send({ roomId: room102, checkInDate: day(22), checkOutDate: day(24) })
        .expect(409);
      await request(app.getHttpServer())
        .post(api('/reservations'))
        .set(bearer(token.ana))
        .send({ roomId: room102, checkInDate: day(23), checkOutDate: day(25) })
        .expect(201);
    });

    it('allows exactly one of several concurrent conflicting bookings', async () => {
      const attempts = await Promise.all(
        [token.juan, token.ana, token.juan, token.ana, token.juan, token.ana].map((t) =>
          request(app.getHttpServer())
            .post(api('/reservations'))
            .set(bearer(t))
            .send({ roomId: room102, checkInDate: day(40), checkOutDate: day(42) }),
        ),
      );
      const statuses = attempts.map((r) => r.status).sort();
      expect(statuses).toEqual([201, 409, 409, 409, 409, 409]);
    });

    it("forbids a guest from viewing another guest's reservation (403)", async () => {
      const mine = await request(app.getHttpServer()).get(api('/reservations')).set(bearer(token.juan)).expect(200);
      const juanReservation = mine.body.data[0].reservationId;
      await request(app.getHttpServer()).get(api(`/reservations/${juanReservation}`)).set(bearer(token.ana)).expect(403);
      const anaList = await request(app.getHttpServer()).get(api('/reservations')).set(bearer(token.ana)).expect(200);
      expect(anaList.body.data.every((r: { guestId: number }) => r.guestId !== mine.body.data[0].guestId)).toBe(true);
    });

    it('denies housekeeping access to reservations (403)', () =>
      request(app.getHttpServer()).get(api('/reservations')).set(bearer(token.hk1)).expect(403));

    it('rejects client-controlled status / booking for someone else', async () => {
      await request(app.getHttpServer())
        .post(api('/reservations'))
        .set(bearer(token.juan))
        .send({ roomId: room102, checkInDate: day(50), checkOutDate: day(51), reservationStatus: 'CONFIRMED' })
        .expect(400);
      await request(app.getHttpServer())
        .post(api('/reservations'))
        .set(bearer(token.juan))
        .send({ roomId: room102, checkInDate: day(50), checkOutDate: day(51), guestId: 2 })
        .expect(403);
    });
  });

  // ------------------------------------------------------------ integrated workflow
  describe('Integrated guest workflow', () => {
    let roomId: number;
    let reservationId: number;
    let keyCode: string;
    let keyId: number;
    let hkId: number;
    let assignedHousekeeper: 'hk1' | 'hk2';

    beforeAll(async () => {
      const rooms = await request(app.getHttpServer()).get(api('/rooms?roomType=Standard'));
      roomId = rooms.body.data.find((r: { roomNo: string }) => r.roomNo === '103').roomId;
    });

    it('step 4: guest books a room for today', async () => {
      const res = await request(app.getHttpServer())
        .post(api('/reservations'))
        .set(bearer(token.juan))
        .send({ roomId, checkInDate: day(0), checkOutDate: day(2) })
        .expect(201);
      reservationId = res.body.reservationId;
      expect(res.body.totalAmount).toBe(3600);
    });

    it('rejects check-in without sufficient payment (409)', async () => {
      await request(app.getHttpServer()).patch(api(`/reservations/${reservationId}/check-in`)).set(bearer(token.juan)).expect(409);
      await request(app.getHttpServer())
        .patch(api(`/reservations/${reservationId}/confirm`))
        .set(bearer(token.frontDesk))
        .expect(200);
      const res = await request(app.getHttpServer())
        .patch(api(`/reservations/${reservationId}/check-in`))
        .set(bearer(token.juan))
        .expect(409);
      expect(res.body.message).toMatch(/Payment required/);
    });

    it('rejects invalid payment information (400) and guest-recorded payments (403)', async () => {
      await request(app.getHttpServer())
        .post(api('/payments'))
        .set(bearer(token.frontDesk))
        .send({ reservationId, amount: -10, paymentMethod: 'BITCOIN' })
        .expect(400);
      await request(app.getHttpServer())
        .post(api('/payments'))
        .set(bearer(token.frontDesk))
        .send({ reservationId, amount: 999999, paymentMethod: 'CASH' })
        .expect(400);
      await request(app.getHttpServer())
        .post(api('/payments'))
        .set(bearer(token.juan))
        .send({ reservationId, amount: 3600, paymentMethod: 'CASH' })
        .expect(403);
    });

    it('step 5: front desk records payments; FAILED does not count, PAID does', async () => {
      const failed = await request(app.getHttpServer())
        .post(api('/payments'))
        .set(bearer(token.frontDesk))
        .send({ reservationId, amount: 3600, paymentMethod: 'card', status: 'FAILED' })
        .expect(201);
      expect(failed.body.billing.paidTotal).toBe(0);

      const paid = await request(app.getHttpServer())
        .post(api('/payments'))
        .set(bearer(token.frontDesk))
        .send({ reservationId, amount: 3600, paymentMethod: 'CASH' })
        .expect(201);
      expect(paid.body).toMatchObject({ status: 'PAID', paymentMethod: 'CASH', reservationStatus: 'CONFIRMED' });
      expect(paid.body.billing.balanceDue).toBe(0);
      expect(paid.body.date).not.toBeNull();
    });

    it('rejects check-in when the room is not ready (409)', async () => {
      await request(app.getHttpServer()).patch(api(`/rooms/${roomId}`)).set(bearer(token.manager)).send({ roomStatus: 'CLEANING' }).expect(200);
      const res = await request(app.getHttpServer())
        .patch(api(`/reservations/${reservationId}/check-in`))
        .set(bearer(token.juan))
        .expect(409);
      expect(res.body.message).toMatch(/not ready/);
      await request(app.getHttpServer()).patch(api(`/rooms/${roomId}`)).set(bearer(token.manager)).send({ roomStatus: 'AVAILABLE' }).expect(200);
    });

    it('step 6: digital check-in succeeds and issues a digital key', async () => {
      const res = await request(app.getHttpServer())
        .patch(api(`/reservations/${reservationId}/check-in`))
        .set(bearer(token.juan))
        .expect(200);
      expect(res.body.reservation.reservationStatus).toBe('CHECKED_IN');
      expect(res.body.reservation.room.roomStatus).toBe('OCCUPIED');
      expect(res.body.digitalKey.keyCode).toMatch(/^MSK-/);
      expect(res.body.digitalKey.status).toBe('ACTIVE');
      expect(res.body.notifications.map((n: { status: string }) => n.status)).toEqual(['SIMULATED_SENT', 'SIMULATED_SENT']);
      expect(JSON.stringify(res.body)).not.toContain('keyCodeHash');
      keyCode = res.body.digitalKey.keyCode;
      keyId = res.body.digitalKey.keyId;
    });

    it('stores only a hash of the digital key in MySQL', async () => {
      const stored = await app.get(DataSource).getRepository(DigitalKey).findOneByOrFail({ keyId });
      expect(stored.keyCodeHash).toHaveLength(64);
      expect(stored.keyCodeHash).not.toContain(keyCode);
    });

    it('step 7: validates the digital key (simulated smart lock)', async () => {
      const ok = await request(app.getHttpServer())
        .post(api('/digital-keys/validate'))
        .set(bearer(token.juan))
        .send({ keyCode, roomId })
        .expect(200);
      expect(ok.body.accessGranted).toBe(true);
      await request(app.getHttpServer())
        .post(api('/digital-keys/validate'))
        .set(bearer(token.juan))
        .send({ keyCode: `MSK-${'A'.repeat(43)}`, roomId })
        .expect(403);
    });

    it('rejects expired and revoked keys (403)', async () => {
      const ds = app.get(DataSource);
      // Expired: issue a fresh key, then move its expiry into the past.
      const expired = await request(app.getHttpServer())
        .post(api('/digital-keys'))
        .set(bearer(token.frontDesk))
        .send({ reservationId })
        .expect(201);
      // (issuedAt is moved back too: the CHK_digital_keys_validity constraint requires expiresAt > issuedAt)
      await ds
        .getRepository(DigitalKey)
        .update(
          { keyId: expired.body.keyId },
          { issuedAt: new Date(Date.now() - 2 * 3_600_000), expiresAt: new Date(Date.now() - 60_000) },
        );
      const e = await request(app.getHttpServer())
        .post(api('/digital-keys/validate'))
        .set(bearer(token.juan))
        .send({ keyCode: expired.body.keyCode, roomId })
        .expect(403);
      expect(e.body.message).toMatch(/expired/);

      // Revoked: the original key was revoked when the new one was issued.
      const r = await request(app.getHttpServer())
        .post(api('/digital-keys/validate'))
        .set(bearer(token.juan))
        .send({ keyCode, roomId })
        .expect(403);
      expect(r.body.message).toMatch(/revoked/);

      // Re-issue a working key for the rest of the stay.
      const fresh = await request(app.getHttpServer()).post(api('/digital-keys')).set(bearer(token.juan)).send({ reservationId }).expect(201);
      keyCode = fresh.body.keyCode;
    });

    it('step 8: places a service order with server-side pricing (201)', async () => {
      await request(app.getHttpServer())
        .post(api('/service-orders'))
        .set(bearer(token.juan))
        .send({ reservationId, itemCode: 'BREAKFAST_SET', quantity: 2, totalAmount: 1 })
        .expect(400);
      const res = await request(app.getHttpServer())
        .post(api('/service-orders'))
        .set(bearer(token.juan))
        .send({ reservationId, itemCode: 'breakfast_set', quantity: 2 })
        .expect(201);
      expect(res.body).toMatchObject({ serviceType: 'Food', unitPrice: 450, totalAmount: 900, status: 'PENDING' });

      await request(app.getHttpServer()).patch(api(`/service-orders/${res.body.orderId}`)).set(bearer(token.frontDesk)).send({ status: 'PREPARING' }).expect(200);
      await request(app.getHttpServer()).patch(api(`/service-orders/${res.body.orderId}`)).set(bearer(token.frontDesk)).send({ status: 'DELIVERED' }).expect(200);
    });

    it('rejects unauthorized service orders (403 other guest, 409 not checked in)', async () => {
      await request(app.getHttpServer())
        .post(api('/service-orders'))
        .set(bearer(token.ana))
        .send({ reservationId, itemCode: 'BREWED_COFFEE', quantity: 1 })
        .expect(403);
      const anaRes = await request(app.getHttpServer()).get(api('/reservations')).set(bearer(token.ana));
      await request(app.getHttpServer())
        .post(api('/service-orders'))
        .set(bearer(token.ana))
        .send({ reservationId: anaRes.body.data[0].reservationId, itemCode: 'BREWED_COFFEE', quantity: 1 })
        .expect(409);
    });

    it('step 9: blocks check-out while service charges are unpaid, then succeeds', async () => {
      const blocked = await request(app.getHttpServer())
        .patch(api(`/reservations/${reservationId}/check-out`))
        .set(bearer(token.juan))
        .expect(409);
      expect(blocked.body.message).toMatch(/900\.00/);

      await request(app.getHttpServer())
        .post(api('/payments'))
        .set(bearer(token.frontDesk))
        .send({ reservationId, amount: 900, paymentMethod: 'E_WALLET' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(api(`/reservations/${reservationId}/check-out`))
        .set(bearer(token.juan))
        .expect(200);
      expect(res.body.reservation.reservationStatus).toBe('CHECKED_OUT');
      expect(res.body.reservation.room.roomStatus).toBe('CLEANING');
      expect(res.body.digitalKeysRevoked).toBe(1);
      expect(res.body.billing).toMatchObject({ serviceCharges: 900, balanceDue: 0 });
      expect(res.body.housekeepingTask.status).toBe('PENDING');
      hkId = res.body.housekeepingTask.hkId;
      assignedHousekeeper = res.body.housekeepingTask.staffId === 3 ? 'hk1' : 'hk2';

      await request(app.getHttpServer()).post(api('/digital-keys/validate')).set(bearer(token.juan)).send({ keyCode, roomId }).expect(403);
    });

    it("step 10: housekeepers cannot touch another housekeeper's task (403)", async () => {
      const other = assignedHousekeeper === 'hk1' ? 'hk2' : 'hk1';
      await request(app.getHttpServer()).patch(api(`/housekeeping/${hkId}`)).set(bearer(token[other])).send({ status: 'IN_PROGRESS' }).expect(403);
      await request(app.getHttpServer()).get(api('/payments')).set(bearer(token[other])).expect(403);
    });

    it('step 10: assigned housekeeper completes the task and the room becomes AVAILABLE', async () => {
      const hk = token[assignedHousekeeper];
      await request(app.getHttpServer()).patch(api(`/housekeeping/${hkId}`)).set(bearer(hk)).send({ status: 'COMPLETED' }).expect(409);
      const progress = await request(app.getHttpServer()).patch(api(`/housekeeping/${hkId}`)).set(bearer(hk)).send({ status: 'in_progress' }).expect(200);
      expect(progress.body.room.roomStatus).toBe('CLEANING');
      const done = await request(app.getHttpServer()).patch(api(`/housekeeping/${hkId}`)).set(bearer(hk)).send({ status: 'COMPLETED' }).expect(200);
      expect(done.body.status).toBe('COMPLETED');
      expect(done.body.room.roomStatus).toBe('AVAILABLE');
    });

    it('manager assigns a housekeeping task manually (201)', async () => {
      const res = await request(app.getHttpServer())
        .post(api('/housekeeping'))
        .set(bearer(token.manager))
        .send({ roomId, staffId: 4 })
        .expect(201);
      expect(res.body).toMatchObject({ status: 'PENDING', staffId: 4 });
      expect(res.body.room.roomStatus).toBe('CLEANING');
      await request(app.getHttpServer()).post(api('/housekeeping')).set(bearer(token.manager)).send({ roomId, staffId: 3 }).expect(409);
    });
  });

  // ------------------------------------------------------------ staff
  describe('Staff management (Manager CRUD)', () => {
    it('creates, reads, updates and deactivates a staff account', async () => {
      const created = await request(app.getHttpServer())
        .post(api('/staff'))
        .set(bearer(token.manager))
        .send({ firstName: 'Liza', lastName: 'Cruz', email: 'fd2@maristay.test', role: 'front_desk', password: 'StaffPass123' })
        .expect(201);
      const id = created.body.staffId;
      expect(created.body.passwordHash).toBeUndefined();
      await request(app.getHttpServer()).get(api(`/staff/${id}`)).set(bearer(token.manager)).expect(200);
      const updated = await request(app.getHttpServer()).patch(api(`/staff/${id}`)).set(bearer(token.manager)).send({ lastName: 'Reyes' }).expect(200);
      expect(updated.body.lastName).toBe('Reyes');
      await request(app.getHttpServer()).delete(api(`/staff/${id}`)).set(bearer(token.manager)).expect(204);
      await request(app.getHttpServer()).post(api('/auth/login')).send({ email: 'fd2@maristay.test', password: 'StaffPass123' }).expect(401);
    });

    it('is manager-only (403 for front desk)', () =>
      request(app.getHttpServer()).get(api('/staff')).set(bearer(token.frontDesk)).expect(403));
  });

  // ------------------------------------------------------------ rate limiting (last: it exhausts the login limit)
  describe('Login rate limiting', () => {
    it('returns 429 after too many login attempts', async () => {
      process.env.LOGIN_RATE_LIMIT = '3';
      const statuses: number[] = [];
      for (let i = 0; i < 5; i++) {
        const res = await http.post(api('/auth/login')).send({ email: 'juan.delacruz@example.com', password: 'WrongPass000' });
        statuses.push(res.status);
      }
      expect(statuses).toContain(429);
    });
  });
});
