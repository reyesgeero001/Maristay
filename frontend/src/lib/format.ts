import type { Role } from '../api/types';

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
export const money = (n: number | string | null | undefined) => peso.format(Number(n ?? 0));

export const dateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

/** YYYY-MM-DD in the browser's local time zone (matches the backend's local-date rule). */
export function localDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const nightsBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

export const ROLE_LABEL: Record<Role, string> = {
  GUEST: 'Guest',
  FRONT_DESK: 'Front Desk',
  HOUSEKEEPING: 'Housekeeping',
  MANAGER: 'Manager',
};

export const label = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
