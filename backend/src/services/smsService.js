import twilio from 'twilio';
import { logError } from '../utils/logger.js';

const FILE = 'services/smsService.js';

function getClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return null;
  }
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

async function send(to, body) {
  try {
    const client = getClient();
    if (!client) {
      console.log(`[INFO] file=${FILE} message=Twilio not configured, skipping SMS to ${to}: ${body}`);
      return;
    }
    await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });
  } catch (error) {
    logError(FILE, error);
  }
}

export function sendOtpSms(to, otp) {
  return send(to, `CarryMate OTP: ${otp}. Expires in 10 minutes.`);
}

export function sendRequestAcceptedSms(to, itemName) {
  return send(to, `CarryMate: Your request for "${itemName}" was accepted.`);
}

export function sendRequestRejectedSms(to, itemName) {
  return send(to, `CarryMate: Your request for "${itemName}" was rejected.`);
}

export function sendDeliveryCompletedSms(to, itemName) {
  return send(to, `CarryMate: Delivery for "${itemName}" marked completed.`);
}
