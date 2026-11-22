import { useEffect, useRef, useState } from 'react';
import type { Card, MatchAction, MatchMove, MatchView, RoomView } from '@meow-table/protocol';
import { LeaveRoomButton } from '../../components/LeaveRoomButton';
import { actionDetails, CardFace, cardHtml, cardName, suitNames } from './CardFace';
import { CardChoice } from './CardChoice';
import { fly } from './fly';
import { PlayerHand } from './PlayerHand';
import { sfx } from './sfx';
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
  const discardRef = useRef<HTMLDivElement>(null);
  const drawBtnRef = useRef<HTMLButtonElement>(null);
  const prevLastAction = useRef(match.lastAction);

  const myTurn = match.turn?.seatId === seatId;
  const remainingTime = useRemainingTime(match.turn?.deadline, room.serverTime, receivedAt);
  const canAct = connected && myTurn && remainingTime > 0;
  const moveRevision = room.matchRevision ?? room.revision;
  const selected = canAct && selection?.revision === moveRevision
    ? match.hand.find(({ id }) => id === selection.cardId) : undefined;
  const canRespond = canAct && match.pounce?.targetSeatId === seatId;
  const myRoulette = canAct && match.roulette?.targetSeatId === seatId;
  const activeSeat = match.seats.find(({ id }) => id === match.turn?.seatId);
  const ownIndex = match.seats.findIndex(({ id }) => id === seatId);
  const self = match.seats[ownIndex];
  const opponents = [...match.seats.slice(ownIndex + 1), ...match.seats.slice(0, ownIndex)];
  const winner = match.seats.find(({ id }) => id === match.result?.winnerSeatId);

  const status = match.result
    ? winner ? winner.id === seatId ? 'You won!' : `${winner.name} won` : 'Match drawn'
    : match.roulette ? myTurn ? 'Choose Roulette Color' : `${activeSeat?.name} is answering Roulette`
      : match.pounce ? myTurn ? 'Answer Pounce' : `${activeSeat?.name} is answering Pounce`
        : myTurn ? 'Your turn' : `${activeSeat?.name}’s turn`;

  const host = room.hostSeatId === seatId;
  const clockwise = match.direction === 1;
  const canRematch = room.players.filter((player) => player.connected).length >= 2;
  const discardAction = 'action' in match.discard ? actionDetails[match.discard.action] : undefined;
  const last = match.lastAction;
  const lastName = match.seats.find(({ id }) => id === last?.seatId)?.name;

  const activity = last && `${last.seatId === seatId ? 'You' : lastName} ${
    last.type === 'play'
      ? `played ${cardName(last.card)}`
      : last.type === 'draw'
        ? last.count ? `drew ${last.count} cards` : 'drew a card'
        : last.type === 'pass'
          ? 'kept the drawn card'
          : last.type === 'call-uno'
            ? 'called MEOW! 🐾'
            : last.type === 'roulette'
              ? `chose ${suitNames[last.suit]} and drew ${last.drawnCount} cards (turn skipped)`
              : last.choice === 'give'
                ? 'gave a card'
                : last.choice === 'draw'
                  ? 'took the Pounce draw'
                  : 'left during Pounce'
  }.`;

  // Sound effects and animation when actions arrive
  useEffect(() => {
    const action = match.lastAction;
    if (!action || action === prevLastAction.current) return;
    prevLastAction.current = action;

    if (action.type === 'play') {
      sfx.playGo();
      setTimeout(() => sfx.playEnd(), 400);
      if (discardRef.current) {
        const destRect = discardRef.current.getBoundingClientRect();
        let startRect: DOMRect | null = null;
        if (action.seatId === seatId) {
          const handBtn = document.querySelector(`[data-card-id="${action.card.id}"]`);
          if (handBtn) startRect = handBtn.getBoundingClientRect();
        } else {
          const seatEl = document.getElementById(`seat-${action.seatId}`);
          if (seatEl) startRect = seatEl.getBoundingClientRect();
        }
        if (startRect) {
          fly(cardHtml(action.card), startRect, destRect, 560, 0, undefined, 'play');
        }
      }
    } else if (action.type === 'draw') {
      sfx.drawGo();
      setTimeout(() => sfx.drawEnd(), 400);
      if (drawBtnRef.current) {
        const deckRect = drawBtnRef.current.getBoundingClientRect();
        let targetRect: DOMRect | null = null;
        if (action.seatId === seatId) {
          if (handHeading.current) targetRect = handHeading.current.getBoundingClientRect();
        } else {
          const seatEl = document.getElementById(`seat-${action.seatId}`);
          if (seatEl) targetRect = seatEl.getBoundingClientRect();
        }
        if (targetRect) {
          const count = Math.min(action.count ?? 1, 6);
          for (let i = 0; i < count; i++) {
            fly(
              '<div class="card back"><b>NO<br>MERCY</b></div>',
              deckRect,
              targetRect,
              420,
              i * 100,
              undefined,
              'draw'
            );
          }
        }
      }
    } else if (action.type === 'call-uno') {
      sfx.meow();
    } else if (action.type === 'roulette') {
      sfx.skip();
    }
  }, [match.lastAction, seatId]);

  useEffect(() => {
    if (selection && !selected && document.activeElement === document.body) handHeading.current?.focus();
  }, [selection, selected]);

  function submit(move: MatchMove, keyboard: boolean) {
    if (keyboard) handHeading.current?.focus({ preventScroll: true });
    onAction(move);
  }

  function play(card: Card, button: HTMLButtonElement, keyboard: boolean) {
    if ('rank' in card && card.rank === 7 && opponents.length > 0) {
      choiceTrigger.current = button;
      setSelection({ cardId: card.id, revision: moveRevision });
    } else if ('action' in card && card.suit === null && card.action !== 'roul') {
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

          {match.pendingDraw && match.pendingDraw > 0 ? (
            <div className="pending-draw-badge">
              +{match.pendingDraw} PENALTY STACK
            </div>
          ) : null}

          <div className="flex items-start gap-5 sm:gap-8">
            <div className="text-center">
              <button
                ref={drawBtnRef}
                id="draw-pile-btn"
                type="button"
                className="card-back"
                aria-label={`Draw card, ${match.drawCount} in draw pile`}
                disabled={!canAct || !match.canDraw || !!selected}
                onClick={(event) => submit({ type: 'draw' }, event.detail === 0)}
              >
                <span className="card-back-brand">
                  <img src="/branding/mark.svg" width="48" height="48" alt="" />
                  <span>Meow Table</span>
                </span>
              </button>
              <p className="mt-2 text-sm font-medium">
                {match.pendingDraw && match.pendingDraw > 0 ? `Draw +${match.pendingDraw}` : `Draw · ${match.drawCount}`}
              </p>
            </div>
            <div className="text-center">
              <div
                ref={discardRef}
                id="discard-pile-card"
                role="img"
                aria-label={cardName(match.discard)}
                aria-description={discardAction?.rule}
              >
                <CardFace card={match.discard} />
              </div>
              <p className="mt-2 text-sm font-medium">Discard</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
            <p>Active suit <strong>{suitNames[match.activeSuit]}</strong></p>
            <p className="turn-direction" data-direction={clockwise ? 'clockwise' : 'counterclockwise'} aria-live="polite">
              <img src="/table/turn-track.svg" width="14" height="14" alt="" />
              <span><span className="sr-only">Turn order </span>{clockwise ? 'Clockwise' : 'Counterclockwise'}</span>
            </p>
          </div>

          {discardAction && <p className="max-w-64 text-center text-sm text-ink/90">{discardAction.rule}</p>}

          {canAct && !match.pounce && !myRoulette && (
            <p className="max-w-64 text-center text-sm">
              {match.pendingDraw && match.pendingDraw > 0
                ? match.playableIds.length
                  ? `Counter with equal or higher draw card (+${match.pendingDraw} total) or take penalty.`
                  : `No higher draw card! Draw ${match.pendingDraw} penalty cards.`
                : match.canPass
                  ? 'Play the card you drew or pass.'
                  : match.playableIds.length
                    ? 'Match the suit, rank, or action.'
                    : 'Draw card(s) to continue.'}
            </p>
          )}

          {canAct && match.canDeepDraw && !match.pendingDraw && (
            <button type="button" className="ui-button"
              onClick={(event) => submit({ type: 'draw', deep: true }, event.detail === 0)}>
              Deep Draw
            </button>
          )}

          {match.canPass && (
            <button type="button" className="ui-button" disabled={!canAct || !!selected}
              onClick={(event) => submit({ type: 'pass' }, event.detail === 0)}>
              Pass and keep card
            </button>
          )}

          {canRespond && (
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" className="ui-button ui-button-primary"
                onClick={(event) => submit({ type: 'respond-pounce', choice: 'draw' }, event.detail === 0)}>
                Draw two
              </button>
              <button type="button" className="ui-button" disabled={!match.pounce?.canGive}
                onClick={(event) => submit({ type: 'respond-pounce', choice: 'give' }, event.detail === 0)}>
                Give a random card
              </button>
            </div>
          )}
        </div>
        {self && <div className="table-self"><TableSeat seat={self} active={myTurn} away={!connected} local /></div>}
      </div>

      {activity && <p className="text-center text-sm text-muted wrap-anywhere">{activity}</p>}

      {/* MEOW Call Button - press before playing second-to-last card */}
      {canAct && match.hand.length === 2 && !self?.out && (
        <div className="flex justify-center my-3">
          <button
            type="button"
            className={`btn-meow ${match.canCallUno ? 'meow-pulse' : 'meow-called'}`}
            disabled={!match.canCallUno}
            onClick={() => {
              sfx.meow();
              sfx.tick(0.4, 2500);
              submit({ type: 'call-uno' }, false);
            }}
            title="Press MEOW before playing your second-to-last card!"
          >
            {match.canCallUno ? '🐾 MEOW!' : '🐾 MEOW! ✓'}
          </button>
        </div>
      )}

      <PlayerHand
        cards={match.hand}
        playableIds={match.playableIds}
        canAct={canAct && !match.pounce && !myRoulette}
        headingRef={handHeading}
        chosenCardId={selected?.id}
        onPlay={play}
        controls={<>
          {error && <p className="mt-2 text-sm text-red-200" role="alert">{error}</p>}
          {selected && (
            <CardChoice
              cardId={selected.id}
              mode={
                'rank' in selected && selected.rank === 7
                  ? 'swap'
                  : 'action' in selected && selected.action === 'pounce'
                    ? 'pounce'
                    : 'suit'
              }
              opponents={opponents}
              onPlay={submit}
              onCancel={cancelChoice}
            />
          )}
          {myRoulette && (
            <CardChoice
              mode="roulette"
              opponents={opponents}
              onPlay={submit}
            />
          )}
        </>}
      />

      <div className="flex flex-wrap items-center gap-2 border-t border-ink/15 pt-4">
        {match.result && host && <button type="button" className="ui-button ui-button-primary" disabled={!connected || !canRematch}
          onClick={() => onAction({ type: 'rematch' })}>Rematch</button>}
        {match.result && host && <button type="button" className="ui-button ui-button-exit" disabled={!connected}
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
