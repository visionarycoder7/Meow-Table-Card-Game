/// <reference types="node" />

import assert from 'node:assert/strict';
import test from 'node:test';
import type { Card } from '@meow-table/protocol';
import { applyTurn, expireTurn, forfeitSeats, makeDeck, matchView, rematchOpener, startMatch } from './game.ts';

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
