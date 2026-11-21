import { useState } from 'react';
import { displayNameLimit } from '@meow-table/protocol';

type Props = { invitedCode: string; busy: boolean; onEnter: (name: string, code?: string) => void };
const inputStyle = 'w-full rounded-lg border border-ink/25 bg-ink/5 px-3.5 py-3 text-base text-ink placeholder:text-muted focus:border-[#91ad99] focus:bg-[#1b3126] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export function RoomEntry({ invitedCode, busy, onEnter }: Props) {
  const [name, setName] = useState('');
  const [code, setCode] = useState(invitedCode);

  return (
    <form className="home-entry mt-8 space-y-5 text-left" onSubmit={(event) => {
      event.preventDefault();
      onEnter(name, code);
    }}>
      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="player-name">Your name</label>
        <input id="player-name" className={inputStyle} value={name} onChange={(event) => setName(event.target.value)}
          maxLength={displayNameLimit} autoComplete="nickname" placeholder="How friends will see you" required />
      </div>
      <button type="button" onClick={() => onEnter(name)} disabled={busy}
        className="ui-button ui-button-primary w-full">
        Create room
      </button>
      <div className="border-t border-ink/15 pt-5">
        <label className="mb-2 block text-sm font-medium" htmlFor="room-code">Room code</label>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input id="room-code" className={`${inputStyle} min-w-0 uppercase tracking-wide`} value={code}
            onChange={(event) => setCode(event.target.value)} maxLength={8} autoComplete="off" spellCheck={false} />
          <button disabled={busy} className="ui-button">
            Join room
          </button>
        </div>
      </div>
    </form>
  );
}
