import nodemailer from 'nodemailer';
import { logError } from '../utils/logger.js';

const FILE = 'services/emailService.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_APP_PASSWORD
  }
});

async function send(to, subject, text) {
  try {
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_APP_PASSWORD) {
      console.log(`[INFO] file=${FILE} message=SMTP not configured, skipping email to ${to}: ${subject}`);
      return;
    }
    await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to,
      subject,
      text
    });
  } catch (error) {
    logError(FILE, error);
  }
}

export function sendOtpEmail(to, otp) {
  return send(to, 'CarryMate - Email Verification OTP', `Your OTP is ${otp}. It expires in 10 minutes.`);
}

export function sendRegistrationCompletedEmail(to, name) {
  return send(to, 'CarryMate - Registration Completed', `Hi ${name}, your CarryMate account is ready.`);
}

export function sendRequestAcceptedEmail(to, itemName) {
  return send(to, 'CarryMate - Request Accepted', `Your request for "${itemName}" has been accepted by a traveller.`);
}

export function sendRequestRejectedEmail(to, itemName) {
  return send(to, 'CarryMate - Request Rejected', `Your request for "${itemName}" was rejected by a traveller.`);
}

export function sendDeliveryCompletedEmail(to, itemName) {
  return send(to, 'CarryMate - Delivery Completed', `The delivery for "${itemName}" has been marked as completed.`);
}
