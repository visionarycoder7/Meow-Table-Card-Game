import { suitedActions, suits, wildActions } from '@meow-table/protocol';
import type { Card, MatchMove, MatchView, Suit } from '@meow-table/protocol';
import { chooseBotMove, strongestSuit } from './bot.ts';

type SeatIdentity = { id: string; name: string; bot?: true };
type MatchSeat = SeatIdentity & { hand: Card[]; forfeitedCount?: number };
const botTurnDelay = 900;
export type Match = {
  seats: MatchSeat[];
  openingSeatId: string;
  drawPile: Card[];
  discards: Card[];
  turn: { seatId: string; deadline: number; drawnCardId?: number } | null;
  result: MatchView['result'];
  lastAction?: MatchView['lastAction'];
  direction?: 1 | -1;
  wildSuit?: Suit;
  pounce?: { actorSeatId: string; targetSeatId: string };
};

function shuffle(cards: Card[]) {
  for (let index = cards.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [cards[index], cards[other]] = [cards[other], cards[index]];
  }
  return cards;
}

export function makeDeck(withActions = false): Card[] {
  const cards: Card[] = [];
  for (const suit of suits) {
    for (let rank = 0; rank <= 9; rank++) {
      cards.push({ id: cards.length, suit, rank });
      if (rank > 0) cards.push({ id: cards.length, suit, rank });
    }
  }
  if (withActions) {
    for (const suit of suits) {
      for (const action of suitedActions) {
        for (let copy = 0; copy < 2; copy++) cards.push({ id: cards.length, suit, action });
      }
    }
    for (const action of wildActions) {
      for (let copy = 0; copy < 4; copy++) cards.push({ id: cards.length, suit: null, action });
    }
  }
  return cards;
}

export function startMatch(seats: SeatIdentity[], openingSeatId: string, now: number,
  deck = shuffle(makeDeck(true))): Match {
  const drawPile = [...deck];
  const dealt = seats.map(({ id, name, bot }) => ({ id, name, bot, hand: drawPile.splice(0, 7) }));
  const openingIndex = drawPile.findIndex((card) => 'rank' in card);
  const match: Match = {
    seats: dealt,
    openingSeatId,
    drawPile,
    discards: drawPile.splice(openingIndex, 1),
    direction: 1,
    turn: null,
    result: null,
  };
  beginTurn(match, openingSeatId, now);
  return match;
}

export function rematchOpener(previous: Match, connected: { id: string }[]): string {
  const start = previous.seats.findIndex(({ id }) => id === previous.openingSeatId);
  const following = [...previous.seats.slice(start + 1), ...previous.seats.slice(0, start + 1)];
  return following.find((seat) => connected.some(({ id }) => id === seat.id))?.id ?? connected[0].id;
}

function top(match: Match) {
  return match.discards.at(-1)!;
}

function activeSuit(match: Match): Suit {
  return top(match).suit ?? match.wildSuit ?? suits[0];
}

function matches(match: Match, card: Card) {
  const discard = top(match);
  return card.suit === null || card.suit === activeSuit(match) ||
    ('rank' in card && 'rank' in discard && card.rank === discard.rank) ||
    ('action' in card && 'action' in discard && card.action === discard.action);
}

function hasDraw(match: Match) {
  return match.drawPile.length > 0 || match.discards.length > 1;
}

function finish(match: Match, winnerSeatId: string | null) {
  match.turn = null;
  match.result = { winnerSeatId };
  delete match.pounce;
}

function seatsFrom(match: Match, seatId: string, offset = 0) {
  const length = match.seats.length;
  const start = match.seats.findIndex(({ id }) => id === seatId);
  const direction = match.direction ?? 1;
  return Array.from({ length }, (_, index) =>
    match.seats[(start + (offset + index) * direction + 2 * length) % length])
    .filter(({ forfeitedCount }) => forfeitedCount === undefined);
}

function beginTurn(match: Match, nextSeatId: string, now: number) {
  const seat = seatsFrom(match, nextSeatId).find((candidate) =>
    hasDraw(match) || candidate.hand.some((card) => matches(match, card)));
  if (seat) match.turn = { seatId: seat.id, deadline: now + (seat.bot ? botTurnDelay : 30_000) };
  else finish(match, null);
}

function advance(match: Match, fromSeatId: string, now: number, skip = false) {
  const order = seatsFrom(match, fromSeatId, 1);
  beginTurn(match, (order[skip ? 1 : 0] ?? order[0]).id, now);
}

