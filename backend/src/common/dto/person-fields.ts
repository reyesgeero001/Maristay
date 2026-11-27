/** Shared validation patterns for people's names and phone numbers. */
export const NAME_REGEX = /^[\p{L}][\p{L} .'-]*$/u;
export const NAME_MESSAGE = 'may only contain letters, spaces, periods, apostrophes and hyphens';
/** Digits with optional leading +, 7–15 digits (e.g. 09171234567 or +639171234567). */
export const PHONE_REGEX = /^\+?\d{7,15}$/;
export const PHONE_MESSAGE = 'phoneNumber must contain 7–15 digits and may start with +';
