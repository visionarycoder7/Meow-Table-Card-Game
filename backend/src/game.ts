import { suitedActions, suits, wildActions } from '@meow-table/protocol';
import type { ActionName, Card, MatchMove, MatchView, Suit } from '@meow-table/protocol';
import { chooseBotMove, strongestSuit } from './bot.ts';

type SeatIdentity = { id: string; name: string; bot?: true };
type MatchSeat = SeatIdentity & { hand: Card[]; forfeitedCount?: number; out?: boolean; unoCalled?: boolean };
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
  pendingDraw?: number;
  roulette?: { actorSeatId: string; targetSeatId: string };
  pounce?: { actorSeatId: string; targetSeatId: string };
  noMercyRules?: boolean;
  unoRules?: boolean;
};

export const DRAW_VALUES: Partial<Record<ActionName, number>> = {
  'double-treat': 2,
  d2: 2,
  catnap: 4,
  d4: 4,
  wrd4: 4,
  wd6: 6,
  wd10: 10,
};

export function getDrawValue(card: Card): number {
  if ('action' in card) return DRAW_VALUES[card.action] ?? 0;
  return 0;
}

function shuffle(cards: Card[]) {
  for (let index = cards.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [cards[index], cards[other]] = [cards[other], cards[index]];
  }
  return cards;
}

export function makeNoMercyDeck(): Card[] {
  const cards: Card[] = [];
  for (const suit of suits) {
    for (let rank = 0; rank <= 9; rank++) {
      cards.push({ id: cards.length, suit, rank });
      cards.push({ id: cards.length, suit, rank });
    }
    for (let i = 0; i < 3; i++) {
      cards.push({ id: cards.length, suit, action: 'skip' });
      cards.push({ id: cards.length, suit, action: 'rev' });
      cards.push({ id: cards.length, suit, action: 'd2' });
      cards.push({ id: cards.length, suit, action: 'discard' });
    }
    for (let i = 0; i < 2; i++) {
      cards.push({ id: cards.length, suit, action: 'd4' });
      cards.push({ id: cards.length, suit, action: 'skipall' });
    }
  }
  for (let i = 0; i < 8; i++) {
    cards.push({ id: cards.length, suit: null, action: 'wrd4' });
    cards.push({ id: cards.length, suit: null, action: 'wd6' });
  }
  for (let i = 0; i < 4; i++) {
    cards.push({ id: cards.length, suit: null, action: 'wd10' });
    cards.push({ id: cards.length, suit: null, action: 'roul' });
  }
  return cards;
}

export function makeDeck(withActions: boolean | 'no-mercy' = false): Card[] {
  if (withActions === 'no-mercy') return makeNoMercyDeck();
  const cards: Card[] = [];
  for (const suit of suits) {
    for (let rank = 0; rank <= 9; rank++) {
      cards.push({ id: cards.length, suit, rank });
      if (rank > 0) cards.push({ id: cards.length, suit, rank });
    }
  }
  if (withActions) {
    for (const suit of suits) {
      for (const action of ['hiss', 'tail-spin', 'double-treat'] as const) {
        for (let copy = 0; copy < 2; copy++) cards.push({ id: cards.length, suit, action });
      }
    }
    for (const action of ['curious-cat', 'catnap', 'pounce'] as const) {
      for (let copy = 0; copy < 4; copy++) cards.push({ id: cards.length, suit: null, action });
    }
  }
  return cards;
}

