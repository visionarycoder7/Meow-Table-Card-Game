import { useState } from 'react';
import licenseUrl from '../../../LICENSE?url';
import { MatchTable } from '../features/match/MatchTable';
import { Lobby } from '../features/rooms/Lobby';
import { RoomEntry } from '../features/rooms/RoomEntry';
import { useLobby } from '../features/rooms/useLobby';
import { DeckMark } from './DeckMark';
import { GameToolbar } from './GameToolbar';

export function App() {
  const [invitedCode] = useState(() => new URLSearchParams(location.search).get('room') ?? '');
  const { room, seatId, connection, error, enter, send, reconnect } = useLobby(invitedCode);

  return (
    <>
    <GameToolbar />
    <main className={`mx-auto w-full px-4 sm:px-6 ${room?.match ? 'max-w-5xl py-5' : 'max-w-md py-8 sm:py-10'}`}>
      <header className="text-center">
        {!room?.match && <DeckMark />}
        <h1 className={room?.match ? 'text-2xl font-semibold tracking-tight' : 'mt-4 text-4xl font-semibold tracking-tight'}>Meow Table</h1>
        {!room && <p className="mt-2 text-base text-muted">Open a private room and invite your friends.</p>}
      </header>
      {room?.match ? <MatchTable room={room} match={room.match} seatId={seatId} connected={connection === 'connected'}
        receivedAt={room.receivedAt} error={error}
        onAction={(action) => send({ ...action, revision: action.type === 'rematch' || action.type === 'return-lobby'
          ? room.revision : room.matchRevision ?? room.revision })}
        onLeave={() => send({ type: 'leave' })} onReconnect={reconnect} />
        : room ? <Lobby room={room} seatId={seatId} connected={connection === 'connected'}
        onStart={() => send({ type: 'start', revision: room.revision })}
        onBot={(type) => send({ type, revision: room.revision })}
        onLock={(locked) => send({ type: 'lock', locked })} onLeave={() => send({ type: 'leave' })}
        onReconnect={reconnect} /> : <RoomEntry invitedCode={invitedCode} busy={connection === 'connecting'} onEnter={enter} />}
      {connection === 'connecting' && <p className="mt-4 text-sm text-muted" role="status">Connecting…</p>}
      {connection === 'disconnected' && <div className="mt-4 space-y-2">
        <p className="text-sm text-muted" role="status">Connection lost. Your seat is held for up to 60 seconds.</p>
        {!room && <button type="button" className="ui-button" onClick={reconnect}>Reconnect</button>}
      </div>}
      {error && !room?.match && <p className="mt-4 rounded-lg border border-red-300/25 bg-red-400/10 px-3 py-2 text-sm text-red-200" role="alert">{error}</p>}
      <footer className="mt-8 flex justify-center gap-4 text-sm text-muted">
        {import.meta.env.VITE_PUBLIC_SOURCE_URL && <a className="underline underline-offset-4"
          href={import.meta.env.VITE_PUBLIC_SOURCE_URL} target="_blank" rel="noopener noreferrer">Source</a>}
        <a className="underline underline-offset-4" href={licenseUrl} download="LICENSE">License</a>
      </footer>
    </main>
    </>
  );
}