function takeCards(match: Match, seat: MatchSeat, count: number) {
  for (let draw = 0; draw < count && hasDraw(match); draw++) {
    if (!match.drawPile.length) {
      match.drawPile = shuffle(match.discards.splice(0, match.discards.length - 1));
    }
    seat.hand.push(match.drawPile.shift()!);
  }
}

function resolvePlay(match: Match, seat: MatchSeat, now: number, skip = false) {
  if (seat.hand.length === 0) finish(match, seat.id);
  else advance(match, seat.id, now, skip);
}

function resolvePounce(match: Match, choice: 'draw' | 'give' | 'forfeit', now: number) {
  const pending = match.pounce!;
  const actor = match.seats.find(({ id }) => id === pending.actorSeatId)!;
  const target = match.seats.find(({ id }) => id === pending.targetSeatId)!;
  if (choice === 'give') actor.hand.push(...target.hand.splice(Math.floor(Math.random() * target.hand.length), 1));
  if (choice === 'draw') takeCards(match, target, 2);
  delete match.pounce;
  match.lastAction = { type: 'pounce-response', seatId: target.id, choice };
  resolvePlay(match, actor, now);
}

export function applyTurn(match: Match, seatId: string, move: MatchMove, now: number): string | null {
  const turn = match.turn;
  if (!turn || turn.seatId !== seatId) return 'It is not your turn.';
  const seat = match.seats.find(({ id }) => id === seatId)!;

  if (match.pounce) {
    if (move.type !== 'respond-pounce') return 'Choose a Pounce response first.';
    if (move.choice === 'give' && seat.hand.length < 2) return 'You need at least two cards to give one.';
    resolvePounce(match, move.choice, now);
    return null;
  }

  if (move.type === 'respond-pounce') return 'There is no Pounce to answer.';
  if (move.type === 'play') {
    const index = seat.hand.findIndex(({ id }) => id === move.cardId);
    if (index < 0 || !matches(match, seat.hand[index])) return 'That card does not match the discard.';
    if (turn.drawnCardId !== undefined && turn.drawnCardId !== move.cardId) return 'Play the card you drew or pass.';
    const selected = seat.hand[index];
    const action = 'action' in selected ? selected.action : undefined;
    const nextSuit = activeSuit(match);
    const target = action === 'pounce' ? seatsFrom(match, seat.id, 1).find(({ id }) =>
      id !== seat.id && id === move.targetSeatId) : undefined;
    if (action === 'pounce' && !target) return 'Choose an opponent for Pounce.';
    if ((action === 'curious-cat' || action === 'catnap') && !move.suit) return 'Choose the next active suit.';
    const [card] = seat.hand.splice(index, 1);
    match.discards.push(card);
    match.lastAction = { type: 'play', seatId, card };
    if (action === 'pounce' && target) {
      match.wildSuit = nextSuit;
      match.pounce = { actorSeatId: seat.id, targetSeatId: target.id };
      match.turn = { seatId: target.id, deadline: now + (target.bot ? botTurnDelay : 15_000) };
      return null;
    }
    if (action === 'curious-cat' || action === 'catnap') match.wildSuit = move.suit;
    const order = seatsFrom(match, seat.id, 1);
    if (action === 'tail-spin') match.direction = match.direction === -1 ? 1 : -1;
    if (action === 'double-treat' || action === 'catnap') takeCards(match, order[0], action === 'catnap' ? 4 : 2);
    resolvePlay(match, seat, now, action === 'hiss' || action === 'double-treat' || action === 'catnap' ||
      (action === 'tail-spin' && order.length === 2));
    return null;
  }

  if (move.type === 'pass') {
    if (turn.drawnCardId === undefined) return 'Draw a playable card before passing.';
    match.lastAction = { type: 'pass', seatId };
    advance(match, seatId, now);
    return null;
  }

  if (turn.drawnCardId !== undefined) return 'Play the card you drew or pass.';
  if (!hasDraw(match)) return 'The draw pile is empty. Play a matching card.';
  takeCards(match, seat, 1);
  const card = seat.hand.at(-1)!;
  match.lastAction = { type: 'draw', seatId };
  if (matches(match, card)) turn.drawnCardId = card.id;
  else advance(match, seatId, now);
  return null;
}

