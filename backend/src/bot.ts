import { suits } from '@meow-table/protocol';
import type { Card, MatchMove, MatchView, Suit } from '@meow-table/protocol';

type Opponent = Pick<MatchView['seats'][number], 'id' | 'cardCount'>;

function suitSupport(hand: Card[], suit: Suit) {
  return hand.filter((card) => card.suit === suit).length;
}

export function strongestSuit(hand: Card[]): Suit {
  return suits.reduce((best, suit) => suitSupport(hand, suit) > suitSupport(hand, best) ? suit : best);
}

function playScore(card: Card, hand: Card[], opponents: Opponent[]) {
  // Save wilds until they are needed, unless they can stop an opponent close to winning.
  const support = card.suit === null ? -2 : suitSupport(hand, card.suit);
  if (!('action' in card) || opponents[0].cardCount > 2) return support;

  switch (card.action) {
    case 'hiss':
    case 'double-treat':
    case 'catnap':
      return support + hand.length + 2;
    case 'tail-spin':
      return opponents.length === 1 || opponents.at(-1)!.cardCount > 2 ? support + hand.length + 2 : support;
    default:
      return support;
  }
}

export function chooseBotMove(view: MatchView, opponents: Opponent[]): MatchMove | null {
  if (view.pounce) {
    const actor = opponents.find(({ id }) => id === view.pounce?.actorSeatId);
    return { type: 'respond-pounce', choice: view.pounce.canGive && actor?.cardCount === 0 ? 'give' : 'draw' };
  }

  const legal = view.hand.filter(({ id }) => view.playableIds.includes(id));
  let preferred: Card | undefined;
  let bestScore = -Infinity;
  for (const card of legal) {
    const score = playScore(card, view.hand, opponents);
    if (score <= bestScore) continue;
    bestScore = score;
    preferred = card;
  }
  if (!preferred) return view.canDraw ? { type: 'draw' } : null;

  const move = { type: 'play' as const, cardId: preferred.id };
  if (preferred.suit !== null) return move;
  if (preferred.action !== 'pounce') return { ...move, suit: strongestSuit(view.hand) };

  // An opponent with one card cannot return a card to stop a last-card Pounce.
  const target = opponents.reduce((fewest, candidate) => candidate.cardCount < fewest.cardCount ? candidate : fewest);
  return { ...move, targetSeatId: target.id };
}
