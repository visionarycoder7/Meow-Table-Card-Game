import type { MatchView } from '@meow-table/protocol';

type Props = {
  seat: MatchView['seats'][number];
  active: boolean;
  away: boolean;
  local?: boolean;
};

export function TableSeat({ seat, active, away, local }: Props) {
  return (
    <div className="table-seat" aria-current={active ? 'true' : undefined}>
      {!local && <div aria-hidden="true" className="seat-fan">
        {Array.from({ length: Math.min(seat.cardCount, 5) }, (_, index) => <span key={index} />)}
      </div>}
      <div className="seat-name">
        <span className="min-w-0 truncate font-semibold" title={seat.name}>{seat.name}{local ? ' (you)' : ''}</span>
        <span className="shrink-0 text-xs tabular-nums">{seat.cardCount} <span className="sr-only">cards</span></span>
      </div>
      {seat.forfeited ? <span className="text-xs">Left</span> : away ? <span className="text-xs">Away</span> : null}
    </div>
  );
}
