import type { ActionName, Card } from '@meow-table/protocol';

export const suitNames = { PAW: 'Paws', BELL: 'Bells', NIP: 'Catnip', FISH: 'Fish' };
export const actionDetails: Record<ActionName, { name: string; faceLabel: string; corner: string; rule: string }> = {
  hiss: { name: 'Hiss', faceLabel: 'Skip', corner: 'H', rule: 'Skip the next seat.' },
  'tail-spin': { name: 'Tail Spin', faceLabel: 'Reverse', corner: 'TS', rule: 'Reverse direction. At two seats, take another turn.' },
  'double-treat': { name: 'Double Treat', faceLabel: 'Draw two', corner: '+2', rule: 'The next seat draws two cards and skips its turn.' },
  'curious-cat': { name: 'Curious Cat', faceLabel: 'Choose suit', corner: 'C', rule: 'Choose the next active suit.' },
  catnap: { name: 'Catnap', faceLabel: 'Draw four', corner: '+4', rule: 'Choose a suit. The next seat draws four cards and skips its turn.' },
  pounce: { name: 'Pounce', faceLabel: 'Pick rival', corner: 'P', rule: 'Pick an opponent. They can draw two cards or give you one at random if they hold at least two.' },
};

export function cardName(card: Card) {
  const suit = card.suit ? suitNames[card.suit] : '';
  if ('rank' in card) return `${suit} ${card.rank}`;
  return suit ? `${suit} ${actionDetails[card.action].name}` : actionDetails[card.action].name;
}

export function CardFace({ card }: { card: Card }) {
  const action = 'action' in card ? actionDetails[card.action] : null;
  const corner = 'rank' in card ? card.rank : action?.corner;
  const penalty = action?.corner.startsWith('+') ? action.corner : null;
  const suitIcon = card.suit && `url(/cards/suits/${card.suit.toLowerCase()}.svg)`;
  const actionIcon = 'action' in card && `url(/cards/actions/${card.action}.svg)`;

  return (
    <span className="card-face" data-suit={card.suit ?? 'wild'} data-action={action ? '' : undefined} aria-hidden="true">
      <span className="card-index card-index-start">{corner}</span>
      {'rank' in card ? <span className="card-rank">{card.rank}</span> :
        penalty ? <span className="card-rank card-penalty">{penalty}</span> :
          <span className="card-rank card-action-icon" style={{ maskImage: actionIcon || undefined }} />}
      <span className="card-suit">
        {suitIcon && <span className="card-suit-icon" style={{ maskImage: suitIcon }} />}
        {action ? action.faceLabel : card.suit && suitNames[card.suit]}
      </span>
      <span className="card-index card-index-end">{corner}</span>
    </span>
  );
}
