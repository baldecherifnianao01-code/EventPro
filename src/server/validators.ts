const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MOROCCO_PHONE_REGEX = /^(?:\+212|00212|0)[5-7]\d{8}$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;

export function cleanText(value: unknown, maxLength = 500): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim().toLowerCase()) && email.length <= 180;
}

export function normalizeMoroccanPhone(raw: string): string {
  return raw.replace(/[\s\-().]/g, '');
}

export function isValidMoroccanPhone(raw: string): boolean {
  const normalized = normalizeMoroccanPhone(raw);
  return MOROCCO_PHONE_REGEX.test(normalized);
}

export function isValidIsoDate(dateStr: string): boolean {
  if (!ISO_DATE_REGEX.test(dateStr)) return false;
  const parsed = new Date(`${dateStr}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime());
}

export function isValidTime(timeStr: string): boolean {
  if (!TIME_REGEX.test(timeStr)) return false;
  const [h, m] = timeStr.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

export function isPositiveNumber(val: unknown, min = 0, max = 100000000): boolean {
  return typeof val === 'number' && Number.isFinite(val) && val >= min && val <= max;
}

export function isSafeMediaUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/src/assets/') || trimmed.startsWith('/assets/')) {
    return !trimmed.includes('..');
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function validateAttachmentDataUrl(
  dataUrl: unknown,
  fileName: unknown
): { valid: boolean; name: string | null; dataUrl: string | null; error?: string } {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return { valid: true, name: null, dataUrl: null };
  }
  const allowedPrefixes = [
    'data:image/jpeg;base64,',
    'data:image/png;base64,',
    'data:image/webp;base64,',
    'data:application/pdf;base64,',
  ];
  const matched = allowedPrefixes.some((prefix) => dataUrl.startsWith(prefix));
  if (!matched) {
    return {
      valid: false,
      name: null,
      dataUrl: null,
      error: 'Format de fichier non autorisé (JPEG, PNG, WEBP ou PDF uniquement).',
    };
  }
  // Cap ~2 MB binary (~2.8 MB base64)
  if (dataUrl.length > 2_900_000) {
    return {
      valid: false,
      name: null,
      dataUrl: null,
      error: 'Le fichier joint dépasse la taille maximale autorisée (2 Mo).',
    };
  }
  const cleanName = cleanText(fileName, 120).replace(/[^a-zA-Z0-9._\-\s]/g, '_') || 'document';
  return { valid: true, name: cleanName, dataUrl };
}
