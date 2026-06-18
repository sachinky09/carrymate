const NIT_EMAIL_DOMAIN = '@nitdgp.ac.in';
const NIT_DURGAPUR = 'NIT Durgapur';

export function isValidNitEmail(email) {
  return typeof email === 'string' && email.toLowerCase().endsWith(NIT_EMAIL_DOMAIN);
}

export function isValidPhone(phone) {
  // E.164-ish: optional +, 10-15 digits
  return typeof phone === 'string' && /^\+?[0-9]{10,15}$/.test(phone);
}

export function isPositiveNumber(value) {
  const n = Number(value);
  return !Number.isNaN(n) && n > 0;
}

export function isNonNegativeNumber(value) {
  const n = Number(value);
  return !Number.isNaN(n) && n >= 0;
}

export function involvesNitDurgapur(source, destination) {
  if (!source || !destination) return false;
  const s = source.trim().toLowerCase();
  const d = destination.trim().toLowerCase();
  const nit = NIT_DURGAPUR.toLowerCase();
  return s === nit || d === nit;
}

export function isValidDateString(value) {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}
