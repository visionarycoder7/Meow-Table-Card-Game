import { DurableObject } from 'cloudflare:workers';
import { parseRoomCommand, roomCapacity } from '@meow-table/protocol';
import type { RoomCommand, RoomEvent, RoomView } from '@meow-table/protocol';

type Seat = { id: string; name: string; token: string; expiresAt: number | null };
type Lobby = { code: string; hostSeatId: string; locked: boolean; revision: number; players: Seat[] };
type Attachment =
  | { type: 'pending'; create: boolean; code: string; expiresAt: number }
  | { type: 'seat'; seatId: string };

const lobbyKey = 'lobby';
const joinTimeout = 10_000;
const seatGrace = 60_000;

function attachment(socket: WebSocket): Attachment | null {
  return socket.deserializeAttachment() as Attachment | null;
}

function send(socket: WebSocket, event: RoomEvent) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(event));
}

function view(lobby: Lobby): RoomView {
  return {
    code: lobby.code,
    hostSeatId: lobby.hostSeatId,
    locked: lobby.locked,
    revision: lobby.revision,
    players: lobby.players.map(({ id, name, expiresAt }) => ({ id, name, connected: expiresAt === null })),
  };
}

export class Room extends DurableObject<Env> {
  fetch(request: Request): Promise<Response> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const [, action, code] = new URL(request.url).pathname.split('/');
      const create = action === 'create';
      const sockets = this.ctx.getWebSockets();
      const lobby = await this.ctx.storage.get<Lobby>(lobbyKey);
      if (create && (lobby || sockets.length)) return new Response('Code in use', { status: 409 });
      if (sockets.length >= roomCapacity * 2) return new Response('Room is busy', { status: 503 });

