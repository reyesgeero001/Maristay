import * as bcrypt from 'bcrypt';
import { DataSource, EntityManager } from 'typeorm';
import {
  AccountStatus,
  HousekeepingStatus,
  PaymentMethod,
  PaymentStatus,
  ReservationStatus,
  RoomStatus,
  RoomType,
  ServiceOrderStatus,
  StaffRole,
} from '../../common/enums';
import { BCRYPT_ROUNDS, PASSWORD_MESSAGE, PASSWORD_REGEX } from '../../common/utilities/security.util';
import { nightsBetween, toDateString } from '../../common/utilities/date.util';
import { fromCents, toCents } from '../../common/utilities/money.util';
import { Guest } from '../../guests/entities/guest.entity';
import { Room } from '../../rooms/entities/room.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { Reservation } from '../../reservations/entities/reservation.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { Housekeeping } from '../../housekeeping/entities/housekeeping.entity';
import { ServiceOrder } from '../../service-orders/entities/service-order.entity';
import { SERVICE_CATALOG } from '../../service-orders/service-catalog';

/** Fictional demonstration accounts (reserved example domains, not real people). */
export const DEMO_STAFF = [
  { firstName: 'Marco', lastName: 'Villanueva', email: 'manager@maristay.test', role: StaffRole.MANAGER },
  { firstName: 'Fiona', lastName: 'Dizon', email: 'frontdesk@maristay.test', role: StaffRole.FRONT_DESK },
  { firstName: 'Hector', lastName: 'Ramos', email: 'housekeeping1@maristay.test', role: StaffRole.HOUSEKEEPING },
  { firstName: 'Helen', lastName: 'Castro', email: 'housekeeping2@maristay.test', role: StaffRole.HOUSEKEEPING },
];

export const DEMO_GUESTS = [
  { firstName: 'Juan', lastName: 'Dela Cruz', email: 'juan.delacruz@example.com', phoneNumber: '09170000001' },
  { firstName: 'Ana', lastName: 'Mendoza', email: 'ana.mendoza@example.com', phoneNumber: '09170000002' },
];

export const DEMO_ROOMS = [
  { roomNo: '101', roomType: RoomType.STANDARD, pricePerNight: 1800, roomStatus: RoomStatus.AVAILABLE },
  { roomNo: '102', roomType: RoomType.STANDARD, pricePerNight: 1800, roomStatus: RoomStatus.AVAILABLE },
  { roomNo: '103', roomType: RoomType.STANDARD, pricePerNight: 1800, roomStatus: RoomStatus.AVAILABLE },
  { roomNo: '104', roomType: RoomType.STANDARD, pricePerNight: 1800, roomStatus: RoomStatus.CLEANING },
  { roomNo: '201', roomType: RoomType.DELUXE, pricePerNight: 2500, roomStatus: RoomStatus.AVAILABLE },
  { roomNo: '202', roomType: RoomType.DELUXE, pricePerNight: 2500, roomStatus: RoomStatus.AVAILABLE },
  { roomNo: '301', roomType: RoomType.SUITE, pricePerNight: 4500, roomStatus: RoomStatus.AVAILABLE },
  { roomNo: '302', roomType: RoomType.FAMILY, pricePerNight: 3800, roomStatus: RoomStatus.AVAILABLE },
  { roomNo: '303', roomType: RoomType.FAMILY, pricePerNight: 3800, roomStatus: RoomStatus.MAINTENANCE },
];

export interface SeedSummary {
  staffCreated: number;
  guestsCreated: number;
  roomsCreated: number;
  reservationsCreated: number;
  housekeepingCreated: number;
}

