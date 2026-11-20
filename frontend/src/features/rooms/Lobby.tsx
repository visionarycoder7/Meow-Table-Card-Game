import { useState } from 'react';
import { roomCapacity } from '@meow-table/protocol';
import type { RoomView } from '@meow-table/protocol';
import { LeaveRoomButton } from '../../components/LeaveRoomButton';

type Props = {
  room: RoomView;
  seatId: string;
  connected: boolean;
  onStart: () => void;
  onBot: (action: 'add-bot' | 'remove-bot') => void;
  onLock: (locked: boolean) => void;
  onLeave: () => void;
  onReconnect: () => void;
};
const buttonStyle = 'ui-button';

export function Lobby({ room, seatId, connected, onStart, onBot, onLock, onLeave, onReconnect }: Props) {
  const [copyStatus, setCopyStatus] = useState('');
  const isHost = seatId === room.hostSeatId;
  const canLock = room.players.filter((player) => player.connected).length >= 2;
  const invite = new URL(location.origin);
  invite.searchParams.set('room', room.code);

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(invite.href);
      setCopyStatus('Invite copied.');
    } catch {
      setCopyStatus('Could not copy. Use the invite link below.');
    }
  }

  return (
    <section className="mt-8 space-y-5 text-left" aria-label="Room lobby">
      <div className="rounded-xl border border-ink/15 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted">Room code <strong className="ml-2 text-base tracking-widest text-accent">{room.code}</strong></p>
          <button type="button" className={buttonStyle} onClick={() => void copyInvite()}>Copy invite</button>
        </div>
        {copyStatus && <p className="mt-2 text-sm text-muted" role="status">{copyStatus}</p>}
        {copyStatus.startsWith('Could not') && (
          <input aria-label="Invite link" className="mt-2 w-full rounded border border-ink/25 p-2 text-sm" value={invite.href} readOnly onFocus={(event) => event.target.select()} />
        )}
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 border-b border-ink/15 pb-2">
          <h2 className="font-medium">Seats</h2>
          <p className="text-sm tabular-nums text-muted">{room.players.length} / {roomCapacity}</p>
        </div>
        <ul className="divide-y divide-ink/15">
          {room.players.map((player) => (
            <li key={player.id} className="flex items-center justify-between gap-3 py-3">
              <span className="min-w-0 wrap-anywhere">{player.name}{player.id === seatId ? ' (you)' : ''}</span>
              <span className="shrink-0 text-sm text-muted">
                {player.bot ? 'Computer' : player.connected ? player.id === room.hostSeatId ? 'Host' : 'Connected' : 'Reconnecting'}
              </span>
            </li>
          ))}
        </ul>
        {isHost && <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className={buttonStyle} disabled={!connected || room.players.length >= roomCapacity}
            onClick={() => onBot('add-bot')}>Add bot</button>
          {room.players.some(({ bot }) => bot) && <button type="button" className={buttonStyle} disabled={!connected}
            onClick={() => onBot('remove-bot')}>Remove bot</button>}
        </div>}
      </div>

      <p className="text-sm text-muted" role="status">
        {room.locked ? 'Lobby locked.' : 'Lobby open.'}
        {isHost && !canLock ? ' Invite a friend or add a bot to play solo.' : ''}
      </p>
      <div className="flex flex-wrap gap-2">
        {isHost && <button type="button" className="ui-button ui-button-primary"
          disabled={!connected || !canLock} onClick={onStart}>Start match</button>}
        {isHost && <button type="button" className={buttonStyle} disabled={!connected || (!room.locked && !canLock)}
          onClick={() => onLock(!room.locked)}>{room.locked ? 'Unlock lobby' : 'Lock lobby'}</button>}
        {!connected && <button type="button" className={buttonStyle} onClick={onReconnect}>Reconnect</button>}
        <LeaveRoomButton onLeave={onLeave} />
      </div>
    </section>
  );
}
