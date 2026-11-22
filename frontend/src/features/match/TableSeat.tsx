import type { MatchView } from '@meow-table/protocol';

type Props = {
  seat: MatchView['seats'][number];
  active: boolean;
  away: boolean;
  local?: boolean;
};

export function TableSeat({ seat, active, away, local }: Props) {
  const isDanger = seat.cardCount >= 20 && !seat.out && !seat.forfeited;

  return (
    <div
      id={`seat-${seat.id}`}
      className={`table-seat ${isDanger ? 'ring-2 ring-red-500/80' : ''} ${seat.out ? 'opacity-40' : ''}`}
      aria-current={active ? 'true' : undefined}
    >
      {!local && (
        <div aria-hidden="true" className="seat-fan">
          {Array.from({ length: Math.min(seat.cardCount, 8) }, (_, index) => (
            <span key={index} />
          ))}
        </div>
      )}
      <div className="seat-name flex items-center gap-1.5">
        <span className="min-w-0 truncate font-semibold" title={seat.name}>
          {seat.name}
          {local ? ' (you)' : ''}
        </span>
        <span className={`shrink-0 text-xs tabular-nums font-bold ${isDanger ? 'text-red-400' : ''}`}>
          {seat.cardCount} <span className="sr-only">cards</span>
        </span>
      </div>
      {seat.out ? (
        <span className="text-xs font-bold text-red-400">💀 Knockout</span>
      ) : seat.forfeited ? (
        <span className="text-xs text-muted">Left</span>
      ) : away ? (
        <span className="text-xs text-muted">Away</span>
      ) : null}
      {seat.uno && !seat.out && !seat.forfeited && (
        <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black tracking-wider text-black shadow-md flex items-center gap-0.5 animate-bounce">
          🐾 MEOW!
        </span>
      )}
    </div>
  );
}
