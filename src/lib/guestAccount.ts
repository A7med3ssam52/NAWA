export const GUEST_ACCOUNT_STORAGE_KEY = 'zahieg_guest_account';

export interface GuestAccountCredentials {
  email: string;
  password: string;
  activated: boolean;
}

export function generateTemporaryPassword(length = 12): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*';
  const all = upper + lower + digits + symbols;
  const randomIndex = (max: number) =>
    crypto.getRandomValues(new Uint32Array(1))[0] % max;

  const chars = [upper[randomIndex(upper.length)], lower[randomIndex(lower.length)], digits[randomIndex(digits.length)], symbols[randomIndex(symbols.length)]];
  while (chars.length < length) {
    chars.push(all[randomIndex(all.length)]);
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export function saveGuestCredentials(credentials: GuestAccountCredentials) {
  sessionStorage.setItem(GUEST_ACCOUNT_STORAGE_KEY, JSON.stringify(credentials));
}

export function readGuestCredentials(): GuestAccountCredentials | null {
  try {
    const raw = sessionStorage.getItem(GUEST_ACCOUNT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestAccountCredentials;
    if (!parsed?.email || !parsed?.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearGuestCredentials() {
  sessionStorage.removeItem(GUEST_ACCOUNT_STORAGE_KEY);
}