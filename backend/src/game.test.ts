/// <reference types="node" />

import assert from 'node:assert/strict';
import test from 'node:test';
import type { Card } from '@meow-table/protocol';
import { applyTurn, expireTurn, forfeitSeats, makeDeck, makeNoMercyDeck, matchView, rematchOpener, startMatch } from './game.ts';

const players = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }];
const paw = (rank: number) => ({ id: rank, suit: 'PAW' as const, rank });
const fish = (rank: number) => ({ id: 20 + rank, suit: 'FISH' as const, rank });
const effect = (action: 'hiss' | 'tail-spin' | 'double-treat'): Card => ({ id: 80, suit: 'PAW', action });
const wild = (action: 'curious-cat' | 'catnap' | 'pounce'): Card => ({ id: 100, suit: null, action });

test('deals seven cards per seat and sends only its private hand', () => {
  const deck = makeDeck();
  assert.equal(deck.length, 76);
  assert.equal(new Set(deck.map(({ id }) => id)).size, 76);
  const match = startMatch(players, 'a', 0, deck);
  const left = matchView(match, 'a');
  const right = matchView(match, 'b');
  assert.deepEqual(left.hand, deck.slice(0, 7));
  assert.deepEqual(right.hand, deck.slice(7, 14));
  assert.deepEqual(left.discard, deck[14]);
  assert.equal(left.drawCount, 61);
  assert.equal('drawPile' in left, false);
  assert.equal('hand' in left.seats[1], false);
  assert.deepEqual(right.playableIds, []);
});

test('rejects wrong-seat and wrong-card plays without changing state', () => {
  const match = startMatch(players, 'a', 0, makeDeck());
  const original = structuredClone(match);
  assert.ok(applyTurn(match, 'b', { type: 'draw' }, 0));
  assert.ok(applyTurn(match, 'a', { type: 'play', cardId: match.seats[1].hand[0].id }, 0));
  assert.deepEqual(match, original);
});

test('the draw window permits only the drawn card and uses the original deadline', () => {
  const match = startMatch(players, 'a', 0);
  match.discards = [paw(1)];
  match.seats[0].hand = [paw(4)];
  match.drawPile = [paw(3)];
  assert.equal(applyTurn(match, 'a', { type: 'draw' }, 5), null);
  assert.deepEqual(matchView(match, 'a').playableIds, [3]);
  assert.ok(applyTurn(match, 'a', { type: 'play', cardId: 4 }, 5));
  assert.equal(expireTurn(match, 30_000), true);
  assert.equal(match.turn?.seatId, 'b');
  assert.deepEqual(match.seats[0].hand, [paw(4), paw(3)]);
});

test('recycles beneath the discard and advances on an unplayable draw', () => {
  const match = startMatch(players, 'a', 0);
  match.discards = [fish(2), paw(1)];
  match.drawPile = [];
  match.seats[1].hand = [paw(3)];
  assert.equal(applyTurn(match, 'a', { type: 'draw' }, 1), null);
  assert.deepEqual(match.discards, [paw(1)]);
  assert.deepEqual(match.seats[0].hand.at(-1), fish(2));
  assert.equal(match.turn?.seatId, 'b');
});

test('Deep Draw stops at the first match and offers only that card', () => {
  const match = startMatch(players, 'a', 0);
  match.discards = [paw(1)];
  match.seats[0].hand = [fish(6)];
  match.drawPile = [fish(8), paw(4), fish(7)];
  assert.equal(matchView(match, 'a').canDeepDraw, true);
  assert.equal(applyTurn(match, 'a', { type: 'draw', deep: true }, 1), null);
  const view = matchView(match, 'a');
  assert.deepEqual(view.hand, [fish(6), fish(8), paw(4)]);
  assert.deepEqual(view.playableIds, [4]);
  assert.equal(view.canPass, true);
  assert.equal(view.canDeepDraw, false);
  assert.deepEqual(matchView(match, 'b').lastAction, { type: 'draw', seatId: 'a', count: 2 });
  assert.equal(view.turn?.deadline, 30_000);
  assert.equal(applyTurn(match, 'a', { type: 'play', cardId: 4 }, 2), null);
  assert.equal(match.turn?.seatId, 'b');
});

