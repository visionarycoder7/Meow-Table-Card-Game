const roomAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const roomCodePattern = /^[A-HJ-NP-Z2-9]{8}$/;

export const roomCapacity = 6;
export const displayNameLimit = 24;
export const seatReplacedCode = 4000;
export const seatExpiredCode = 4001;

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
  matchRevision?: number;
  serverTime: number;
  players: { id: string; name: string; connected: boolean; bot?: true }[];
  match?: MatchView;
};

export const suits = ['PAW', 'BELL', 'NIP', 'FISH'] as const;
export type Suit = (typeof suits)[number];
export const suitedActions = ['hiss', 'tail-spin', 'double-treat'] as const;
export const wildActions = ['curious-cat', 'catnap', 'pounce'] as const;
export type ActionName = (typeof suitedActions)[number] | (typeof wildActions)[number];
export type NumberCard = { id: number; suit: Suit; rank: number };
export type Card = NumberCard
  | { id: number; suit: Suit; action: (typeof suitedActions)[number] }
  | { id: number; suit: null; action: (typeof wildActions)[number] };
export type MatchMove = { type: 'play'; cardId: number; suit?: Suit; targetSeatId?: string }
  | { type: 'draw' | 'pass' }
  | { type: 'respond-pounce'; choice: 'draw' | 'give' };
export type MatchAction = MatchMove | { type: 'start' | 'rematch' | 'return-lobby' };
export type MatchView = {
  discard: Card;
  activeSuit: Suit;
  direction: 1 | -1;
  drawCount: number;
  seats: { id: string; name: string; cardCount: number; forfeited: boolean; bot?: true }[];
  hand: Card[];
  playableIds: number[];
  canDraw: boolean;
  canPass: boolean;
  pounce?: { actorSeatId: string; targetSeatId: string; canGive: boolean };
  turn: { seatId: string; deadline: number } | null;
  result: { winnerSeatId: string | null } | null;
  lastAction?: { seatId: string; type: 'draw' } | { seatId: string; type: 'pass' } | { seatId: string; type: 'play'; card: Card }
    | { seatId: string; type: 'pounce-response'; choice: 'draw' | 'give' | 'forfeit' };
};

export type RoomCommand =
  | { type: 'enter'; name: string }
  | { type: 'resume'; token: string }
  | { type: 'lock'; locked: boolean }
  | { type: 'leave' }
  | { type: 'add-bot' | 'remove-bot'; revision: number }
  | (MatchAction & { revision: number });

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
    case 'start':
    case 'rematch':
    case 'return-lobby':
    case 'draw':
    case 'pass':
    case 'add-bot':
    case 'remove-bot':
    case 'respond-pounce':
    case 'play': {
      if (!('revision' in input) || typeof input.revision !== 'number' ||
        !Number.isSafeInteger(input.revision) || input.revision < 0) return null;
      if (input.type === 'respond-pounce') {
        return 'choice' in input && (input.choice === 'draw' || input.choice === 'give')
          ? { type: input.type, choice: input.choice, revision: input.revision } : null;
      }
      if (input.type !== 'play') return { type: input.type, revision: input.revision };
      if (!('cardId' in input) || typeof input.cardId !== 'number' ||
        !Number.isSafeInteger(input.cardId) || input.cardId < 0) return null;
      const suit = 'suit' in input ? suits.find((candidate) => candidate === input.suit) : undefined;
      if ('suit' in input && !suit) return null;
      const targetSeatId = 'targetSeatId' in input ? input.targetSeatId : undefined;
      if (targetSeatId !== undefined && (typeof targetSeatId !== 'string' || !/^[\da-f-]{36}$/i.test(targetSeatId))) return null;
      return { type: 'play', cardId: input.cardId, revision: input.revision, suit, targetSeatId };
    }
    default:
      return null;
  }
}
