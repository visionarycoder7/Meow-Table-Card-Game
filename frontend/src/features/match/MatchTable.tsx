import { useEffect, useRef, useState } from 'react';
import type { Card, MatchAction, MatchMove, MatchView, RoomView } from '@meow-table/protocol';
import { LeaveRoomButton } from '../../components/LeaveRoomButton';
import { actionDetails, CardFace, cardName, suitNames } from './CardFace';
import { CardChoice } from './CardChoice';
import { PlayerHand } from './PlayerHand';
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
  const choiceTrigger = useRef<HTMLButtonElement>(null);
  const handHeading = useRef<HTMLHeadingElement>(null);
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
  const clockwise = match.direction === 1;
  const canRematch = room.players.filter((player) => player.connected).length >= 2;
  const discardAction = 'action' in match.discard ? actionDetails[match.discard.action] : undefined;
  const last = match.lastAction;
  const lastName = match.seats.find(({ id }) => id === last?.seatId)?.name;
  const activity = last && `${last.seatId === seatId ? 'You' : lastName} ${
    last.type === 'play' ? `played ${cardName(last.card)}` : last.type === 'draw' ? last.count ? `drew ${last.count} cards` : 'drew a card'
      : last.type === 'pass' ? 'kept the drawn card' : last.choice === 'give' ? 'gave a card'
        : last.choice === 'draw' ? 'took the Pounce draw' : 'left during Pounce'}.`;

  useEffect(() => {
    if (selection && !selected && document.activeElement === document.body) handHeading.current?.focus();
  }, [selection, selected]);

  function submit(move: MatchMove, keyboard: boolean) {
    if (keyboard) handHeading.current?.focus({ preventScroll: true });
    onAction(move);
  }

  function play(card: Card, button: HTMLButtonElement, keyboard: boolean) {
    if ('action' in card && card.suit === null) {
      choiceTrigger.current = button;
      setSelection({ cardId: card.id, revision: moveRevision });
    } else {
      submit({ type: 'play', cardId: card.id }, keyboard);
    }
  }

  function cancelChoice() {
    setSelection(null);
    choiceTrigger.current?.focus();
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
          <div className="table-piles flex items-start gap-5 sm:gap-8"
            data-direction={clockwise ? 'clockwise' : 'counterclockwise'}>
            <img className="turn-track" src="/table/turn-track.svg" alt="" aria-hidden="true" />
            <div className="text-center">
              <button type="button" className="card-back" aria-label={`Draw card, ${match.drawCount} in draw pile`}
                disabled={!canAct || !match.canDraw || !!selected}
                onClick={(event) => submit({ type: 'draw' }, event.detail === 0)}>
                <span className="card-back-brand">
                  <img src="/branding/mark.svg" width="48" height="48" alt="" />
                  <span>Meow Table</span>
                </span>
              </button>
              <p className="mt-2 text-sm font-medium">Draw · {match.drawCount}</p>
            </div>
            <div className="text-center">
              <div role="img" aria-label={cardName(match.discard)}
                aria-description={discardAction?.rule}>
                <CardFace card={match.discard} />
              </div>
              <p className="mt-2 text-sm font-medium">Discard</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
            <p>Active suit <strong>{suitNames[match.activeSuit]}</strong></p>
            <p className="text-[#ffe289]" aria-live="polite">
              <span className="sr-only">Turn order </span>{clockwise ? 'Clockwise' : 'Counterclockwise'}
            </p>
          </div>
          {discardAction && <p className="max-w-64 text-center text-sm text-ink/90">{discardAction.rule}</p>}
          {canAct && !match.pounce && <p className="max-w-64 text-center text-sm">
            {match.canPass ? 'Play the card you drew or pass.'
              : match.playableIds.length ? 'Match the suit, rank, or action.'
                : match.canDeepDraw ? 'Draw one or look up to three cards deep for a match.' : 'Draw a card to continue.'}
          </p>}
          {canAct && match.canDeepDraw && <button type="button" className="ui-button"
            onClick={(event) => submit({ type: 'draw', deep: true }, event.detail === 0)}>Deep Draw</button>}
          {match.canPass && <button type="button" className="ui-button" disabled={!canAct || !!selected}
            onClick={(event) => submit({ type: 'pass' }, event.detail === 0)}>Pass and keep card</button>}
          {canRespond && <div className="flex flex-wrap justify-center gap-2">
            <button type="button" className="ui-button ui-button-primary"
              onClick={(event) => submit({ type: 'respond-pounce', choice: 'draw' }, event.detail === 0)}>Draw two</button>
            <button type="button" className="ui-button" disabled={!match.pounce?.canGive}
              onClick={(event) => submit({ type: 'respond-pounce', choice: 'give' }, event.detail === 0)}>Give a random card</button>
          </div>}
        </div>
        {self && <div className="table-self"><TableSeat seat={self} active={myTurn} away={!connected} local /></div>}
      </div>
      {activity && <p className="text-center text-sm text-muted wrap-anywhere">{activity}</p>}

      <PlayerHand cards={match.hand} playableIds={match.playableIds} canAct={canAct && !match.pounce}
        headingRef={handHeading} chosenCardId={selected?.id} onPlay={play} controls={<>
        {error && <p className="mt-2 text-sm text-red-200" role="alert">{error}</p>}
        {selected && 'action' in selected && <CardChoice cardId={selected.id} pounce={selected.action === 'pounce'}
          opponents={opponents} onPlay={submit} onCancel={cancelChoice} />}
      </>} />

      <div className="flex flex-wrap items-center gap-2 border-t border-ink/15 pt-4">
        {match.result && host && <button type="button" className="ui-button ui-button-primary" disabled={!connected || !canRematch}
          onClick={() => onAction({ type: 'rematch' })}>Rematch</button>}
        {match.result && host && <button type="button" className="ui-button" disabled={!connected}
          onClick={() => onAction({ type: 'return-lobby' })}>Back to lobby</button>}
        {match.result && canRematch && !host && <p className="w-full text-sm text-muted">The host can start a rematch.</p>}
        {match.result && !canRematch && <p className="w-full text-sm text-muted">
          {host ? 'Reopen the lobby to invite a friend or add a bot.' : 'A rematch needs at least two seats.'}
        </p>}
        {!connected && <button type="button" className="ui-button" onClick={onReconnect}>Reconnect</button>}
        <LeaveRoomButton onLeave={onLeave} activeMatch={!match.result} />
      </div>
    </section>
  );
}