test('Deep Draw caps misses, recycles an exhausted pile, and rejects a playable hand', () => {
  const match = startMatch(players, 'a', 0);
  match.discards = [fish(3), fish(4), paw(1)];
  match.seats[0].hand = [paw(6)];
  match.seats[1].hand = [paw(5)];
  match.drawPile = [fish(8)];
  const initial = structuredClone(match);
  assert.match(applyTurn(match, 'a', { type: 'draw', deep: true }, 1) ?? '', /blocked hand/);
  assert.deepEqual(match, initial);
  match.seats[0].hand = [fish(6)];
  assert.equal(applyTurn(match, 'a', { type: 'draw', deep: true }, 2), null);
  assert.equal(match.seats[0].hand.length, 4);
  assert.equal(match.turn?.seatId, 'b');
  assert.deepEqual(match.discards, [paw(1)]);
  assert.deepEqual(matchView(match, 'b').lastAction, { type: 'draw', seatId: 'a', count: 3 });
});

test('an exhausted draw skips a blocked seat or ends the match if nobody can play', () => {
  const match = startMatch(players, 'a', 0);
  match.discards = [paw(1)];
  match.drawPile = [fish(2)];
  match.seats[1].hand = [fish(4)];
  match.seats[0].hand = [paw(5)];
  assert.equal(applyTurn(match, 'a', { type: 'draw' }, 1), null);
  assert.equal(match.turn?.seatId, 'a');
  assert.equal(matchView(match, 'a').canDraw, false);
  assert.equal(expireTurn(match, 30_001), true);
  assert.deepEqual(match.discards.at(-1), paw(5));
  assert.deepEqual(match.seats[0].hand, [fish(2)]);
  assert.equal(match.turn?.seatId, 'b');

  const stalemate = startMatch(players, 'a', 0);
  stalemate.discards = [paw(1)];
  stalemate.drawPile = [fish(2)];
  stalemate.seats[0].hand = [fish(3)];
  stalemate.seats[1].hand = [fish(4)];
  assert.equal(applyTurn(stalemate, 'a', { type: 'draw' }, 1), null);
  assert.deepEqual(stalemate.result, { winnerSeatId: null });
});

test('a final matching card wins and the rematch rotates its opener', () => {
  const match = startMatch(players, 'a', 0);
  match.discards = [paw(2)];
  match.seats[0].hand = [fish(2)];
  assert.equal(applyTurn(match, 'a', { type: 'play', cardId: 22 }, 1), null);
  assert.deepEqual(match.result, { winnerSeatId: 'a' });
  assert.equal(match.turn, null);
  assert.equal(rematchOpener(match, players), 'b');
});

test('a forfeited seat returns its cards and leaves a public final count', () => {
  const match = startMatch(players, 'a', 0, makeDeck());
  forfeitSeats(match, ['a'], 1);
  assert.deepEqual(match.result, { winnerSeatId: 'b' });
  assert.deepEqual(matchView(match, 'b').seats[0], { id: 'a', name: 'A', cardCount: 7, forfeited: true });
  assert.equal(match.drawPile.length, 68);
});

test('a bot waits briefly and prefers a legal card from its strongest suit', () => {
  const bot = { id: 'cpu', name: 'Bot 1', bot: true as const };
  const match = startMatch([players[0], bot], 'cpu', 50);
  match.discards = [paw(2)];
  match.seats[1].hand = [paw(5), fish(2), fish(6)];
  assert.equal(expireTurn(match, 949), false);
  assert.equal(expireTurn(match, 950), true);
  assert.deepEqual(match.discards.at(-1), fish(2));
  assert.equal(match.turn?.seatId, 'a');
  assert.equal(matchView(match, 'a').seats[1].bot, true);
  assert.deepEqual(matchView(match, 'a').lastAction, { type: 'play', seatId: 'cpu', card: fish(2) });
});