export function startMatch(
  seats: SeatIdentity[],
  openingSeatId: string,
  now: number,
  deck?: Card[],
  options?: { noMercyRules?: boolean; unoRules?: boolean }
): Match {
  const chosenDeck = deck ?? shuffle(makeDeck(options?.noMercyRules ? 'no-mercy' : true));
  const drawPile = [...chosenDeck];
  const dealt = seats.map(({ id, name, bot }) => ({ id, name, bot, hand: drawPile.splice(0, 7) }));
  const openingIndex = drawPile.findIndex((card) => 'rank' in card);
  const match: Match = {
    seats: dealt,
    openingSeatId,
    drawPile,
    discards: drawPile.splice(openingIndex >= 0 ? openingIndex : 0, 1),
    direction: 1,
    turn: null,
    result: null,
    noMercyRules: options?.noMercyRules,
    unoRules: options?.unoRules,
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

function matches(match: Match, card: Card): boolean {
  if (match.pendingDraw && match.pendingDraw > 0) {
    const discard = top(match);
    const cardVal = getDrawValue(card);
    const topVal = getDrawValue(discard);
    return cardVal > 0 && cardVal >= topVal;
  }
  const discard = top(match);
  if (card.suit === null) return true;
  if (card.suit === activeSuit(match)) return true;
  if ('rank' in card && 'rank' in discard && card.rank === discard.rank) return true;
  if ('action' in card && 'action' in discard && card.action === discard.action) return true;
  if ('action' in card && 'action' in discard) {
    if ((card.action === 'skip' || card.action === 'hiss') && (discard.action === 'skip' || discard.action === 'hiss')) return true;
    if ((card.action === 'rev' || card.action === 'tail-spin') && (discard.action === 'rev' || discard.action === 'tail-spin')) return true;
    if ((card.action === 'd2' || card.action === 'double-treat') && (discard.action === 'd2' || discard.action === 'double-treat')) return true;
  }
  return false;
}

function hasDraw(match: Match) {
  return match.drawPile.length > 0 || match.discards.length > 1;
}

function mayDrawDeep(match: Match, hand: Card[]) {
  return match.drawPile.length + match.discards.length > 2 &&
    !hand.some((card) => matches(match, card));
}

function finish(match: Match, winnerSeatId: string | null) {
  match.turn = null;
  match.result = { winnerSeatId };
  delete match.pounce;
  delete match.roulette;
}

function seatsFrom(match: Match, seatId: string, offset = 0) {
  const length = match.seats.length;
  const start = match.seats.findIndex(({ id }) => id === seatId);
  const direction = match.direction ?? 1;
  return Array.from({ length }, (_, index) =>
    match.seats[(start + (offset + index) * direction + 2 * length) % length])
    .filter(({ forfeitedCount, out }) => forfeitedCount === undefined && !out);
}

function applyMercy(match: Match) {
  for (const seat of match.seats) {
    if (!seat.out && seat.forfeitedCount === undefined && seat.hand.length >= 25) {
      seat.out = true;
      seat.forfeitedCount = seat.hand.length;
      match.drawPile = shuffle([...match.drawPile, ...seat.hand]);
      seat.hand = [];
    }
  }
  const active = match.seats.filter((s) => !s.out && s.forfeitedCount === undefined);
  if (active.length === 1 && match.result === null) {
    finish(match, active[0].id);
  } else if (active.length === 0 && match.result === null) {
    finish(match, null);
  }
}

function beginTurn(match: Match, nextSeatId: string, now: number) {
  applyMercy(match);
  if (match.result !== null) return;
  const isStacking = Boolean(match.pendingDraw && match.pendingDraw > 0);
  const seat = seatsFrom(match, nextSeatId).find((candidate) =>
    hasDraw(match) || isStacking || candidate.hand.some((card) => matches(match, card)));
  if (seat) match.turn = { seatId: seat.id, deadline: now + (seat.bot ? botTurnDelay : 30_000) };
  else finish(match, null);
}

function advance(match: Match, fromSeatId: string, now: number, skip = false) {
  const order = seatsFrom(match, fromSeatId, 1);
  if (order.length === 0) {
    finish(match, null);
    return;
  }
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
  applyMercy(match);
  if (match.result !== null) return;
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

  if (match.roulette) {
    if (move.type !== 'roulette-color') return 'Choose a color for roulette.';
    if (match.roulette.targetSeatId !== seatId) return 'It is not your roulette turn.';
    const target = seat;
    delete match.roulette;
    let count = 0;
    while (hasDraw(match) && target.hand.length < 25) {
      takeCards(match, target, 1);
      count++;
      const card = target.hand.at(-1)!;
      if (card.suit === move.suit || card.suit === null) break;
    }
    match.wildSuit = move.suit;
    match.lastAction = { type: 'roulette', seatId: target.id, suit: move.suit, drawnCount: count };
    applyMercy(match);
    if (match.result) return null;
    advance(match, target.id, now);
    return null;
  }

  if (move.type === 'respond-pounce') return 'There is no Pounce to answer.';
  if (move.type === 'roulette-color') return 'There is no roulette to answer.';

  if (move.type === 'call-uno') {
    if (seat.hand.length === 2) {
      seat.unoCalled = true;
      match.lastAction = { type: 'call-uno', seatId };
      return null;
    }
    return 'You can only call UNO when you have two cards.';
  }

  if (move.type === 'play') {
    const index = seat.hand.findIndex(({ id }) => id === move.cardId);
    if (index < 0 || !matches(match, seat.hand[index])) return 'That card does not match the discard.';
    if (turn.drawnCardId !== undefined && turn.drawnCardId !== move.cardId) return 'Play the card you drew or pass.';
    const selected = seat.hand[index];
    const action = 'action' in selected ? selected.action : undefined;
    const isRank = 'rank' in selected;
    const isRank7 = isRank && selected.rank === 7;
    const isRank0 = isRank && selected.rank === 0;

    const target = (action === 'pounce' || isRank7)
      ? seatsFrom(match, seat.id, 1).find(({ id }) => id !== seat.id && id === move.targetSeatId)
      : undefined;
    if ((action === 'pounce' || isRank7) && !target) {
      return isRank7 ? 'Choose an opponent to swap hands with.' : 'Choose an opponent for Pounce.';
    }
    if ((action === 'curious-cat' || action === 'catnap' || action === 'wrd4' || action === 'wd6' || action === 'wd10') && !move.suit) {
      return 'Choose the next active suit.';
    }

    const forgotUno = Boolean(match.unoRules && seat.hand.length === 2 && !seat.unoCalled);
    const [card] = seat.hand.splice(index, 1);
    match.discards.push(card);
    match.lastAction = target
      ? { type: 'play', seatId, card, targetSeatId: target.id }
      : { type: 'play', seatId, card };
    delete turn.drawnCardId;
    seat.unoCalled = false;

    if (action === 'pounce' && target) {
      match.wildSuit = activeSuit(match);
      match.pounce = { actorSeatId: seat.id, targetSeatId: target.id };
      match.turn = { seatId: target.id, deadline: now + (target.bot ? botTurnDelay : 15_000) };
      return null;
    }

    if (selected.suit === null && move.suit) {
      match.wildSuit = move.suit;
    }

    let skip = false;
    let again = false;

    // Discard All
    if (action === 'discard') {
      const sameSuit = seat.hand.filter((c) => c.suit === selected.suit);
      seat.hand = seat.hand.filter((c) => c.suit !== selected.suit);
      match.discards.push(...sameSuit);
    }

    // Stacking draw values for No Mercy cards (d2, d4, wrd4, wd6, wd10)
    const isNoMercyDraw = action === 'd2' || action === 'd4' || action === 'wrd4' || action === 'wd6' || action === 'wd10';
    if (isNoMercyDraw) {
      const dv = getDrawValue(selected);
      match.pendingDraw = (match.pendingDraw ?? 0) + dv;
    }

    // Skips and Reverses
    const order = seatsFrom(match, seat.id, 1);
    if (action === 'skip' || action === 'hiss') {
      skip = true;
    }
    if (action === 'rev' || action === 'tail-spin' || action === 'wrd4') {
      match.direction = match.direction === -1 ? 1 : -1;
      if (order.length === 2) skip = true;
    }
    if (action === 'skipall') {
      again = true;
    }

    // 7 Hand Swap
    if (isRank7 && target) {
      [seat.hand, target.hand] = [target.hand, seat.hand];
    }

    // 0 All Hands Rotate
    if (isRank0) {
      const active = seatsFrom(match, seat.id, 0);
      const hands = active.map((s) => s.hand);
      active.forEach((s, n) => {
        s.hand = hands[(n - 1 + active.length) % active.length];
      });
    }

    // Wild Roulette
    if (action === 'roul') {
      const nextSeat = seatsFrom(match, seat.id, 1)[0];
      if (nextSeat) {
        match.roulette = { actorSeatId: seat.id, targetSeatId: nextSeat.id };
        match.turn = { seatId: nextSeat.id, deadline: now + (nextSeat.bot ? botTurnDelay : 30_000) };
        if (forgotUno) takeCards(match, seat, 2);
        applyMercy(match);
        return null;
      }
    }

    // Double Treat & Catnap legacy direct draw
    if (action === 'double-treat' || action === 'catnap') {
      takeCards(match, order[0], action === 'catnap' ? 4 : 2);
      skip = true;
    }

    if (forgotUno) {
      takeCards(match, seat, 2);
    }

    applyMercy(match);
    if (match.result) return null;

    if (seat.hand.length === 0) {
      finish(match, seat.id);
      return null;
    }

    if (again) {
      beginTurn(match, seat.id, now);
      return null;
    }

    advance(match, seat.id, now, skip);
    return null;
  }

  if (move.type === 'pass') {
    if (turn.drawnCardId === undefined) return 'Draw a playable card before passing.';
    match.lastAction = { type: 'pass', seatId };
    advance(match, seatId, now);
    return null;
  }

  if (turn.drawnCardId !== undefined) return 'Play the card you drew or pass.';

  // Draw penalty taking
  if (match.pendingDraw && match.pendingDraw > 0) {
    const count = match.pendingDraw;
    takeCards(match, seat, count);
    match.pendingDraw = 0;
    match.lastAction = { type: 'draw', seatId, count };
    applyMercy(match);
    if (match.result) return null;
    advance(match, seatId, now);
    return null;
  }

  if (!hasDraw(match)) return 'The draw pile is empty. Play a matching card.';
  if (move.deep && !mayDrawDeep(match, seat.hand)) return 'Deep Draw needs a blocked hand and at least two available cards.';

  const before = seat.hand.length;
  const limit = move.deep ? 3 : match.noMercyRules ? 25 : 1;
  while (hasDraw(match) && seat.hand.length - before < limit && seat.hand.length < 25) {
    takeCards(match, seat, 1);
    const card = seat.hand.at(-1)!;
    if (matches(match, card)) {
      turn.drawnCardId = card.id;
      break;
    }
  }
  const count = seat.hand.length - before;
  match.lastAction = count > 1 ? { type: 'draw', seatId, count } : { type: 'draw', seatId };
  applyMercy(match);
  if (match.result) return null;
  if (turn.drawnCardId === undefined) advance(match, seatId, now);
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
  if (match.roulette) {
    applyTurn(match, match.roulette.targetSeatId, { type: 'roulette-color', suit: strongestSuit(seat.hand) }, now);
    return true;
  }
  if (match.pounce) {
    resolvePounce(match, 'draw', now);
    return true;
  }
  if (match.pendingDraw && match.pendingDraw > 0) {
    applyTurn(match, turn.seatId, { type: 'draw' }, now);
    return true;
  }
  if (turn.drawnCardId === undefined && hasDraw(match)) {
    applyTurn(match, turn.seatId, { type: 'draw' }, now);
  }
  if (match.turn !== turn) return true;
  if (turn.drawnCardId !== undefined) {
    applyTurn(match, turn.seatId, { type: 'pass' }, now);
  } else {
    const card = seat.hand.find((candidate) => matches(match, candidate));
    if (card) applyTurn(match, seat.id, automaticPlay(match, seat, card), now);
    else advance(match, seat.id, now);
  }
  return true;
}

function automaticPlay(match: Match, seat: MatchSeat, card: Card): MatchMove {
  if ('rank' in card && card.rank === 7) {
    const target = seatsFrom(match, seat.id, 1)[0]?.id;
    return { type: 'play', cardId: card.id, targetSeatId: target };
  }
  if ('action' in card && card.action === 'pounce') {
    return { type: 'play', cardId: card.id, targetSeatId: seatsFrom(match, seat.id, 1)[0].id };
  }
  if (card.suit === null && card.action !== 'roul') {
    return { type: 'play', cardId: card.id, suit: strongestSuit(seat.hand) };
  }
  return { type: 'play', cardId: card.id };
}

function playBotTurn(match: Match, seat: MatchSeat, now: number) {
  if (match.roulette && match.roulette.targetSeatId === seat.id) {
    applyTurn(match, seat.id, { type: 'roulette-color', suit: strongestSuit(seat.hand) }, now);
    return;
  }
  if (seat.hand.length === 2 && !seat.unoCalled && Math.random() > 0.15) {
    applyTurn(match, seat.id, { type: 'call-uno' }, now);
  }
  const opponents = seatsFrom(match, seat.id, 1).filter(({ id }) => id !== seat.id)
    .map(({ id, hand }) => ({ id, cardCount: hand.length }));
  const move = chooseBotMove(matchView(match, seat.id), opponents);
  if (!move) return;
  const turn = match.turn;
  applyTurn(match, seat.id, move, now);
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
  const remaining = match.seats.filter(({ forfeitedCount, out }) => forfeitedCount === undefined && !out);
  if (remaining.length <= 1) finish(match, remaining[0]?.id ?? null);
  else if (match.pounce && departed.includes(match.pounce.actorSeatId)) {
    const { actorSeatId } = match.pounce;
    delete match.pounce;
    advance(match, actorSeatId, now);
  } else if (match.pounce && departed.includes(match.pounce.targetSeatId)) {
    resolvePounce(match, 'forfeit', now);
  } else if (match.roulette && departed.includes(match.roulette.targetSeatId)) {
    const { actorSeatId } = match.roulette;
    delete match.roulette;
    advance(match, actorSeatId, now);
  } else if (match.turn && departed.includes(match.turn.seatId)) {
    advance(match, match.turn.seatId, now);
  }
}

export function matchView(match: Match, seatId: string): MatchView {
  const seat = match.seats.find(({ id }) => id === seatId);
  const hand = seat?.hand ?? [];
  const discard = top(match);
  const myTurn = !match.pounce && !match.roulette && match.turn?.seatId === seatId;
  const drawnCardId = match.turn?.drawnCardId;
  const isStacking = Boolean(match.pendingDraw && match.pendingDraw > 0);
  return {
    discard,
    activeSuit: activeSuit(match),
    direction: match.direction ?? 1,
    drawCount: match.drawPile.length,
    pendingDraw: match.pendingDraw,
    seats: match.seats.map(({ id, name, bot, hand, forfeitedCount, out, unoCalled }) => ({
      id,
      name,
      cardCount: forfeitedCount ?? hand.length,
      forfeited: forfeitedCount !== undefined,
      ...(out ? { out: true } : {}),
      ...(unoCalled ? { uno: true } : {}),
      ...(bot ? { bot } : {}),
    })),
    hand,
    playableIds: myTurn
      ? hand.filter((card) => (drawnCardId === undefined || card.id === drawnCardId) && matches(match, card)).map(({ id }) => id)
      : [],
    canDraw: myTurn && drawnCardId === undefined && (hasDraw(match) || isStacking),
    canDeepDraw: myTurn && drawnCardId === undefined && !isStacking && mayDrawDeep(match, hand),
    canPass: myTurn && drawnCardId !== undefined,
    canCallUno: hand.length === 2 && !seat?.unoCalled,
    roulette: match.roulette,
    pounce: match.pounce && { ...match.pounce, canGive: match.pounce.targetSeatId === seatId && hand.length > 1 },
    turn: match.turn ? { seatId: match.turn.seatId, deadline: match.turn.deadline } : null,
    result: match.result,
    lastAction: match.lastAction,
  };
}
