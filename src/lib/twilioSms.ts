import { getCoordinatesForArea } from '@/data/locations';

export const TWILIO_CONFIG = {
  accountSid: (import.meta as any).env?.VITE_TWILIO_ACCOUNT_SID || '',
  authToken: (import.meta as any).env?.VITE_TWILIO_AUTH_TOKEN || '',
  messagingServiceSid: (import.meta as any).env?.VITE_TWILIO_MESSAGING_SERVICE_SID || '',
  adminPhone: '+918431591698',
};

/**
 * Normalizes phone numbers to standard E.164 international format (+91 for India by default).
 */
export function formatE164(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith('+')) {
    return '+' + trimmed.replace(/\D/g, '');
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `+91${digits.slice(1)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  return `+91${digits}`;
}

export interface SmsSendResult {
  success: boolean;
  sid?: string;
  error?: string;
}

/**
 * Sends a single SMS via the local/Vercel `/api/send-sms` relay.
 */
export async function sendTwilioSms(to: string, body: string): Promise<SmsSendResult> {
  const formattedTo = formatE164(to);
  try {
    const res = await fetch('/api/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedTo,
        body,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && (data.sid || data.status === 'accepted' || data.status === 'queued')) {
      return { success: true, sid: data.sid };
    }

    // Direct fallback if API route is unavailable
    if (!res.ok && (res.status === 404 || res.status === 405)) {
      return await sendDirectTwilioFallback(formattedTo, body);
    }

    return {
      success: false,
      error: data.message || data.error || `HTTP ${res.status}`,
    };
  } catch (err: unknown) {
    // If local proxy isn't reached, try direct fallback
    return await sendDirectTwilioFallback(formattedTo, body).catch(() => ({
      success: false,
      error: err instanceof Error ? err.message : 'Network error',
    }));
  }
}

/**
 * Direct browser fallback to Twilio API
 */
async function sendDirectTwilioFallback(to: string, body: string): Promise<SmsSendResult> {
  const { accountSid, authToken, messagingServiceSid } = TWILIO_CONFIG;
  const postData = new URLSearchParams({
    To: to,
    MessagingServiceSid: messagingServiceSid,
    Body: body,
  }).toString();

  const authHeader = 'Basic ' + btoa(`${accountSid}:${authToken}`);
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: postData,
  });

  const data = await res.json().catch(() => ({}));
  if (res.ok && (data.sid || data.status === 'accepted' || data.status === 'queued')) {
    return { success: true, sid: data.sid };
  }
  return { success: false, error: data.message || 'Direct call failed' };
}

export interface DispatchAlertParams {
  requestId: string;
  patientName: string;
  patientPhone: string;
  pickupArea: string;
  pickupNote?: string;
  coords?: { lat: number; lng: number };
  serviceType?: string;
  category?: string;
}

export interface DispatchAlertResult {
  userSent: boolean;
  adminSent: boolean;
  userPhone: string;
  adminPhone: string;
  mapLink: string;
  userSid?: string;
  adminSid?: string;
  error?: string;
  isTrialRestricted?: boolean;
}

/**
 * Sends SMS alerts to both the user and the central admin when an ambulance is requested.
 */
export async function sendDispatchSmsAlerts(params: DispatchAlertParams): Promise<DispatchAlertResult> {
  const areaCoords = params.coords || getCoordinatesForArea(params.pickupArea);
  const lat = areaCoords.lat.toFixed(4);
  const lng = areaCoords.lng.toFixed(4);
  const mapLink = `https://www.google.com/maps?q=${lat},${lng}`;

  const userPhone = formatE164(params.patientPhone);
  const adminPhone = TWILIO_CONFIG.adminPhone;
  const isDifferentNumber = userPhone !== adminPhone;

  // 1. Message to the patient / caller (pure GSM-7 ASCII text to ensure instant delivery without carrier DLT filtering)
  const userBody = `Pranrath Ambulance is coming to your location: ${mapLink} (${params.pickupArea}). Ref ID: ${params.requestId}. Emergency crew is en route.`;

  // 2. Message to Central Admin (8431591698)
  const adminBody = `[PRANRATH DISPATCH ALERT] Ref: ${params.requestId}. Patient: ${params.patientName} (${params.patientPhone}). Location: ${params.pickupArea} (${params.pickupNote || 'No landmark'}). Service: ${params.serviceType || 'Emergency'} (${params.category || 'BLS'}). Google Maps: ${mapLink}. Status: DISPATCHED.`;

  const promises: Promise<SmsSendResult>[] = [
    sendTwilioSms(userPhone, userBody),
    sendTwilioSms(adminPhone, adminBody),
  ];

  // If testing with a phone number that is not yet verified on Twilio Trial account,
  // also send a copy of the Patient Confirmation SMS to the verified admin number (+918431591698)
  if (isDifferentNumber) {
    const copyBody = `[PATIENT SMS COPY for ${userPhone}] ${userBody}`;
    promises.push(sendTwilioSms(adminPhone, copyBody));
  }

  const results = await Promise.allSettled(promises);

  const userRes = results[0];
  const adminRes = results[1];

  const userSuccess = userRes.status === 'fulfilled' && userRes.value.success;
  const adminSuccess = adminRes.status === 'fulfilled' && adminRes.value.success;

  const userSid = userRes.status === 'fulfilled' ? userRes.value.sid : undefined;
  const adminSid = adminRes.status === 'fulfilled' ? adminRes.value.sid : undefined;

  return {
    userSent: userSuccess,
    adminSent: adminSuccess,
    userPhone,
    adminPhone,
    mapLink,
    userSid,
    adminSid,
    isTrialRestricted: isDifferentNumber,
  };
}