test('a bot plays a matching draw and keeps an unplayable draw private', () => {
  const bot = { id: 'cpu', name: 'Bot 1', bot: true as const };
  for (const drawn of [fish(2), fish(3)]) {
    const match = startMatch([players[0], bot], 'cpu', 0);
    match.discards = [paw(2)];
    match.seats[1].hand = [fish(6)];
    match.drawPile = [drawn, paw(7)];
    assert.equal(expireTurn(match, 900), true);
    assert.equal(match.turn?.seatId, 'a');
    const view = matchView(match, 'a');
    if (drawn.rank === 2) {
      assert.deepEqual(view.discard, drawn);
      assert.equal(view.seats[1].cardCount, 1);
    } else {
      assert.equal(view.seats[1].cardCount, 2);
      assert.deepEqual(view.lastAction, { type: 'draw', seatId: 'cpu' });
    }
  }
});

test('a blocked bot uses Deep Draw when a near-winner threatens and plays the first match', () => {
  const bot = { id: 'cpu', name: 'Bot 1', bot: true as const };
  const match = startMatch([players[0], bot], 'cpu', 0);
  match.discards = [paw(1)];
  match.seats[0].hand = [fish(3), fish(7)];
  match.seats[1].hand = [fish(6)];
  match.drawPile = [fish(8), paw(4), fish(9)];
  assert.equal(expireTurn(match, 900), true);
  assert.deepEqual(match.discards.at(-1), paw(4));
  assert.deepEqual(match.seats[1].hand, [fish(6), fish(8)]);
  assert.equal(match.turn?.seatId, 'a');
});

test('a bot saves a wild against a full hand and uses Double Treat against the next near-winner', () => {
  const bot = { id: 'cpu', name: 'Bot 1', bot: true as const };
  const roster = [bot, ...players];
  const opening = (danger: boolean) => {
    const match = startMatch(roster, 'cpu', 0, makeDeck(true));
    match.discards = [paw(1)];
    match.seats[0].hand = [paw(4), wild('catnap'), effect('double-treat'), paw(5)];
    if (danger) match.seats[1].hand = [fish(5), fish(6)];
    assert.equal(expireTurn(match, 900), true);
    return match;
  };
  const ordinary = opening(false);
  assert.deepEqual(ordinary.discards.at(-1), paw(4));
  const urgent = opening(true);
  assert.deepEqual(urgent.discards.at(-1), effect('double-treat'));
  assert.equal(urgent.seats[1].hand.length, 4);
  assert.equal(urgent.turn?.seatId, 'b');
});

test('a bot chooses a Pounce target with one card, and a bot target can prevent an immediate loss', () => {
  const bot = { id: 'cpu', name: 'Bot 1', bot: true as const };
  const match = startMatch([bot, ...players], 'cpu', 0);
  match.seats[0].hand = [wild('pounce')];
  match.seats[2].hand = [fish(6)];
  assert.equal(expireTurn(match, 900), true);
  assert.equal(match.pounce?.targetSeatId, 'b');
  assert.equal(matchView(match, 'b').pounce?.canGive, false);

  const againstBot = startMatch([players[0], bot], 'a', 0);
  againstBot.seats[0].hand = [wild('pounce')];
  againstBot.seats[1].hand = [fish(3), fish(4)];
  assert.equal(applyTurn(againstBot, 'a', { type: 'play', cardId: 100, targetSeatId: 'cpu' }, 1), null);
  assert.equal(expireTurn(againstBot, 901), true);
  assert.equal(againstBot.result, null);
  assert.equal(againstBot.seats[0].hand.length, 1);
  assert.equal(againstBot.seats[1].hand.length, 1);
});

