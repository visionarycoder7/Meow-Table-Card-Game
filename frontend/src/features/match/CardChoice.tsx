import { useId, useLayoutEffect, useRef } from 'react';
import { suits } from '@meow-table/protocol';
import type { MatchMove, MatchView } from '@meow-table/protocol';
import { suitNames, SUIT_COLORS } from './CardFace';

type Props = {
  cardId?: number;
  pounce?: boolean;
  mode?: 'suit' | 'pounce' | 'swap' | 'roulette';
  opponents: MatchView['seats'];
  onPlay: (move: MatchMove, keyboard: boolean) => void;
  onCancel?: () => void;
};

export function CardChoice({ cardId, pounce, mode, opponents, onPlay, onCancel }: Props) {
  const heading = useId();
  const group = useRef<HTMLDivElement>(null);
  const activeMode: 'suit' | 'pounce' | 'swap' | 'roulette' = mode ?? (pounce ? 'pounce' : 'suit');

  useLayoutEffect(() => {
    group.current?.querySelector('button')?.focus();
  }, [cardId, activeMode]);

  const isTarget = activeMode === 'pounce' || activeMode === 'swap';
  const title =
    activeMode === 'pounce'
      ? 'Choose an opponent for Pounce'
      : activeMode === 'swap'
        ? 'Swap hands with…'
        : activeMode === 'roulette'
          ? 'Pick a color to draw until'
          : 'Choose a color';

  return (
    <div
      ref={group}
      role="group"
      aria-labelledby={heading}
      className="mt-3 grid justify-items-center gap-2 rounded-lg border border-ink/20 bg-ink/5 p-3"
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || !onCancel) return;
        event.preventDefault();
        onCancel();
      }}
    >
      <p id={heading} className="text-sm font-semibold">
        {title}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {isTarget
          ? opponents
              .filter(({ forfeited, out }) => !forfeited && !out)
              .map((opponent) => (
                <button
                  key={opponent.id}
                  type="button"
                  className="ui-button min-w-0 wrap-anywhere"
                  onClick={(event) =>
                    cardId !== undefined &&
                    onPlay({ type: 'play', cardId, targetSeatId: opponent.id }, event.detail === 0)
                  }
                >
                  {opponent.name} ({opponent.cardCount} cards)
                </button>
              ))
          : suits.map((suit) => (
              <button
                key={suit}
                type="button"
                className="ui-button font-bold text-white shadow-sm"
                style={{ backgroundColor: SUIT_COLORS[suit] }}
                onClick={(event) => {
                  if (activeMode === 'roulette') {
                    onPlay({ type: 'roulette-color', suit }, event.detail === 0);
                  } else if (cardId !== undefined) {
                    onPlay({ type: 'play', cardId, suit }, event.detail === 0);
                  }
                }}
              >
                {suitNames[suit]}
              </button>
            ))}
        {onCancel && (
          <button type="button" className="ui-button ui-button-exit" onClick={onCancel}>
            Cancel choice
          </button>
        )}
      </div>
    </div>
  );
}
