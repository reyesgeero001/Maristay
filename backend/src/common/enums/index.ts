/**
 * Central place for every status / role value used by MariStay.
 * Values are stored in MySQL as VARCHAR and protected by CHECK constraints
 * (see src/database/migrations).
 */

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/** Distinguishes which table an authenticated identity lives in. */
export enum AccountType {
  GUEST = 'GUEST',
  STAFF = 'STAFF',
}

/** Roles stored on the staff table. */
export enum StaffRole {
  FRONT_DESK = 'FRONT_DESK',
  HOUSEKEEPING = 'HOUSEKEEPING',
  MANAGER = 'MANAGER',
}

/** Every role that can appear inside a JWT (guests + staff roles). */
export enum Role {
  GUEST = 'GUEST',
  FRONT_DESK = 'FRONT_DESK',
  HOUSEKEEPING = 'HOUSEKEEPING',
  MANAGER = 'MANAGER',
}

export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  CLEANING = 'CLEANING',
  MAINTENANCE = 'MAINTENANCE',
}

export enum RoomType {
  STANDARD = 'Standard',
  DELUXE = 'Deluxe',
  SUITE = 'Suite',
  FAMILY = 'Family',
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  CANCELLED = 'CANCELLED',
}

/** Reservations in these states block the room for their date range. */
export const ACTIVE_RESERVATION_STATUSES: ReservationStatus[] = [
  ReservationStatus.PENDING,
  ReservationStatus.CONFIRMED,
  ReservationStatus.CHECKED_IN,
];

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  E_WALLET = 'E_WALLET',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum DigitalKeyStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export enum HousekeepingStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum ServiceOrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum ServiceType {
  FOOD = 'Food',
  BEVERAGE = 'Beverage',
  AMENITIES = 'Amenities',
  LAUNDRY = 'Laundry',
  OTHER = 'Other',
}

export const STAFF_ROLES: Role[] = [Role.FRONT_DESK, Role.HOUSEKEEPING, Role.MANAGER];
/** Staff who handle guest-facing operations (reservations, payments, orders). */
export const OPERATIONS_ROLES: Role[] = [Role.FRONT_DESK, Role.MANAGER];