test('the action deck deals 112 unique cards with a numbered opener', () => {
  const deck = makeDeck(true);
  assert.equal(new Set(deck.map(({ id }) => id)).size, 112);
  const movedAction = deck.splice(100, 1)[0];
  deck.splice(14, 0, movedAction);
  const match = startMatch(players, 'a', 0, deck);
  assert.equal(match.drawPile.length, 97);
  assert.ok('rank' in match.discards[0]);
  assert.equal(match.drawPile[0], movedAction);
});

test('Hiss skips an opponent and Tail Spin reverses three seats', () => {
  const three = [...players, { id: 'c', name: 'C' }];
  for (const action of ['hiss', 'tail-spin'] as const) {
    const match = startMatch(three, 'a', 0);
    match.discards = [paw(1)];
    match.seats[0].hand = [effect(action), paw(4)];
    assert.equal(applyTurn(match, 'a', { type: 'play', cardId: 80 }, 1), null);
    assert.equal(match.turn?.seatId, 'c');
    assert.equal(matchView(match, 'c').direction, action === 'tail-spin' ? -1 : 1);
  }
  const pair = startMatch(players, 'a', 0);
  pair.discards = [paw(1)];
  pair.seats[0].hand = [effect('tail-spin'), paw(4)];
  assert.equal(applyTurn(pair, 'a', { type: 'play', cardId: 80 }, 1), null);
  assert.equal(pair.turn?.seatId, 'a');
  assert.equal(matchView(pair, 'b').direction, -1);
});

test('repeated Tail Spin flips every seat view and skips a forfeited seat', () => {
  const seats = [...players, { id: 'c', name: 'C' }, { id: 'd', name: 'D' }];
  const match = startMatch(seats, 'a', 0);
  match.discards = [paw(1)];
  match.seats[0].hand = [effect('tail-spin'), paw(4)];
  match.seats[1].hand = [{ ...effect('tail-spin'), id: 81 }, paw(7)];
  match.seats[3].hand = [paw(5), paw(6)];
  forfeitSeats(match, ['c'], 1);

  assert.equal(applyTurn(match, 'a', { type: 'play', cardId: 80 }, 2), null);
  assert.equal(match.turn?.seatId, 'd');
  for (const { id } of seats) assert.equal(matchView(match, id).direction, -1);
  assert.equal(applyTurn(match, 'd', { type: 'play', cardId: 5 }, 3), null);
  assert.equal(match.turn?.seatId, 'b');
  assert.equal(applyTurn(match, 'b', { type: 'play', cardId: 81 }, 4), null);
  assert.equal(match.turn?.seatId, 'd');
  for (const { id } of seats) assert.equal(matchView(match, id).direction, 1);
  assert.equal(matchView(startMatch(players, 'b', 5), 'a').direction, 1);
});

test('Double Treat resolves its draw before a final-card win', () => {
  const match = startMatch(players, 'a', 0);
  match.discards = [fish(8), paw(1)];
  match.drawPile = [fish(4)];
  match.seats[0].hand = [effect('double-treat')];
  const guestCount = match.seats[1].hand.length;
  assert.equal(applyTurn(match, 'a', { type: 'play', cardId: 80 }, 1), null);
  assert.equal(match.seats[1].hand.length, guestCount + 2);
  assert.deepEqual(match.result, { winnerSeatId: 'a' });
});

