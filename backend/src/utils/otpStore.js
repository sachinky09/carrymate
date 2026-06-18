// Simple in-memory store. A user row is only created once both OTPs succeed,
// so pending registrations and OTP codes live here until then.

const pendingRegistrations = new Map(); // key: email -> registration data
const otpSendLog = new Map(); // key: email or phone -> array of timestamps

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MAX_PER_HOUR = 3;
const MAX_PER_DAY = 10;

export function canSendOtp(identifier) {
  const now = Date.now();
  const log = otpSendLog.get(identifier) || [];
  const recentHour = log.filter((t) => now - t < HOUR_MS);
  const recentDay = log.filter((t) => now - t < DAY_MS);
  if (recentHour.length >= MAX_PER_HOUR) return false;
  if (recentDay.length >= MAX_PER_DAY) return false;
  return true;
}

export function recordOtpSend(identifier) {
  const now = Date.now();
  const log = otpSendLog.get(identifier) || [];
  log.push(now);
  otpSendLog.set(identifier, log.filter((t) => now - t < DAY_MS));
}

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function setPendingRegistration(email, data) {
  pendingRegistrations.set(email, data);
}

export function getPendingRegistration(email) {
  return pendingRegistrations.get(email);
}

export function deletePendingRegistration(email) {
  pendingRegistrations.delete(email);
}
