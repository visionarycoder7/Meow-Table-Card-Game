import { useState } from 'react';
import { displayNameLimit } from '@meow-table/protocol';

type Props = { invitedCode: string; busy: boolean; onEnter: (name: string, code?: string) => void };
const inputStyle = 'w-full rounded-lg border border-ink/25 bg-ink/5 px-3.5 py-3 text-base text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export function RoomEntry({ invitedCode, busy, onEnter }: Props) {
  const [name, setName] = useState('');
  const [code, setCode] = useState(invitedCode);

  return (
    <form className="mt-8 space-y-5 text-left" onSubmit={(event) => {
      event.preventDefault();
      onEnter(name, code);
    }}>
      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="player-name">Your name</label>
        <input id="player-name" className={inputStyle} value={name} onChange={(event) => setName(event.target.value)}
          maxLength={displayNameLimit} autoComplete="nickname" placeholder="How friends will see you" required />
      </div>
      <button type="button" onClick={() => onEnter(name)} disabled={busy}
        className="w-full rounded-lg bg-accent px-4 py-3 text-base font-semibold text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60">
        Create room
      </button>
      <div className="border-t border-ink/15 pt-5">
        <label className="mb-2 block text-sm font-medium" htmlFor="room-code">Room code</label>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input id="room-code" className={`${inputStyle} min-w-0 uppercase tracking-wide`} value={code}
            onChange={(event) => setCode(event.target.value)} maxLength={8} autoComplete="off" spellCheck={false} />
          <button disabled={busy} className="rounded-lg border border-ink/30 px-4 py-3 text-base font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60">
            Join room
          </button>
        </div>
      </div>
    </form>
  );
}
