import { useId, useLayoutEffect, useRef } from 'react';
import { suits } from '@meow-table/protocol';
import type { MatchMove, MatchView } from '@meow-table/protocol';
import { suitNames } from './CardFace';

type Props = {
  cardId: number;
  pounce: boolean;
  opponents: MatchView['seats'];
  onPlay: (move: MatchMove, keyboard: boolean) => void;
  onCancel: () => void;
};

export function CardChoice({ cardId, pounce, opponents, onPlay, onCancel }: Props) {
  const heading = useId();
  const group = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    group.current?.querySelector('button')?.focus();
  }, [cardId]);

  return (
    <div ref={group} role="group" aria-labelledby={heading}
      className="mt-3 grid justify-items-center gap-2 rounded-lg border border-ink/20 bg-ink/5 p-3"
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        onCancel();
      }}>
      <p id={heading} className="text-sm font-semibold">{pounce ? 'Choose an opponent for Pounce' : 'Choose the next active suit'}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {pounce
          ? opponents.filter(({ forfeited }) => !forfeited).map((opponent) =>
            <button key={opponent.id} type="button" className="ui-button min-w-0 wrap-anywhere"
              onClick={(event) => onPlay({ type: 'play', cardId, targetSeatId: opponent.id }, event.detail === 0)}>
              {opponent.name}
            </button>)
          : suits.map((suit) => <button key={suit} type="button" className="ui-button"
            onClick={(event) => onPlay({ type: 'play', cardId, suit }, event.detail === 0)}>{suitNames[suit]}</button>)}
        <button type="button" className="ui-button" onClick={onCancel}>Cancel choice</button>
      </div>
    </div>
  );
}