test('Curious Cat sets the active suit and Catnap applies its draw and skip', () => {
  for (const action of ['curious-cat', 'catnap'] as const) {
    const match = startMatch(players, 'a', 0);
    match.discards = [paw(1)];
    match.seats[0].hand = [wild(action), paw(4)];
    match.seats[1].hand = [fish(7), paw(9)];
    assert.ok(applyTurn(match, 'a', { type: 'play', cardId: 100 }, 1));
    assert.equal(match.seats[0].hand.length, 2);
    assert.equal(applyTurn(match, 'a', { type: 'play', cardId: 100, suit: 'FISH' }, 1), null);
    assert.equal(matchView(match, 'b').activeSuit, 'FISH');
    assert.equal(match.turn?.seatId, action === 'catnap' ? 'a' : 'b');
    assert.equal(match.seats[1].hand.length, action === 'catnap' ? 6 : 2);
    if (action === 'curious-cat') assert.deepEqual(matchView(match, 'b').playableIds, [27]);
  }
});

test('Pounce waits for the chosen seat, keeps its transfer private, and can prevent a win', () => {
  const match = startMatch([...players, { id: 'c', name: 'C' }], 'a', 0);
  match.discards = [paw(1)];
  match.seats[0].hand = [wild('pounce')];
  match.seats[2].hand = [fish(7), fish(8)];
  assert.ok(applyTurn(match, 'a', { type: 'play', cardId: 100, targetSeatId: 'a' }, 1));
  assert.equal(applyTurn(match, 'a', { type: 'play', cardId: 100, targetSeatId: 'c' }, 1), null);
  assert.equal(match.result, null);
  assert.equal(matchView(match, 'a').activeSuit, 'PAW');
  assert.equal(matchView(match, 'c').pounce?.canGive, true);
  assert.equal(matchView(match, 'b').pounce?.canGive, false);
  assert.ok(applyTurn(match, 'b', { type: 'respond-pounce', choice: 'give' }, 2));
  assert.equal(applyTurn(match, 'c', { type: 'respond-pounce', choice: 'give' }, 2), null);
  assert.equal(match.result, null);
  assert.equal(match.seats[0].hand.length, 1);
  assert.equal(match.seats[2].hand.length, 1);
  assert.deepEqual(matchView(match, 'b').lastAction, { type: 'pounce-response', choice: 'give', seatId: 'c' });
  assert.equal(match.turn?.seatId, 'b');
});

test('Pounce expiry draws for a human and resolves the actor’s win', () => {
  const match = startMatch(players, 'a', 0);
  match.seats[0].hand = [wild('pounce')];
  match.seats[1].hand = [fish(7)];
  assert.equal(applyTurn(match, 'a', { type: 'play', cardId: 100, targetSeatId: 'b' }, 1), null);
  assert.ok(applyTurn(match, 'b', { type: 'respond-pounce', choice: 'give' }, 2));
  assert.equal(expireTurn(match, 15_000), false);
  assert.equal(expireTurn(match, 15_001), true);
  assert.equal(match.seats[1].hand.length, 3);
  assert.deepEqual(match.result, { winnerSeatId: 'a' });
});

test('No Mercy deck deals exactly 168 authentic cards', () => {
  const deck = makeNoMercyDeck();
  assert.equal(deck.length, 168);
  assert.equal(new Set(deck.map(({ id }) => id)).size, 168);
});