      const [client, server] = Object.values(new WebSocketPair());
      const expiresAt = Date.now() + joinTimeout;
      this.ctx.acceptWebSocket(server);
      server.serializeAttachment({ type: 'pending', create, code, expiresAt } satisfies Attachment);
      await this.scheduleCleanup(expiresAt);
      return new Response(null, { status: 101, webSocket: client });
    });
  }

  webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): Promise<void> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const peer = attachment(socket);
      const command = parseRoomCommand(message);
      if (!command || !peer) return this.reject(socket, 'Invalid lobby action.');

      const lobby = await this.ctx.storage.get<Lobby>(lobbyKey);
      if (peer.type === 'pending') return this.admit(socket, peer, command, lobby);
      if (!lobby?.players.some(({ id }) => id === peer.seatId)) {
        return this.reject(socket, 'Your seat has expired.', true);
      }

      if (command.type === 'leave') {
        lobby.players = lobby.players.filter(({ id }) => id !== peer.seatId);
        socket.serializeAttachment(null);
        await this.saveAndBroadcast(lobby);
        send(socket, { type: 'left' });
        socket.close(1000);
        return;
      }
      if (command.type !== 'lock') return this.reject(socket, 'You already have a seat.');
      if (lobby.hostSeatId !== peer.seatId) return this.reject(socket, 'Only the host can change lobby access.');
      if (command.locked && lobby.players.filter(({ expiresAt }) => expiresAt === null).length < 2) {
        return this.reject(socket, 'At least two connected players are needed.');
      }
      if (lobby.locked === command.locked) return;

      lobby.locked = command.locked;
      await this.saveAndBroadcast(lobby);
    });
  }

  webSocketClose(socket: WebSocket): Promise<void> {
    if (socket.readyState === WebSocket.CLOSING) socket.close(1000);
    return this.disconnect(socket);
  }

  webSocketError(socket: WebSocket): Promise<void> {
    return this.disconnect(socket);
  }

  alarm(): Promise<void> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const now = Date.now();
      const deadlines: number[] = [];
      for (const socket of this.ctx.getWebSockets()) {
        const peer = attachment(socket);
        if (peer?.type !== 'pending') continue;
        if (peer.expiresAt <= now) this.reject(socket, 'Join request expired.', true);
        else deadlines.push(peer.expiresAt);
      }

      const lobby = await this.ctx.storage.get<Lobby>(lobbyKey);
      if (lobby) {
        const active = lobby.players.filter(({ expiresAt }) => expiresAt === null || expiresAt > now);
        if (active.length !== lobby.players.length) {
          lobby.players = active;
          await this.saveAndBroadcast(lobby);
        }
        for (const { expiresAt } of active) {
          if (expiresAt !== null) deadlines.push(expiresAt);
        }
      }
      if (deadlines.length) await this.scheduleCleanup(Math.min(...deadlines));
    });
  }

  private async admit(
    socket: WebSocket,
    peer: Extract<Attachment, { type: 'pending' }>,
    command: RoomCommand,
    lobby: Lobby | undefined,
  ) {
    if (peer.expiresAt <= Date.now()) return this.reject(socket, 'Join request expired.', true);
    if (command.type === 'resume' && lobby && !peer.create) {
      const seat = lobby.players.find(({ token }) => token === command.token);
      if (!seat || (seat.expiresAt !== null && seat.expiresAt <= Date.now())) {
        return this.reject(socket, 'Your seat has expired.', true);
      }
      for (const previous of this.ctx.getWebSockets()) {
        const oldPeer = attachment(previous);
        if (oldPeer?.type === 'seat' && oldPeer.seatId === seat.id) {
          previous.serializeAttachment(null);
          previous.close(4000, 'Seat resumed');
        }
      }
      seat.expiresAt = null;
      return this.establishSession(socket, lobby, seat);
    }

    if (command.type !== 'enter') return this.reject(socket, 'Your seat has expired.', true);
    if (!peer.create && !lobby) return this.reject(socket, 'Room not found.', true);
    if (lobby?.locked) return this.reject(socket, 'This lobby is locked.', true);
    if (lobby && lobby.players.length >= roomCapacity) return this.reject(socket, 'This room is full.', true);

    const seat: Seat = { id: crypto.randomUUID(), name: command.name, token: crypto.randomUUID(), expiresAt: null };
    const current = lobby ?? { code: peer.code, hostSeatId: seat.id, locked: false, revision: 0, players: [] };
    current.players.push(seat);
    return this.establishSession(socket, current, seat);
  }

  private async establishSession(socket: WebSocket, lobby: Lobby, seat: Seat) {
    socket.serializeAttachment({ type: 'seat', seatId: seat.id } satisfies Attachment);
    await this.saveAndBroadcast(lobby, socket);
    send(socket, { type: 'session', seatId: seat.id, token: seat.token, room: view(lobby) });
  }

  private disconnect(socket: WebSocket): Promise<void> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const peer = attachment(socket);
      if (peer?.type !== 'seat') return;
      socket.serializeAttachment(null);
      const lobby = await this.ctx.storage.get<Lobby>(lobbyKey);
      const seat = lobby?.players.find(({ id }) => id === peer.seatId);
      if (!lobby || !seat || seat.expiresAt !== null) return;
      seat.expiresAt = Date.now() + seatGrace;
      await this.scheduleCleanup(seat.expiresAt);
      await this.saveAndBroadcast(lobby);
    });
  }

  private async saveAndBroadcast(lobby: Lobby, except?: WebSocket) {
    const remaining = lobby.players[0];
    if (!remaining) {
      await this.ctx.storage.delete(lobbyKey);
      return;
    }
    if (!lobby.players.some(({ id }) => id === lobby.hostSeatId)) {
      lobby.hostSeatId = (lobby.players.find(({ expiresAt }) => expiresAt === null) ?? remaining).id;
    }
    lobby.revision++;
    await this.ctx.storage.put(lobbyKey, lobby);
    const update: RoomEvent = { type: 'room', room: view(lobby) };
    for (const socket of this.ctx.getWebSockets()) {
      if (socket !== except && attachment(socket)?.type === 'seat') send(socket, update);
    }
  }

  private async scheduleCleanup(deadline: number) {
    const scheduled = await this.ctx.storage.getAlarm();
    if (scheduled === null || deadline < scheduled) await this.ctx.storage.setAlarm(deadline);
  }

  private reject(socket: WebSocket, message: string, close = false) {
    send(socket, { type: 'error', message });
    if (close) {
      socket.serializeAttachment(null);
      socket.close(1008);
    }
  }
}
