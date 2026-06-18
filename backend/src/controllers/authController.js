import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { signToken } from '../utils/jwt.js';
import { isValidNitEmail, isValidPhone } from '../utils/validators.js';
import {
  canSendOtp,
  recordOtpSend,
  generateOtp,
  setPendingRegistration,
  getPendingRegistration,
  deletePendingRegistration
} from '../utils/otpStore.js';
import { sendOtpEmail, sendRegistrationCompletedEmail } from '../services/emailService.js';
import { sendOtpSms } from '../services/smsService.js';

const FILE = 'controllers/authController.js';
const BCRYPT_ROUNDS = 10;

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

export async function registerStart(req, res, next) {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      throw new AppError('name, email, phone and password are required', 400, FILE);
    }
    if (!isValidNitEmail(email)) {
      throw new AppError('Only @nitdgp.ac.in emails are allowed', 400, FILE);
    }
    if (!isValidPhone(phone)) {
      throw new AppError('Invalid phone number format', 400, FILE);
    }
    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400, FILE);
    }
    if (!canSendOtp(email) || !canSendOtp(phone)) {
      throw new AppError('OTP rate limit exceeded. Max 3/hour, 10/day.', 429, FILE);
    }

    const { data: existing, error: lookupError } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},phone.eq.${phone}`);

    if (lookupError) throw new AppError(lookupError.message, 500, FILE);
    if (existing && existing.length > 0) {
      throw new AppError('A user with this email or phone already exists', 409, FILE);
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const emailOtp = generateOtp();
    const smsOtp = generateOtp();

    setPendingRegistration(email, {
      name,
      email,
      phone,
      passwordHash,
      emailOtp,
      smsOtp,
      emailVerified: false,
      smsVerified: false,
      createdAt: Date.now()
    });

    recordOtpSend(email);
    recordOtpSend(phone);

    await sendOtpEmail(email, emailOtp);
    await sendOtpSms(phone, smsOtp);

    res.json({ message: 'OTP sent to email and phone' });
  } catch (error) {
    next(error.isAppError ? error : new AppError(error.message, 500, FILE));
  }
}

async function finalizeRegistrationIfReady(email) {
  const pending = getPendingRegistration(email);
  if (!pending) {
    throw new AppError('No pending registration found for this email', 400, FILE);
  }
  if (!pending.emailVerified || !pending.smsVerified) {
    return { complete: false };
  }

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      name: pending.name,
      email: pending.email,
      phone: pending.phone,
      password_hash: pending.passwordHash
    })
    .select()
    .single();

  if (error) throw new AppError(error.message, 500, FILE);

  deletePendingRegistration(email);
  await sendRegistrationCompletedEmail(user.email, user.name);

  const token = signToken({ id: user.id, email: user.email });
  return { complete: true, token, user: sanitizeUser(user) };
}

export async function verifyEmailOtp(req, res, next) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) throw new AppError('email and otp are required', 400, FILE);

    const pending = getPendingRegistration(email);
    if (!pending) throw new AppError('No pending registration found for this email', 400, FILE);
    if (pending.emailOtp !== otp) throw new AppError('Invalid email OTP', 400, FILE);

    pending.emailVerified = true;
    setPendingRegistration(email, pending);

    const result = await finalizeRegistrationIfReady(email);
    if (result.complete) return res.json(result);
    res.json({ message: 'Email verified. Waiting for SMS OTP verification.' });
  } catch (error) {
    next(error.isAppError ? error : new AppError(error.message, 500, FILE));
  }
}

export async function verifySmsOtp(req, res, next) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) throw new AppError('email and otp are required', 400, FILE);

    const pending = getPendingRegistration(email);
    if (!pending) throw new AppError('No pending registration found for this email', 400, FILE);
    if (pending.smsOtp !== otp) throw new AppError('Invalid SMS OTP', 400, FILE);

    pending.smsVerified = true;
    setPendingRegistration(email, pending);

    const result = await finalizeRegistrationIfReady(email);
    if (result.complete) return res.json(result);
    res.json({ message: 'Phone verified. Waiting for email OTP verification.' });
  } catch (error) {
    next(error.isAppError ? error : new AppError(error.message, 500, FILE));
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError('email and password are required', 400, FILE);

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) throw new AppError('Invalid email or password', 401, FILE);

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) throw new AppError('Invalid email or password', 401, FILE);

    const token = signToken({ id: user.id, email: user.email });
    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    next(error.isAppError ? error : new AppError(error.message, 500, FILE));
  }
}

export async function googleLogin(req, res, next) {
  try {
    const { idToken } = req.body;
    if (!idToken) throw new AppError('idToken is required', 400, FILE);

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name || email.split('@')[0];

    if (!isValidNitEmail(email)) {
      throw new AppError('Only @nitdgp.ac.in emails are allowed', 403, FILE);
    }

    let { data: user } = await supabase.from('users').select('*').eq('email', email).single();

    if (!user) {
      const placeholderPhone = `google-${uuidv4()}`;
      const randomPasswordHash = await bcrypt.hash(uuidv4(), BCRYPT_ROUNDS);
      const { data: created, error: createError } = await supabase
        .from('users')
        .insert({ name, email, phone: placeholderPhone, password_hash: randomPasswordHash })
        .select()
        .single();
      if (createError) throw new AppError(createError.message, 500, FILE);
      user = created;
      await sendRegistrationCompletedEmail(user.email, user.name);
    }

    const token = signToken({ id: user.id, email: user.email });
    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    next(error.isAppError ? error : new AppError(error.message, 500, FILE));
  }
}

export async function logout(req, res) {
  res.json({ message: 'Logged out successfully' });
}