export function expireTurn(match: Match, now: number) {
  const turn = match.turn;
  if (!turn || now < turn.deadline) return false;
  const seat = match.seats.find(({ id }) => id === turn.seatId)!;
  if (seat.bot) {
    playBotTurn(match, seat, now);
    return true;
  }
  if (match.pounce) {
    resolvePounce(match, 'draw', now);
    return true;
  }
  if (turn.drawnCardId === undefined && hasDraw(match)) {
    applyTurn(match, turn.seatId, { type: 'draw' }, now);
  }
  // An unplayable draw already advanced the turn.
  if (match.turn !== turn) return true;
  if (turn.drawnCardId !== undefined) {
    applyTurn(match, turn.seatId, { type: 'pass' }, now);
  } else {
    const card = seat.hand.find((candidate) => matches(match, candidate))!;
    applyTurn(match, seat.id, automaticPlay(match, seat, card), now);
  }
  return true;
}

function automaticPlay(match: Match, seat: MatchSeat, card: Card): MatchMove {
  if ('action' in card && card.action === 'pounce') {
    return { type: 'play', cardId: card.id, targetSeatId: seatsFrom(match, seat.id, 1)[0].id };
  }
  if (card.suit === null) {
    return { type: 'play', cardId: card.id, suit: strongestSuit(seat.hand) };
  }
  return { type: 'play', cardId: card.id };
}

function playBotTurn(match: Match, seat: MatchSeat, now: number) {
  const opponents = seatsFrom(match, seat.id, 1).filter(({ id }) => id !== seat.id)
    .map(({ id, hand }) => ({ id, cardCount: hand.length }));
  const move = chooseBotMove(matchView(match, seat.id), opponents);
  if (!move) return;
  const turn = match.turn;
  applyTurn(match, seat.id, move, now);
  // A playable draw keeps this turn open. An unplayable draw already advanced it.
  if (move.type !== 'draw' || match.turn !== turn || turn?.drawnCardId === undefined) return;
  const followUp = chooseBotMove(matchView(match, seat.id), opponents);
  if (followUp) applyTurn(match, seat.id, followUp, now);
}

export function forfeitSeats(match: Match, departed: string[], now: number) {
  if (match.result) return;
  const returned: Card[] = [];
  for (const seat of match.seats) {
    if (!departed.includes(seat.id) || seat.forfeitedCount !== undefined) continue;
    seat.forfeitedCount = seat.hand.length;
    returned.push(...seat.hand);
    seat.hand = [];
  }
  if (returned.length) match.drawPile = shuffle([...match.drawPile, ...returned]);
  const remaining = match.seats.filter(({ forfeitedCount }) => forfeitedCount === undefined);
  if (remaining.length <= 1) finish(match, remaining[0]?.id ?? null);
  else if (match.pounce && departed.includes(match.pounce.actorSeatId)) {
    const { actorSeatId } = match.pounce;
    delete match.pounce;
    advance(match, actorSeatId, now);
  } else if (match.pounce && departed.includes(match.pounce.targetSeatId)) {
    resolvePounce(match, 'forfeit', now);
  } else if (match.turn && departed.includes(match.turn.seatId)) {
    advance(match, match.turn.seatId, now);
  }
}

export function matchView(match: Match, seatId: string): MatchView {
  const hand = match.seats.find(({ id }) => id === seatId)?.hand ?? [];
  const discard = top(match);
  const myTurn = !match.pounce && match.turn?.seatId === seatId;
  const drawnCardId = match.turn?.drawnCardId;
  return {
    discard,
    activeSuit: activeSuit(match),
    direction: match.direction ?? 1,
    drawCount: match.drawPile.length,
    seats: match.seats.map(({ id, name, bot, hand, forfeitedCount }) => ({
      id, name, cardCount: forfeitedCount ?? hand.length, forfeited: forfeitedCount !== undefined,
      ...(bot ? { bot } : {}),
    })),
    hand,
    playableIds: myTurn ? hand.filter((card) => (drawnCardId === undefined || card.id === drawnCardId) &&
      matches(match, card)).map(({ id }) => id) : [],
    canDraw: myTurn && drawnCardId === undefined && hasDraw(match),
    canPass: myTurn && drawnCardId !== undefined,
    pounce: match.pounce && { ...match.pounce, canGive: match.pounce.targetSeatId === seatId && hand.length > 1 },
    turn: match.turn ? { seatId: match.turn.seatId, deadline: match.turn.deadline } : null,
    result: match.result,
    lastAction: match.lastAction,
  };
}