const addDays = (base: Date, days: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * Inserts demonstration data. Safe to re-run:
 *  - accounts and rooms are matched by their unique email / roomNo and skipped if present;
 *  - sample reservations are added only for demo guests who have no reservations yet;
 *  - nothing is ever updated or deleted.
 */
export async function seedDemoData(dataSource: DataSource, demoPassword: string): Promise<SeedSummary> {
  if (!PASSWORD_REGEX.test(demoPassword)) {
    throw new Error(`SEED_DEMO_PASSWORD is not acceptable: ${PASSWORD_MESSAGE}`);
  }
  const passwordHash = await bcrypt.hash(demoPassword, BCRYPT_ROUNDS);
  const summary: SeedSummary = {
    staffCreated: 0,
    guestsCreated: 0,
    roomsCreated: 0,
    reservationsCreated: 0,
    housekeepingCreated: 0,
  };

  await dataSource.transaction(async (em: EntityManager) => {
    // ---- Staff ----
    for (const s of DEMO_STAFF) {
      if (!(await em.existsBy(Staff, { email: s.email }))) {
        await em.insert(Staff, { ...s, passwordHash, accountStatus: AccountStatus.ACTIVE });
        summary.staffCreated++;
      }
    }
    // ---- Guests ----
    for (const g of DEMO_GUESTS) {
      if (!(await em.existsBy(Guest, { email: g.email }))) {
        await em.insert(Guest, { ...g, passwordHash, accountStatus: AccountStatus.ACTIVE });
        summary.guestsCreated++;
      }
    }
    // ---- Rooms ----
    for (const r of DEMO_ROOMS) {
      if (!(await em.existsBy(Room, { roomNo: r.roomNo }))) {
        await em.insert(Room, r);
        summary.roomsCreated++;
      }
    }

    const room = (roomNo: string) => em.findOneByOrFail(Room, { roomNo });
    const staff = (email: string) => em.findOneByOrFail(Staff, { email });
    const guest = (email: string) => em.findOneByOrFail(Guest, { email });
    const now = new Date();

    const makeReservation = async (
      guestId: number,
      r: Room,
      checkIn: Date,
      checkOut: Date,
      status: ReservationStatus,
    ) => {
      const checkInDate = toDateString(checkIn);
      const checkOutDate = toDateString(checkOut);
      const total = fromCents(toCents(r.pricePerNight) * nightsBetween(checkInDate, checkOutDate));
      const result = await em.insert(Reservation, {
        guestId,
        roomId: r.roomId,
        checkInDate,
        checkOutDate,
        reservationStatus: status,
        ratePerNight: r.pricePerNight,
        totalAmount: total,
      });
      summary.reservationsCreated++;
      return { reservationId: result.identifiers[0].reservationId as number, total };
    };

    // ---- Sample history for guest 1: a completed past stay ----
    const juan = await guest(DEMO_GUESTS[0].email);
    if (!(await em.existsBy(Reservation, { guestId: juan.guestId }))) {
      const room201 = await room('201');
      const past = await makeReservation(
        juan.guestId,
        room201,
        addDays(now, -10),
        addDays(now, -8),
        ReservationStatus.CHECKED_OUT,
      );
      const breakfast = SERVICE_CATALOG.BREAKFAST_SET;
      await em.insert(ServiceOrder, {
        reservationId: past.reservationId,
        serviceType: breakfast.serviceType,
        itemCode: 'BREAKFAST_SET',
        quantity: 2,
        unitPrice: breakfast.unitPrice,
        totalAmount: fromCents(toCents(breakfast.unitPrice) * 2),
        status: ServiceOrderStatus.DELIVERED,
        date: addDays(now, -9),
        notes: null,
      });
      await em.insert(Payment, {
        reservationId: past.reservationId,
        amount: fromCents(toCents(past.total) + toCents(breakfast.unitPrice) * 2),
        paymentMethod: PaymentMethod.CARD,
        status: PaymentStatus.PAID,
        date: addDays(now, -10),
      });
      await em.insert(Housekeeping, {
        roomId: room201.roomId,
        staffId: (await staff(DEMO_STAFF[2].email)).staffId,
        status: HousekeepingStatus.COMPLETED,
        lastUpdate: addDays(now, -8),
      });
      summary.housekeepingCreated++;

      // Upcoming confirmed (fully paid) stay.
      const room202 = await room('202');
      const upcoming = await makeReservation(
        juan.guestId,
        room202,
        addDays(now, 14),
        addDays(now, 16),
        ReservationStatus.CONFIRMED,
      );
      await em.insert(Payment, {
        reservationId: upcoming.reservationId,
        amount: upcoming.total,
        paymentMethod: PaymentMethod.E_WALLET,
        status: PaymentStatus.PAID,
        date: now,
      });
    }

    // ---- Sample for guest 2: a pending (unpaid) future booking ----
    const ana = await guest(DEMO_GUESTS[1].email);
    if (!(await em.existsBy(Reservation, { guestId: ana.guestId }))) {
      await makeReservation(ana.guestId, await room('301'), addDays(now, 7), addDays(now, 10), ReservationStatus.PENDING);
    }

    // ---- Room 104 is being cleaned: make sure it has an open housekeeping task ----
    const room104 = await room('104');
    const hasOpenTask = await em
      .createQueryBuilder(Housekeeping, 'hk')
      .where('hk.roomId = :roomId', { roomId: room104.roomId })
      .andWhere('hk.status IN (:...open)', { open: [HousekeepingStatus.PENDING, HousekeepingStatus.IN_PROGRESS] })
      .getExists();
    if (!hasOpenTask && room104.roomStatus === RoomStatus.CLEANING) {
      await em.insert(Housekeeping, {
        roomId: room104.roomId,
        staffId: (await staff(DEMO_STAFF[2].email)).staffId,
        status: HousekeepingStatus.PENDING,
        lastUpdate: now,
      });
      summary.housekeepingCreated++;
    }
  });

  return summary;
}
