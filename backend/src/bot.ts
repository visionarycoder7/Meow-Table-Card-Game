import { suits } from '@meow-table/protocol';
import type { Card, MatchMove, MatchView, Suit } from '@meow-table/protocol';

type Opponent = Pick<MatchView['seats'][number], 'id' | 'cardCount'>;

function suitSupport(hand: Card[], suit: Suit) {
  return hand.filter((card) => card.suit === suit).length;
}

export function strongestSuit(hand: Card[]): Suit {
  return suits.reduce((best, suit) => suitSupport(hand, suit) > suitSupport(hand, best) ? suit : best);
}

function playScore(card: Card, hand: Card[], opponents: Opponent[], pendingDraw?: number) {
  // If under pending draw penalty, prioritize highest draw value
  if (pendingDraw && pendingDraw > 0) {
    if ('action' in card) {
      if (card.action === 'wd10') return 100;
      if (card.action === 'wd6') return 90;
      if (card.action === 'wrd4' || card.action === 'd4' || card.action === 'catnap') return 80;
      if (card.action === 'd2' || card.action === 'double-treat') return 70;
    }
  }

  // Save wilds until they are needed, unless they can stop an opponent close to winning.
  const support = card.suit === null ? -2 : suitSupport(hand, card.suit);
  if (!('action' in card) || (opponents.length > 0 && opponents[0].cardCount > 2)) return support;

  switch (card.action) {
    case 'hiss':
    case 'skip':
    case 'skipall':
    case 'double-treat':
    case 'd2':
    case 'catnap':
    case 'd4':
    case 'wrd4':
    case 'wd6':
    case 'wd10':
      return support + hand.length + 2;
    case 'tail-spin':
    case 'rev':
      return opponents.length === 1 || opponents.at(-1)!.cardCount > 2 ? support + hand.length + 2 : support;
    default:
      return support;
  }
}

export function chooseBotMove(view: MatchView, opponents: Opponent[]): MatchMove | null {
  if (view.roulette) {
    return { type: 'roulette-color', suit: strongestSuit(view.hand) };
  }
  if (view.pounce) {
    const actor = opponents.find(({ id }) => id === view.pounce?.actorSeatId);
    return { type: 'respond-pounce', choice: view.pounce.canGive && actor?.cardCount === 0 ? 'give' : 'draw' };
  }

  const legal = view.hand.filter(({ id }) => view.playableIds.includes(id));
  let preferred: Card | undefined;
  let bestScore = -Infinity;
  for (const card of legal) {
    const score = playScore(card, view.hand, opponents, view.pendingDraw);
    if (score <= bestScore) continue;
    bestScore = score;
    preferred = card;
  }
  if (!preferred) {
    if (view.canDeepDraw && view.hand.length <= 4 && opponents[0]?.cardCount <= 2) return { type: 'draw', deep: true };
    return view.canDraw ? { type: 'draw' } : null;
  }

  const move = { type: 'play' as const, cardId: preferred.id };
  if ('rank' in preferred && preferred.rank === 7 && opponents.length) {
    const target = opponents.reduce((fewest, candidate) => candidate.cardCount < fewest.cardCount ? candidate : fewest);
    return { ...move, targetSeatId: target.id };
  }
  if (preferred.suit !== null) return move;
  if ('action' in preferred && preferred.action === 'pounce' && opponents.length) {
    const target = opponents.reduce((fewest, candidate) => candidate.cardCount < fewest.cardCount ? candidate : fewest);
    return { ...move, targetSeatId: target.id };
  }
  return { ...move, suit: strongestSuit(view.hand) };
}
