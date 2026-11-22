import { useId, useMemo, useState } from 'react';
import type { ReactNode, Ref } from 'react';
import { suits } from '@meow-table/protocol';
import type { Card } from '@meow-table/protocol';
import { actionDetails, CardFace, cardName } from './CardFace';
import { sfx } from './sfx';

type Props = {
  cards: Card[];
  playableIds: number[];
  canAct: boolean;
  chosenCardId?: number;
  headingRef: Ref<HTMLHeadingElement>;
  controls: ReactNode;
  onPlay: (card: Card, button: HTMLButtonElement, keyboard: boolean) => void;
};

function suitOrder(card: Card) {
  return card.suit === null ? suits.length : suits.indexOf(card.suit);
}

function rankOrder(card: Card) {
  return 'rank' in card ? card.rank : 10;
}

export function PlayerHand({ cards, playableIds, canAct, chosenCardId, headingRef, controls, onPlay }: Props) {
  const [playableOnly, setPlayableOnly] = useState(false);
  const listId = useId();
  const ordered = useMemo(() => cards.slice().sort((a, b) =>
    suitOrder(a) - suitOrder(b) || rankOrder(a) - rankOrder(b) || a.id - b.id), [cards]);
  const canFilter = canAct && cards.length > 10;
  const visible = canFilter && playableOnly ? ordered.filter(({ id }) => playableIds.includes(id)) : ordered;

  return (
    <div className="text-center">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <h2 ref={headingRef} tabIndex={-1} className="font-semibold">
          Your hand <span className="ml-1 text-sm font-normal text-muted">{cards.length}</span>
        </h2>
        {canFilter && <button type="button" className="ui-button" aria-pressed={playableOnly} aria-controls={listId}
          onClick={() => setPlayableOnly((value) => !value)}>Playable only ({playableIds.length})</button>}
      </div>
      {controls}
      <ul id={listId} className="flex flex-wrap justify-center gap-2 py-3">
        {visible.map((card) => {
          const rule = 'action' in card ? actionDetails[card.action].rule : undefined;
          return <li key={card.id} title={rule}>
            <button type="button" data-card-id={card.id} aria-label={`Play ${cardName(card)}`} aria-description={rule}
              aria-expanded={chosenCardId === card.id} className="hand-card"
              disabled={!canAct || !playableIds.includes(card.id)}
              onPointerEnter={() => {
                if (canAct && playableIds.includes(card.id)) sfx.tick(0.18, 2700);
              }}
              onClick={(event) => {
                sfx.tick(0.3, 2300);
                onPlay(card, event.currentTarget, event.detail === 0);
              }}>
              <CardFace card={card} />
            </button>
          </li>;
        })}
      </ul>
      {!visible.length && <p className="text-sm text-muted">{cards.length ? 'No playable cards. Draw a card to continue.' : 'No cards left.'}</p>}
    </div>
  );
}
