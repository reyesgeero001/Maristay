import { api } from './client';
import type {
  AccessDecision,
  AccountStatus,
  CheckInResult,
  CheckOutResult,
  DigitalKey,
  Guest,
  Housekeeping,
  HousekeepingStatus,
  IssuedKey,
  LoginResponse,
  MeResponse,
  Paginated,
  Payment,
  PaymentMethod,
  PaymentStatus,
  PaymentWithBilling,
  Reservation,
  Room,
  RoomStatus,
  RoomType,
  ServiceOrder,
  ServiceOrderStatus,
  Staff,
  StaffRole,
} from './types';

/** Query parameters: undefined / empty values are dropped before sending. */
type Query = Record<string, string | number | undefined>;
const clean = (q: Query = {}) =>
  Object.fromEntries(Object.entries(q).filter(([, v]) => v !== undefined && v !== ''));

const get = <T>(url: string, params?: Query) => api.get<T>(url, { params: clean(params) }).then((r) => r.data);
const post = <T>(url: string, body?: unknown) => api.post<T>(url, body).then((r) => r.data);
const patch = <T>(url: string, body?: unknown) => api.patch<T>(url, body).then((r) => r.data);
const del = <T = void>(url: string) => api.delete<T>(url).then((r) => r.data);

// ------------------------------------------------------------------ auth
export const authApi = {
  login: (email: string, password: string) => post<LoginResponse>('/auth/login', { email, password }),
  me: () => get<MeResponse>('/auth/me'),
};

// ----------------------------------------------------------------- rooms
export interface RoomInput {
  roomNo: string;
  roomType: RoomType;
  pricePerNight: number;
  roomStatus?: RoomStatus;
}
export const roomsApi = {
  list: (q?: Query) => get<Paginated<Room>>('/rooms', q),
  create: (body: RoomInput) => post<Room>('/rooms', body),
  update: (id: number, body: Partial<RoomInput>) => patch<Room>(`/rooms/${id}`, body),
  remove: (id: number) => del(`/rooms/${id}`),
};

// ---------------------------------------------------------- reservations
export const reservationsApi = {
  list: (q?: Query) => get<Paginated<Reservation>>('/reservations', q),
  get: (id: number) => get<Reservation>(`/reservations/${id}`),
  create: (body: { roomId: number; checkInDate: string; checkOutDate: string; guestId?: number }) =>
    post<Reservation>('/reservations', body),
  update: (id: number, body: { roomId?: number; checkInDate?: string; checkOutDate?: string }) =>
    patch<Reservation>(`/reservations/${id}`, body),
  confirm: (id: number) => patch<Reservation>(`/reservations/${id}/confirm`),
  checkIn: (id: number) => patch<CheckInResult>(`/reservations/${id}/check-in`),
  checkOut: (id: number) => patch<CheckOutResult>(`/reservations/${id}/check-out`),
  cancel: (id: number) => del<Reservation & { refundDue: number }>(`/reservations/${id}`),
};

// -------------------------------------------------------------- payments
export const paymentsApi = {
  list: (q?: Query) => get<Paginated<Payment>>('/payments', q),
  create: (body: { reservationId: number; amount: number; paymentMethod: PaymentMethod; status?: PaymentStatus }) =>
    post<PaymentWithBilling>('/payments', body),
  updateStatus: (id: number, status: PaymentStatus) => patch<PaymentWithBilling>(`/payments/${id}`, { status }),
};

// ---------------------------------------------------------------- guests
/** Public self-registration body (CreateGuestDto). There is no role field: the API always creates a GUEST. */
export interface GuestRegistration {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
}
export const guestsApi = {
  register: (body: GuestRegistration) => post<Guest>('/guests', body),
  list: (q?: Query) => get<Paginated<Guest>>('/guests', q),
  reservations: (id: number, q?: Query) => get<Paginated<Reservation>>(`/guests/${id}/reservations`, q),
  setStatus: (id: number, accountStatus: AccountStatus) => patch<Guest>(`/guests/${id}`, { accountStatus }),
  deactivate: (id: number) => del(`/guests/${id}`),
};

// ----------------------------------------------------------------- staff
export interface StaffInput {
  firstName: string;
  lastName: string;
  email: string;
  role: StaffRole;
  password: string;
}
export const staffApi = {
  list: (q?: Query) => get<Paginated<Staff>>('/staff', q),
  create: (body: StaffInput) => post<Staff>('/staff', body),
  update: (
    id: number,
    body: Partial<Omit<StaffInput, 'password'>> & { accountStatus?: AccountStatus; newPassword?: string },
  ) => patch<Staff>(`/staff/${id}`, body),
  deactivate: (id: number) => del(`/staff/${id}`),
};

// ---------------------------------------------------------- digital keys
export const digitalKeysApi = {
  list: (q?: Query) => get<Paginated<DigitalKey>>('/digital-keys', q),
  issue: (reservationId: number) => post<IssuedKey>('/digital-keys', { reservationId }),
  validate: (keyCode: string, roomId: number) => post<AccessDecision>('/digital-keys/validate', { keyCode, roomId }),
  revoke: (id: number) => patch<DigitalKey>(`/digital-keys/${id}/revoke`),
};

// ---------------------------------------------------------- housekeeping
export const housekeepingApi = {
  list: (q?: Query) => get<Paginated<Housekeeping>>('/housekeeping', q),
  create: (roomId: number, staffId: number) => post<Housekeeping>('/housekeeping', { roomId, staffId }),
  update: (id: number, body: { status?: HousekeepingStatus; staffId?: number }) =>
    patch<Housekeeping>(`/housekeeping/${id}`, body),
};

// -------------------------------------------------------- service orders
export const serviceOrdersApi = {
  list: (q?: Query) => get<Paginated<ServiceOrder>>('/service-orders', q),
  create: (body: { reservationId: number; itemCode: string; quantity: number; notes?: string }) =>
    post<ServiceOrder>('/service-orders', body),
  updateStatus: (id: number, status: ServiceOrderStatus) => patch<ServiceOrder>(`/service-orders/${id}`, { status }),
};
