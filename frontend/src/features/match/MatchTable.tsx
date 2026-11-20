import { useEffect, useState } from 'react';
import { suits } from '@meow-table/protocol';
import type { Card, MatchAction, MatchView, RoomView } from '@meow-table/protocol';
import { LeaveRoomButton } from '../../components/LeaveRoomButton';
import { actionDetails, CardFace, cardName, suitNames } from './CardFace';
import { TableSeat } from './TableSeat';

function useRemainingTime(deadline: number | undefined, serverTime: number, receivedAt: number) {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    if (deadline === undefined) return;
    const interval = window.setInterval(() => setNow(performance.now()), 100);
    return () => window.clearInterval(interval);
  }, [deadline]);
  return deadline === undefined ? 0 : Math.max(0, deadline - serverTime - Math.max(0, now - receivedAt));
}

type Props = {
  room: RoomView;
  match: MatchView;
  seatId: string;
  connected: boolean;
  receivedAt: number;
  error: string;
  onAction: (action: MatchAction) => void;
  onReconnect: () => void;
  onLeave: () => void;
};

export function MatchTable({ room, match, seatId, connected, receivedAt, error, onAction, onReconnect, onLeave }: Props) {
  const [selection, setSelection] = useState<{ cardId: number; revision: number } | null>(null);
  const myTurn = match.turn?.seatId === seatId;
  const remainingTime = useRemainingTime(match.turn?.deadline, room.serverTime, receivedAt);
  const canAct = connected && myTurn && remainingTime > 0;
  const moveRevision = room.matchRevision ?? room.revision;
  const selected = canAct && selection?.revision === moveRevision
    ? match.hand.find(({ id }) => id === selection.cardId) : undefined;
  const canRespond = canAct && match.pounce?.targetSeatId === seatId;
  const activeSeat = match.seats.find(({ id }) => id === match.turn?.seatId);
  const ownIndex = match.seats.findIndex(({ id }) => id === seatId);
  const self = match.seats[ownIndex];
  const opponents = [...match.seats.slice(ownIndex + 1), ...match.seats.slice(0, ownIndex)];
  const winner = match.seats.find(({ id }) => id === match.result?.winnerSeatId);
  const status = match.result
    ? winner ? winner.id === seatId ? 'You won!' : `${winner.name} won` : 'Match drawn'
    : match.pounce ? myTurn ? 'Answer Pounce' : `${activeSeat?.name} is answering Pounce`
      : myTurn ? 'Your turn' : `${activeSeat?.name}’s turn`;
  const host = room.hostSeatId === seatId;
  const canRematch = room.players.filter((player) => player.connected).length >= 2;
  const last = match.lastAction;
  const lastName = match.seats.find(({ id }) => id === last?.seatId)?.name;
  const activity = last && `${last.seatId === seatId ? 'You' : lastName} ${
    last.type === 'play' ? `played ${cardName(last.card)}` : last.type === 'draw' ? 'drew a card'
      : last.type === 'pass' ? 'kept the drawn card' : last.choice === 'give' ? 'gave a card'
        : last.choice === 'draw' ? 'took the Pounce draw' : 'left during Pounce'}.`;

  function play(card: Card) {
    if ('action' in card && card.suit === null) {
      setSelection({ cardId: card.id, revision: moveRevision });
    } else {
      onAction({ type: 'play', cardId: card.id });
    }
  }

  return (
    <section className="mt-6 space-y-5" aria-label="Match table">
      <div className="game-table" data-opponents={opponents.length}>
        <div className="felt-surface" aria-hidden="true" />
        {opponents.map((seat, index) => (
          <div className="opponent" data-position={index + 1} key={seat.id}>
            <TableSeat seat={seat} active={match.turn?.seatId === seat.id}
              away={room.players.some(({ id, connected }) => id === seat.id && !connected)} />
          </div>
        ))}
        <div className="table-center grid justify-items-center gap-3">
          <div className="flex max-w-full items-baseline gap-3 text-center">
            <h2 className="min-w-0 wrap-anywhere text-xl font-semibold" role="status">
              {match.turn && remainingTime === 0 ? 'Updating turn…' : status}
            </h2>
            {match.turn && !activeSeat?.bot && remainingTime > 0 &&
              <span className="whitespace-nowrap text-sm tabular-nums">{Math.ceil(remainingTime / 1_000)} s</span>}
          </div>
          <div className="flex items-start gap-5 sm:gap-8">
            <div className="text-center">
              <button type="button" className="card-back" aria-label={`Draw card, ${match.drawCount} in draw pile`}
                disabled={!canAct || !match.canDraw || !!selected} onClick={() => onAction({ type: 'draw' })}>
                <span className="card-back-brand">
                  <img src="/branding/mark.svg" width="48" height="48" alt="" />
                  <span>Meow Table</span>
                </span>
              </button>
              <p className="mt-2 text-sm font-medium">Draw · {match.drawCount}</p>
            </div>
            <div className="text-center">
              <div role="img" aria-label={cardName(match.discard)}><CardFace card={match.discard} /></div>
              <p className="mt-2 text-sm font-medium">Discard</p>
            </div>
          </div>
          <p className="text-sm">Active suit <strong>{suitNames[match.activeSuit]}</strong> · {match.direction === -1 ? 'Counterclockwise' : 'Clockwise'}</p>
          {canAct && !match.pounce && <p className="max-w-64 text-center text-sm">
            {match.canPass ? 'Play the card you drew or pass.'
              : match.playableIds.length ? 'Match the suit, rank, or action.' : 'Draw a card to continue.'}
          </p>}
          {match.canPass && <button type="button" className="ui-button" disabled={!canAct || !!selected}
            onClick={() => onAction({ type: 'pass' })}>Pass and keep card</button>}
          {canRespond && <div className="flex flex-wrap justify-center gap-2">
            <button type="button" className="ui-button ui-button-primary" onClick={() => onAction({ type: 'respond-pounce', choice: 'draw' })}>Draw two</button>
            <button type="button" className="ui-button" disabled={!match.pounce?.canGive}
              onClick={() => onAction({ type: 'respond-pounce', choice: 'give' })}>Give a random card</button>
          </div>}
        </div>
        {self && <div className="table-self"><TableSeat seat={self} active={myTurn} away={!connected} local /></div>}
      </div>
      {activity && <p className="text-center text-sm text-muted wrap-anywhere">{activity}</p>}

      <div className="text-center">
        <h2 className="font-semibold">Your hand <span className="ml-1 text-sm font-normal text-muted">{match.hand.length}</span></h2>
        {error && <p className="mt-2 text-sm text-red-200" role="alert">{error}</p>}
        {selected && 'action' in selected && <div className="mt-3 grid justify-items-center gap-2" aria-label="Card choice">
          <p className="text-sm">{selected.action === 'pounce' ? 'Choose an opponent for Pounce.' : 'Choose the next active suit.'}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {selected.action === 'pounce'
              ? opponents.filter(({ forfeited }) => !forfeited).map((opponent) =>
                <button key={opponent.id} type="button" className="ui-button ui-button-primary"
                  onClick={() => onAction({ type: 'play', cardId: selected.id, targetSeatId: opponent.id })}>{opponent.name}</button>)
              : suits.map((suit) => <button key={suit} type="button" className="ui-button ui-button-primary"
                onClick={() => onAction({ type: 'play', cardId: selected.id, suit })}>{suitNames[suit]}</button>)}
            <button type="button" className="ui-button" onClick={() => setSelection(null)}>Cancel choice</button>
          </div>
        </div>}
        <ul className="flex flex-wrap justify-center gap-2 py-3">
          {match.hand.map((card) => (
            <li key={card.id}>
              <button type="button" aria-label={`Play ${cardName(card)}`} className="hand-card"
                disabled={!canAct || !match.playableIds.includes(card.id)}
                onClick={() => play(card)}>
                <CardFace card={card} />
              </button>
            </li>
          ))}
        </ul>
        {!match.hand.length && <p className="text-sm text-muted">No cards left.</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-ink/15 pt-4">
        {match.result && host && <button type="button" className="ui-button ui-button-primary" disabled={!connected || !canRematch}
          onClick={() => onAction({ type: 'rematch' })}>Rematch</button>}
        {match.result && canRematch && !host && <p className="w-full text-sm text-muted">The host can start a rematch.</p>}
        {match.result && !canRematch && <p className="w-full text-sm text-muted">A rematch needs at least two seats.</p>}
        {!connected && <button type="button" className="ui-button" onClick={onReconnect}>Reconnect</button>}
        <LeaveRoomButton onLeave={onLeave} activeMatch={!match.result} />
      </div>
      <details className="rounded-lg border border-ink/20 p-3 text-sm">
        <summary className="cursor-pointer font-medium">Action card guide</summary>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          {Object.values(actionDetails).map(({ name, rule }) => <div key={name}>
            <dt className="font-semibold">{name}</dt><dd className="text-muted">{rule}</dd>
          </div>)}
        </dl>
      </details>
    </section>
  );
}
