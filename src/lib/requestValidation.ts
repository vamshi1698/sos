export interface RequestDraft {
  pickupArea: string;
  pickupNote: string;
  patientName: string;
  patientPhone: string;
  patientAge: string;
  description: string;
  category: 'BLS' | 'ALS' | 'Patient Transport';
  serviceType?: string;
  coords?: { lat: number; lng: number };
}

export type DraftErrors = Partial<Record<keyof RequestDraft, string>>;

/**
 * Strips HTML tags and script injection from raw input.
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // remove HTML tags
    .replace(/[<>'"]/g, '')
    .trim();
}

/**
 * Sanitizes phone numbers on input:
 * - Allows leading '+' then numbers and spaces.
 * - Caps maximum digits to 10 (or 12 with 91 country code).
 * - Prevents arbitrary string explosion (e.g. 24 digits like 512521251512515125151511).
 * - Formats neatly as "+91 XXXXX XXXXX" or "XXXXX XXXXX".
 */
export function sanitizePhone(input: string): string {
  const hasPlus = input.trim().startsWith('+');
  const digitsOnly = input.replace(/\D/g, '');

  if (hasPlus || digitsOnly.startsWith('91')) {
    // International / +91 format
    const capped = digitsOnly.slice(0, 12);
    if (capped.startsWith('91')) {
      const national = capped.slice(2);
      if (national.length > 5) {
        return `+91 ${national.slice(0, 5)} ${national.slice(5)}`;
      }
      return national ? `+91 ${national}` : '+91 ';
    }
    return `+${capped}`;
  }

  // 10-digit Indian local mobile number
  const capped = digitsOnly.slice(0, 10);
  if (capped.length > 5) {
    return `${capped.slice(0, 5)} ${capped.slice(5)}`;
  }
  return capped;
}

/**
 * Sanitizes patient name:
 * - Only alphabetic characters, spaces, dots, and hyphens.
 * - Caps length at 50 characters.
 */
export function sanitizeName(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[^a-zA-Z\s.-]/g, '')
    .slice(0, 50);
}

/**
 * Sanitizes age input:
 * - Only numeric digits 0-9.
 * - Maximum 3 digits (0 to 120).
 */
export function sanitizeAge(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 3);
  if (!digits) return '';
  const num = parseInt(digits, 10);
  if (num > 120) return '120';
  return digits;
}

/**
 * Sanitizes multi-line text areas (landmarks, descriptions):
 * - Strips HTML tags, trims excessive spaces, caps length.
 */
export function sanitizeText(input: string, maxLength = 300): string {
  return input
    .replace(/<[^>]*>/g, '')
    .slice(0, maxLength);
}

export function validateLocation(draft: RequestDraft): DraftErrors {
  const errors: DraftErrors = {};
  if (!draft.pickupArea) {
    errors.pickupArea = 'Choose the area closest to the patient.';
  }
  const cleanNote = draft.pickupNote.trim();
  if (cleanNote.length < 5) {
    errors.pickupNote = 'Add a landmark or street (min 5 characters) so crew can navigate to the patient.';
  }
  return errors;
}

export function validatePatient(draft: RequestDraft): DraftErrors {
  const errors: DraftErrors = {};

  // Patient name validation
  const nameClean = draft.patientName.trim();
  if (nameClean && nameClean !== 'Unknown Patient') {
    if (nameClean.length < 2) {
      errors.patientName = 'Name must be at least 2 characters, or click Unknown.';
    } else if (!/^[a-zA-Z\s.-]+$/.test(nameClean)) {
      errors.patientName = 'Name should only contain letters, spaces, or dots.';
    }
  }

  // Contact phone validation
  const digits = draft.patientPhone.replace(/\D/g, '');
  let nationalDigits = digits;
  if (digits.startsWith('91') && digits.length === 12) {
    nationalDigits = digits.slice(2);
  } else if (digits.startsWith('0') && digits.length === 11) {
    nationalDigits = digits.slice(1);
  }

  if (nationalDigits.length !== 10) {
    errors.patientPhone = 'Please enter a valid 10-digit mobile number.';
  } else if (!/^[6-9]/.test(nationalDigits)) {
    errors.patientPhone = 'Indian mobile numbers start with 6, 7, 8, or 9.';
  }

  // Age validation
  if (draft.patientAge) {
    const ageNum = Number(draft.patientAge);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
      errors.patientAge = 'Enter a valid age between 0 and 120.';
    }
  }

  // Description validation
  if (draft.description.trim().length < 5) {
    errors.description = 'Please describe the patient symptoms or emergency (min 5 characters).';
  }

  return errors;
}
