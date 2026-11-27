import { Transform } from 'class-transformer';

/** Case normalization: "Available" / "available" -> "AVAILABLE". */
export const ToUpperCase = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value));

/** "deluxe" / "DELUXE" -> "Deluxe" (used for room and service types). */
export const ToTitleCase = () =>
  Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim().charAt(0).toUpperCase() + value.trim().slice(1).toLowerCase()
      : value,
  );

export const Trim = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

export const ToLowerCaseTrim = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value));
