/**
 * Date helpers. Reservation dates are calendar dates (YYYY-MM-DD) stored in
 * MySQL DATE columns and compared as strings, which sort correctly.
 * "Today" is the hotel's local date (the server's local time zone).
 */

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayDateString(): string {
  return toDateString(new Date());
}

/** Parses YYYY-MM-DD as a local calendar date. */
export function parseDateString(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Number of nights between check-in and check-out (half-open range). */
export function nightsBetween(checkInDate: string, checkOutDate: string): number {
  const ms = parseDateString(checkOutDate).getTime() - parseDateString(checkInDate).getTime();
  return Math.round(ms / 86_400_000);
}

/** True when the string is a real calendar date in YYYY-MM-DD format. */
export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toDateString(parseDateString(value)) === value;
}

/** Hotel standard check-out time, used as the digital key expiry. */
export const CHECK_OUT_HOUR = 12;

export function checkOutDeadline(checkOutDate: string): Date {
  const deadline = parseDateString(checkOutDate);
  deadline.setHours(CHECK_OUT_HOUR, 0, 0, 0);
  return deadline;
}
