const roomAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const roomCodePattern = /^[A-HJ-NP-Z2-9]{8}$/;

export const roomCapacity = 6;
export const displayNameLimit = 24;

export function normalizeRoomCode(input: string): string | null {
  const code = input.trim().toUpperCase();
  return roomCodePattern.test(code) ? code : null;
}

export function createRoomCode(): string {
  const random = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(random, (byte) => roomAlphabet[byte & 31]).join('');
}

export function normalizeDisplayName(input: string): string | null {
  const name = input.trim();
  return name && name.length <= displayNameLimit && !/[\u0000-\u001f\u007f]/u.test(name) ? name : null;
}

export type RoomView = {
  code: string;
  hostSeatId: string;
  locked: boolean;
  revision: number;
  players: { id: string; name: string; connected: boolean }[];
};

export type RoomCommand =
  | { type: 'enter'; name: string }
  | { type: 'resume'; token: string }
  | { type: 'lock'; locked: boolean }
  | { type: 'leave' };

export type RoomEvent =
  | { type: 'session'; seatId: string; token: string; room: RoomView }
  | { type: 'room'; room: RoomView }
  | { type: 'error'; message: string }
  | { type: 'left' };

export function parseRoomCommand(message: string | ArrayBuffer): RoomCommand | null {
  if (typeof message !== 'string' || message.length > 256) return null;
  let input: unknown;
  try {
    input = JSON.parse(message);
  } catch {
    return null;
  }

  if (!input || typeof input !== 'object' || !('type' in input)) return null;
  switch (input.type) {
    case 'enter': {
      const name = 'name' in input && typeof input.name === 'string' ? normalizeDisplayName(input.name) : null;
      return name ? { type: 'enter', name } : null;
    }
    case 'resume':
      return 'token' in input && typeof input.token === 'string' && /^[\da-f-]{36}$/i.test(input.token)
        ? { type: 'resume', token: input.token }
        : null;
    case 'lock':
      return 'locked' in input && typeof input.locked === 'boolean' ? { type: 'lock', locked: input.locked } : null;
    case 'leave':
      return { type: 'leave' };
    default:
      return null;
  }
}
