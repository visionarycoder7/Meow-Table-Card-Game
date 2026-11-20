import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeDisplayName, normalizeRoomCode } from '@meow-table/protocol';
import type { RoomCommand, RoomEvent, RoomView } from '@meow-table/protocol';

const seatKey = (code: string) => `meow-table:seat:${code}`;
type ReceivedRoom = RoomView & { receivedAt: number };

function saveSeat(code: string, token: string | null) {
  try {
    if (token) sessionStorage.setItem(seatKey(code), token);
    else sessionStorage.removeItem(seatKey(code));
  } catch {
    // A tab can still play when storage is unavailable, but refresh cannot recover its seat.
  }
}

function readSeat(code: string): string | null {
  try {
    return sessionStorage.getItem(seatKey(code));
  } catch {
    return null;
  }
}

function showRoomInUrl(code?: string) {
  const url = new URL(location.href);
  if (code) url.searchParams.set('room', code);
  else url.searchParams.delete('room');
  history.replaceState(null, '', url);
}

export function useLobby(invitedCode: string) {
  const socket = useRef<WebSocket | null>(null);
  const seat = useRef<{ code: string; token: string } | null>(null);
  const [room, setRoom] = useState<ReceivedRoom | null>(null);
  const [seatId, setSeatId] = useState('');
  const [connection, setConnection] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle');
  const [error, setError] = useState('');

  const clearSeat = useCallback(() => {
    if (seat.current) saveSeat(seat.current.code, null);
    seat.current = null;
    showRoomInUrl();
    setRoom(null);
    setSeatId('');
    setConnection('idle');
  }, []);

  const connect = useCallback((target: string, command: RoomCommand) => {
    socket.current?.close();
    const url = new URL(`/ws/rooms/${target}`, location.href);
    url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const next = new WebSocket(url);
    socket.current = next;
    setError('');
    setConnection('connecting');

    next.addEventListener('open', () => next.send(JSON.stringify(command)), { once: true });
    next.addEventListener('message', ({ data }) => {
      if (socket.current !== next) return;
      const event = JSON.parse(String(data)) as RoomEvent;
      const receivedAt = performance.now();
      switch (event.type) {
        case 'session':
          seat.current = { code: event.room.code, token: event.token };
          saveSeat(event.room.code, event.token);
          showRoomInUrl(event.room.code);
          setSeatId(event.seatId);
          setRoom({ ...event.room, receivedAt });
          setConnection('connected');
          break;
        case 'room':
          setRoom((current) => current && event.room.revision > current.revision
            ? { ...event.room, receivedAt } : current);
          break;
        case 'error':
          setError(event.message);
          if (command.type === 'resume' && next.readyState === WebSocket.OPEN &&
            event.message === 'Your seat has expired.') {
            saveSeat(target, null);
            clearSeat();
          }
          break;
        case 'left':
          clearSeat();
          break;
      }
    });
    next.addEventListener('error', () => {
      if (socket.current === next) setError('Could not connect. Check your connection or try again in a minute.');
    });
    next.addEventListener('close', () => {
      if (socket.current !== next) return;
      socket.current = null;
      setConnection(seat.current ? 'disconnected' : 'idle');
    });
  }, [clearSeat]);

  useEffect(() => {
    const code = normalizeRoomCode(invitedCode);
    const token = code ? readSeat(code) : null;
    if (code && token) connect(code, { type: 'resume', token });
    return () => {
      const current = socket.current;
      socket.current = null;
      current?.close();
    };
  }, [connect, invitedCode]);

  function enter(name: string, code?: string) {
    const validName = normalizeDisplayName(name);
    if (!validName) {
      setError('Enter a name between 1 and 24 characters.');
      return;
    }
    const target = code === undefined ? 'new' : normalizeRoomCode(code);
    if (!target) {
      setError('Enter the 8-character room code.');
      return;
    }
    connect(target, { type: 'enter', name: validName });
  }

  function send(command: RoomCommand) {
    const current = socket.current;
    if (current?.readyState === WebSocket.OPEN) {
      setError('');
      current.send(JSON.stringify(command));
    } else if (command.type === 'leave') {
      clearSeat();
    }
  }

  function reconnect() {
    if (seat.current) connect(seat.current.code, { type: 'resume', token: seat.current.token });
  }

  return { room, seatId, connection, error, enter, send, reconnect };
}