test('Stacking draw penalties accumulate and require equal or higher draw values', () => {
  const three = [...players, { id: 'c', name: 'C' }];
  const match = startMatch(three, 'a', 0);
  match.discards = [paw(1)];
  const d2Card = { id: 201, suit: 'PAW' as const, action: 'd2' as const };
  const d4Card = { id: 202, suit: 'PAW' as const, action: 'd4' as const };
  const wd6Card = { id: 203, suit: null, action: 'wd6' as const };
  const wd10Card = { id: 204, suit: null, action: 'wd10' as const };
  const lowerD2 = { id: 205, suit: 'FISH' as const, action: 'd2' as const };

  match.seats[0].hand = [d2Card, paw(2)];
  match.seats[1].hand = [d4Card, fish(3)];
  match.seats[2].hand = [wd6Card, fish(4)];

  // A plays d2 (+2)
  assert.equal(applyTurn(match, 'a', { type: 'play', cardId: 201 }, 1), null);
  assert.equal(match.pendingDraw, 2);
  assert.equal(match.turn?.seatId, 'b');

  // B stacks d4 (+4) -> pending is now 6
  assert.equal(applyTurn(match, 'b', { type: 'play', cardId: 202 }, 2), null);
  assert.equal(match.pendingDraw, 6);
  assert.equal(match.turn?.seatId, 'c');

  // C stacks wd6 (+6) -> pending is now 12
  assert.equal(applyTurn(match, 'c', { type: 'play', cardId: 203, suit: 'PAW' }, 3), null);
  assert.equal(match.pendingDraw, 12);
  assert.equal(match.turn?.seatId, 'a');

  // A cannot play a lower draw card (e.g. +2 on +6)
  match.seats[0].hand = [lowerD2, paw(2)];
  assert.ok(applyTurn(match, 'a', { type: 'play', cardId: 205 }, 4));

  // A takes the penalty and draws 12 cards
  match.drawPile = Array.from({ length: 20 }, (_, i) => paw(i % 10));
  assert.equal(applyTurn(match, 'a', { type: 'draw' }, 5), null);
  assert.equal(match.pendingDraw, 0);
  assert.equal(match.seats[0].hand.length, 14);
  assert.equal(match.turn?.seatId, 'b');
});

test('Discard All drops every card of that color from the hand', () => {
  const match = startMatch(players, 'a', 0);
  match.discards = [paw(1)];
  const discardCard = { id: 301, suit: 'PAW' as const, action: 'discard' as const };
  match.seats[0].hand = [discardCard, paw(3), paw(7), fish(4), fish(9)];

  assert.equal(applyTurn(match, 'a', { type: 'play', cardId: 301 }, 1), null);
  // All PAW cards discarded, only fish cards remain
  assert.equal(match.seats[0].hand.length, 2);
  assert.ok(match.seats[0].hand.every((c) => c.suit === 'FISH'));
  assert.equal(match.turn?.seatId, 'b');
});

test('Skip Everyone skips all other players and gives the player another turn', () => {
  const three = [...players, { id: 'c', name: 'C' }];
  const match = startMatch(three, 'a', 0);
  match.discards = [paw(1)];
  const skipAllCard = { id: 401, suit: 'PAW' as const, action: 'skipall' as const };
  match.seats[0].hand = [skipAllCard, paw(5)];

  assert.equal(applyTurn(match, 'a', { type: 'play', cardId: 401 }, 1), null);
  // Turn stays with 'a'
  assert.equal(match.turn?.seatId, 'a');
  assert.equal(match.seats[0].hand.length, 1);
});

test('Rank 7 swaps hands with chosen opponent', () => {
  const match = startMatch(players, 'a', 0);
  match.discards = [paw(1)];
  const rank7 = { id: 501, suit: 'PAW' as const, rank: 7 };
  match.seats[0].hand = [rank7, paw(2)];
  match.seats[1].hand = [fish(5), fish(6), fish(7), fish(8)];

  assert.equal(applyTurn(match, 'a', { type: 'play', cardId: 501, targetSeatId: 'b' }, 1), null);
  // 'a' now holds B's 4 cards, B holds the remaining card from A's hand
  assert.equal(match.seats[0].hand.length, 4);
  assert.equal(match.seats[1].hand.length, 1);
  assert.deepEqual(match.seats[1].hand[0], paw(2));
});

test('Rank 0 rotates all hands in current play direction', () => {
  const three = [...players, { id: 'c', name: 'C' }];
  const match = startMatch(three, 'a', 0);
  match.discards = [paw(1)];
  const rank0 = { id: 601, suit: 'PAW' as const, rank: 0 };
  match.seats[0].hand = [rank0, paw(1)]; // A has 1 after play
  match.seats[1].hand = [fish(2), fish(3)]; // B has 2
  match.seats[2].hand = [fish(4), fish(5), fish(6)]; // C has 3

  assert.equal(applyTurn(match, 'a', { type: 'play', cardId: 601 }, 1), null);
  // In clockwise order: A's hand goes to B, B's hand goes to C, C's hand goes to A
  assert.equal(match.seats[0].hand.length, 3);
  assert.equal(match.seats[1].hand.length, 1);
  assert.equal(match.seats[2].hand.length, 2);
});

