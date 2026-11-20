import { useState } from 'react';
import { Lobby } from '../features/rooms/Lobby';
import { RoomEntry } from '../features/rooms/RoomEntry';
import { useLobby } from '../features/rooms/useLobby';
import { DeckMark } from './DeckMark';

export function App() {
  const [invitedCode] = useState(() => new URLSearchParams(location.search).get('room') ?? '');
  const { room, seatId, connection, error, enter, send, reconnect } = useLobby(invitedCode);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-6 py-10 sm:py-14">
      <header className="text-center">
        <DeckMark />
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Meow Table</h1>
        {!room && <p className="mt-2 text-base text-muted">Open a private room and invite your friends.</p>}
      </header>
      {room ? <Lobby room={room} seatId={seatId} connected={connection === 'connected'}
        onLock={(locked) => send({ type: 'lock', locked })} onLeave={() => send({ type: 'leave' })}
        onReconnect={reconnect} /> : <RoomEntry invitedCode={invitedCode} busy={connection === 'connecting'} onEnter={enter} />}
      {connection === 'connecting' && <p className="mt-4 text-sm text-muted" role="status">Connecting…</p>}
      {connection === 'disconnected' && <p className="mt-4 text-sm text-muted" role="status">Connection lost. Your seat is held briefly.</p>}
      {error && <p className="mt-4 rounded-lg border border-red-300/25 bg-red-400/10 px-3 py-2 text-sm text-red-200" role="alert">{error}</p>}
    </main>
  );
}
