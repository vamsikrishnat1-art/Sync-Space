/**
 * Generates a unique collision-resistant, human-readable room code.
 * Format: SYNC-XXXXX (e.g., SYNC-7K4P2)
 */
export function generateRoomCode(): string {
  // Use characters that avoid ambiguous visual pairs (no 0/O, 1/I)
  const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  const cryptoObj = typeof window !== 'undefined' && window.crypto ? window.crypto : null;

  if (cryptoObj && cryptoObj.getRandomValues) {
    const values = new Uint32Array(5);
    cryptoObj.getRandomValues(values);
    for (let i = 0; i < 5; i++) {
      code += charset[values[i] % charset.length];
    }
  } else {
    for (let i = 0; i < 5; i++) {
      code += charset[Math.floor(Math.random() * charset.length)];
    }
  }

  return `SYNC-${code}`;
}

/**
 * Normalizes input room code (uppercases and cleans whitespace).
 */
export function sanitizeRoomCode(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.toUpperCase().startsWith('SYNC-')) {
    return trimmed.toUpperCase();
  }
  // If user entered short alphanumeric code like 7K4P2, prefix with SYNC-
  if (/^[A-Za-z0-9]{4,8}$/.test(trimmed) && !trimmed.includes('-')) {
    return `SYNC-${trimmed.toUpperCase()}`;
  }
  return trimmed;
}