test('Mercy rule knocks out any player reaching 25 cards', () => {
  const match = startMatch(players, 'a', 0, undefined, { noMercyRules: true });
  match.discards = [paw(1)];
  match.seats[0].hand = [paw(2)];
  match.seats[1].hand = Array.from({ length: 24 }, (_, i) => fish(i % 10));
  match.drawPile = [fish(9), fish(8)];
  match.turn = { seatId: 'b', deadline: 30_000 };

  // B draws 1 card, reaching 25 cards -> knockout!
  assert.equal(applyTurn(match, 'b', { type: 'draw' }, 1), null);
  assert.equal(match.seats[1].out, true);
  assert.equal(match.seats[1].hand.length, 0);
  // Only 'a' remains -> 'a' wins by Mercy knockout
  assert.deepEqual(match.result, { winnerSeatId: 'a' });
});

test('Wild Color Roulette forces target to draw until chosen suit appears', () => {
  const match = startMatch(players, 'a', 0);
  match.discards = [paw(1)];
  const roulCard = { id: 701, suit: null, action: 'roul' as const };
  match.seats[0].hand = [roulCard, paw(3)];
  match.seats[1].hand = [fish(4)];
  // Deck: two FISH cards, then one BELL card
  match.drawPile = [fish(1), fish(2), { id: 702, suit: 'BELL' as const, rank: 5 }];

  // A plays Roulette
  assert.equal(applyTurn(match, 'a', { type: 'play', cardId: 701 }, 1), null);
  assert.equal(match.roulette?.targetSeatId, 'b');
  assert.equal(match.turn?.seatId, 'b');

  // B chooses BELL -> draws until BELL (draws 3 cards total)
  assert.equal(applyTurn(match, 'b', { type: 'roulette-color', suit: 'BELL' }, 2), null);
  assert.equal(match.seats[1].hand.length, 4); // 1 original + 3 drawn
  assert.equal(match.wildSuit, 'BELL');
  // B's turn was skipped, turn returns to A
  assert.equal(match.turn?.seatId, 'a');
});

test('Calling UNO protects from penalty; forgetting UNO draws 2 cards penalty', () => {
  const match = startMatch(players, 'a', 0, undefined, { unoRules: true });
  match.discards = [paw(1)];
  match.seats[0].hand = [paw(2), paw(3)];
  match.seats[1].hand = [fish(5), fish(6)];
  match.drawPile = [fish(1), fish(2), fish(3)];

  // A plays without calling UNO -> forgotten penalty!
  assert.equal(applyTurn(match, 'a', { type: 'play', cardId: paw(2).id }, 1), null);
  // A played 1 card from 2, so should have had 1, but forgot UNO -> draws 2 cards penalty -> 3 cards
  assert.equal(match.seats[0].hand.length, 3);

  // Now test with UNO call
  const match2 = startMatch(players, 'a', 0, undefined, { unoRules: true });
  match2.discards = [paw(1)];
  match2.seats[0].hand = [paw(2), paw(3)];
  match2.seats[1].hand = [fish(5), fish(6)];
  match2.drawPile = [fish(1), fish(2)];

  // A calls UNO first
  assert.equal(applyTurn(match2, 'a', { type: 'call-uno' }, 1), null);
  assert.equal(match2.seats[0].unoCalled, true);
  // Now A plays -> leaves 1 card with NO penalty
  assert.equal(applyTurn(match2, 'a', { type: 'play', cardId: paw(2).id }, 2), null);
  assert.equal(match2.seats[0].hand.length, 1);
});

