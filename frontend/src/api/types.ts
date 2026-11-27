/**
 * Response/request shapes of the MariStay REST API.
 * They mirror the backend entities and DTOs in ../../../backend/src (NestJS); keep them in sync.
 */

export type Role = 'GUEST' | 'FRONT_DESK' | 'HOUSEKEEPING' | 'MANAGER';
export type AccountType = 'GUEST' | 'STAFF';
export type AccountStatus = 'ACTIVE' | 'INACTIVE';
export type StaffRole = 'FRONT_DESK' | 'HOUSEKEEPING' | 'MANAGER';
export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE';
export type RoomType = 'Standard' | 'Deluxe' | 'Suite' | 'Family';
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'CARD' | 'E_WALLET';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type DigitalKeyStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';
export type HousekeepingStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type ServiceOrderStatus = 'PENDING' | 'PREPARING' | 'DELIVERED' | 'CANCELLED';

export const ROOM_TYPES: RoomType[] = ['Standard', 'Deluxe', 'Suite', 'Family'];
export const ROOM_STATUSES: RoomStatus[] = ['AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'];
/** OCCUPIED is set only by the check-in workflow (backend MANUAL_ROOM_STATUSES). */
export const MANUAL_ROOM_STATUSES: RoomStatus[] = ['AVAILABLE', 'CLEANING', 'MAINTENANCE'];
export const RESERVATION_STATUSES: ReservationStatus[] = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'];
export const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'CARD', 'E_WALLET'];
export const STAFF_ROLES: StaffRole[] = ['FRONT_DESK', 'HOUSEKEEPING', 'MANAGER'];

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface AuthUserInfo {
  id: number;
  accountType: AccountType;
  role: Role;
  firstName: string;
  lastName: string;
  email: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: AuthUserInfo;
}

export interface Guest {
  guestId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Staff {
  staffId: number;
  firstName: string;
  lastName: string;
  role: StaffRole;
  email: string;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MeResponse {
  accountType: AccountType;
  role: Role;
  profile: Guest | Staff;
}

export interface Room {
  roomId: number;
  roomNo: string;
  roomType: RoomType;
  pricePerNight: number;
  roomStatus: RoomStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  reservationId: number;
  guestId: number;
  roomId: number;
  checkInDate: string;
  checkOutDate: string;
  reservationStatus: ReservationStatus;
  ratePerNight: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  room?: Room;
  guest?: Guest;
}

export interface BillingSummary {
  roomTotal: number;
  serviceCharges: number;
  totalBillable: number;
  paidTotal: number;
  balanceDue: number;
  overpaid: number;
}

export interface Payment {
  paymentId: number;
  reservationId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  date: string | null;
  createdAt: string;
}

export type PaymentWithBilling = Payment & { reservationStatus: ReservationStatus; billing: BillingSummary };

export interface DigitalKey {
  keyId: number;
  reservationId: number;
  issuedAt: string;
  expiresAt: string;
  status: DigitalKeyStatus;
  reservation?: Reservation;
}

/** Returned only by check-in and key (re)issue — the only time keyCode is ever visible. */
export interface IssuedKey {
  keyId: number;
  reservationId: number;
  keyCode: string;
  issuedAt: string;
  expiresAt: string;
  status: DigitalKeyStatus;
}

export interface AccessDecision {
  accessGranted: true;
  keyId: number;
  reservationId: number;
  roomId: number;
  roomNo: string;
  expiresAt: string;
  message: string;
}

export interface NotificationResult {
  channel: string;
  to: string;
  simulated: boolean;
  [key: string]: unknown;
}

export interface CheckInResult {
  message: string;
  reservation: Reservation;
  digitalKey: IssuedKey;
  notifications: NotificationResult[];
}

export interface Housekeeping {
  hkId: number;
  roomId: number;
  staffId: number;
  status: HousekeepingStatus;
  lastUpdate: string;
  createdAt: string;
  room?: Room;
  staff?: Staff;
}

export interface CheckOutResult {
  message: string;
  reservation: Reservation;
  billing: BillingSummary;
  digitalKeysRevoked: number;
  openServiceOrdersCancelled: number;
  housekeepingTask: Housekeeping | null;
  notifications: NotificationResult[];
}

export interface ServiceOrder {
  orderId: number;
  reservationId: number;
  serviceType: string;
  itemCode: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: ServiceOrderStatus;
  date: string;
  notes: string | null;
  reservation?: Reservation;
}
