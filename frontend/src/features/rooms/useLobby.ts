import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeDisplayName, normalizeRoomCode, seatExpiredCode, seatReplacedCode } from '@meow-table/protocol';
import type { RoomCommand, RoomEvent, RoomView } from '@meow-table/protocol';

const seatKey = (code: string) => `meow-table:seat:${code}`;
type ReceivedRoom = RoomView & { receivedAt: number };
const retryDelays = [500, 1_000, 2_000, 4_000];
const sessionTimeout = 12_000;

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
  const retry = useRef<{ timer?: number; attempts: number }>({ attempts: 0 });
  const [room, setRoom] = useState<ReceivedRoom | null>(null);
  const [seatId, setSeatId] = useState('');
  const [connection, setConnection] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle');
  const [error, setError] = useState('');

  const clearSeat = useCallback(() => {
    window.clearTimeout(retry.current.timer);
    retry.current = { attempts: 0 };
    const current = socket.current;
    socket.current = null;
    current?.close();
    if (seat.current) saveSeat(seat.current.code, null);
    seat.current = null;
    showRoomInUrl();
    setRoom(null);
    setSeatId('');
    setConnection('idle');
  }, []);

  const connect = useCallback((target: string, command: RoomCommand): void => {
    window.clearTimeout(retry.current.timer);
    socket.current?.close();
    const url = new URL(`/ws/rooms/${target}`, location.href);
    url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const next = new WebSocket(url);
    socket.current = next;
    setError('');
    setConnection('connecting');

    function connectionEnded(code?: number) {
      window.clearTimeout(sessionTimer);
      if (socket.current !== next) return;
      socket.current = null;
      if (code === seatExpiredCode || code === seatReplacedCode) {
        clearSeat();
        setError(code === seatExpiredCode ? 'Your seat has expired.' : 'Your seat is now open in another tab.');
        return;
      }
      const saved = seat.current;
      setConnection(saved ? 'disconnected' : 'idle');
      const delay = retryDelays[retry.current.attempts];
      if (!saved || delay === undefined) return;
      retry.current.attempts++;
      retry.current.timer = window.setTimeout(() => {
        if (seat.current === saved && !socket.current) connect(saved.code, { type: 'resume', token: saved.token });
      }, delay);
    }

    const sessionTimer = window.setTimeout(() => {
      if (socket.current !== next) return;
      connectionEnded();
      next.close();
      setError('Connection timed out. Try again.');
    }, sessionTimeout);

    next.addEventListener('open', () => {
      if (socket.current === next) next.send(JSON.stringify(command));
    }, { once: true });
    next.addEventListener('message', ({ data }) => {
      if (socket.current !== next) return;
      const event = JSON.parse(String(data)) as RoomEvent;
      const receivedAt = performance.now();
      switch (event.type) {
        case 'session':
          window.clearTimeout(sessionTimer);
          retry.current = { attempts: 0 };
          seat.current = { code: event.room.code, token: event.token };
          saveSeat(event.room.code, event.token);
          showRoomInUrl(event.room.code);
          setSeatId(event.seatId);
          setRoom({ ...event.room, receivedAt });
          setConnection('connected');
          setError('');
          break;
        case 'room':
          setRoom((current) => current && event.room.revision > current.revision
            ? { ...event.room, receivedAt } : current);
          break;
        case 'error':
          setError(event.message);
          break;
        case 'left':
          clearSeat();
          break;
      }
    });
    next.addEventListener('error', () => {
      if (socket.current === next) setError('Could not connect. Check your connection or try again in a minute.');
    });
    next.addEventListener('close', ({ code }) => connectionEnded(code), { once: true });
  }, [clearSeat]);

  useEffect(() => {
    const code = normalizeRoomCode(invitedCode);
    const token = code ? readSeat(code) : null;
    if (code && token) {
      seat.current = { code, token };
      connect(code, { type: 'resume', token });
    }
    return () => {
      window.clearTimeout(retry.current.timer);
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
    if (seat.current && !room) clearSeat();
    connect(target, { type: 'enter', name: validName });
  }

  function send(command: RoomCommand) {
    const current = socket.current;
    if (current?.readyState === WebSocket.OPEN) {
      setError('');
      current.send(JSON.stringify(command));
    } else if (command.type === 'leave') {
      clearSeat();
    } else {
      setError('Connection lost. Reconnect before trying again.');
    }
  }

  function reconnect() {
    retry.current.attempts = 0;
    if (seat.current) connect(seat.current.code, { type: 'resume', token: seat.current.token });
  }

  return { room, seatId, connection, error, enter, send, reconnect };
}
