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
export const suitedActions = [
  'hiss',
  'tail-spin',
  'double-treat',
  'skip',
  'rev',
  'd2',
  'discard',
  'd4',
  'skipall',
] as const;
export const wildActions = [
  'curious-cat',
  'catnap',
  'pounce',
  'wrd4',
  'wd6',
  'wd10',
  'roul',
] as const;
export type ActionName = (typeof suitedActions)[number] | (typeof wildActions)[number];
export type NumberCard = { id: number; suit: Suit; rank: number };
export type Card = NumberCard
  | { id: number; suit: Suit; action: (typeof suitedActions)[number] }
  | { id: number; suit: null; action: (typeof wildActions)[number] };
export type MatchMove =
  | { type: 'play'; cardId: number; suit?: Suit; targetSeatId?: string }
  | { type: 'draw'; deep?: true }
  | { type: 'pass' }
  | { type: 'call-uno' }
  | { type: 'roulette-color'; suit: Suit }
  | { type: 'respond-pounce'; choice: 'draw' | 'give' };
export type MatchAction = MatchMove | { type: 'start' | 'rematch' | 'return-lobby' };
export type MatchView = {
  discard: Card;
  activeSuit: Suit;
  direction: 1 | -1;
  drawCount: number;
  pendingDraw?: number;
  seats: { id: string; name: string; cardCount: number; forfeited: boolean; bot?: true; out?: boolean; uno?: boolean }[];
  hand: Card[];
  playableIds: number[];
  canDraw: boolean;
  canDeepDraw?: boolean;
  canPass: boolean;
  canCallUno?: boolean;
  roulette?: { actorSeatId: string; targetSeatId: string };
  pounce?: { actorSeatId: string; targetSeatId: string; canGive: boolean };
  turn: { seatId: string; deadline: number } | null;
  result: { winnerSeatId: string | null } | null;
  lastAction?:
    | { seatId: string; type: 'draw'; count?: number }
    | { seatId: string; type: 'pass' }
    | { seatId: string; type: 'play'; card: Card; targetSeatId?: string }
    | { seatId: string; type: 'call-uno' }
    | { seatId: string; type: 'roulette'; suit: Suit; drawnCount: number }
    | { seatId: string; type: 'pounce-response'; choice: 'draw' | 'give' | 'forfeit' };
  banner?: { items: { seatId: string; text: string }[] };
};

export const emoteIds = ['side-eye', 'shocked', 'shook', 'yapping', 'dancing', 'smug'] as const;
export type EmoteId = (typeof emoteIds)[number];

export type RoomCommand =
  | { type: 'enter'; name: string }
  | { type: 'resume'; token: string }
  | { type: 'lock'; locked: boolean }
  | { type: 'leave' }
  | { type: 'emote'; emote: EmoteId }
  | { type: 'add-bot' | 'remove-bot'; revision: number }
  | (MatchAction & { revision: number });

export type RoomEvent =
  | { type: 'session'; seatId: string; token: string; room: RoomView }
  | { type: 'room'; room: RoomView }
  | { type: 'error'; message: string }
  | { type: 'left' }
  | { type: 'emote'; seatId: string; emote: EmoteId; timestamp: number };

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
    case 'emote': {
      if (!('emote' in input) || typeof input.emote !== 'string') return null;
      const emote = emoteIds.find((candidate) => candidate === input.emote);
      return emote ? { type: 'emote', emote } : null;
    }
    case 'start':
    case 'rematch':
    case 'return-lobby':
    case 'draw':
    case 'pass':
    case 'add-bot':
    case 'remove-bot':
    case 'call-uno':
    case 'meow':
    case 'roulette-color':
    case 'respond-pounce':
    case 'play': {
      if (!('revision' in input) || typeof input.revision !== 'number' ||
        !Number.isSafeInteger(input.revision) || input.revision < 0) return null;
      if (input.type === 'call-uno' || input.type === 'meow') {
        return { type: 'call-uno', revision: input.revision };
      }
      if (input.type === 'roulette-color') {
        const suit = 'suit' in input ? suits.find((candidate) => candidate === input.suit) : undefined;
        return suit ? { type: 'roulette-color', suit, revision: input.revision } : null;
      }
      if (input.type === 'respond-pounce') {
        return 'choice' in input && (input.choice === 'draw' || input.choice === 'give')
          ? { type: input.type, choice: input.choice, revision: input.revision } : null;
      }
      if (input.type === 'draw' && 'deep' in input) {
        return input.deep === true ? { type: 'draw', deep: true, revision: input.revision } : null;
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
