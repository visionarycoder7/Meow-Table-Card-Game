import { DurableObject } from 'cloudflare:workers';
import { parseRoomCommand, roomCapacity, seatExpiredCode, seatReplacedCode } from '@meow-table/protocol';
import type { RoomCommand, RoomEvent, RoomView } from '@meow-table/protocol';
import { applyTurn, expireTurn, forfeitSeats, matchView, rematchOpener, startMatch } from './game';
import type { Match } from './game';

type Seat = { id: string; name: string; token: string; expiresAt: number | null };
type BotSeat = { id: string; name: string; bot: true };
type Lobby = { code: string; hostSeatId: string; locked: boolean; revision: number; players: Seat[]; bots?: BotSeat[]; match?: Match; matchRevision?: number };
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

function view(lobby: Lobby, seatId: string): RoomView {
  return {
    code: lobby.code,
    hostSeatId: lobby.hostSeatId,
    locked: lobby.locked,
    revision: lobby.revision,
    matchRevision: lobby.match && (lobby.matchRevision ?? lobby.revision),
    serverTime: Date.now(),
    players: [
      ...lobby.players.map(({ id, name, expiresAt }) => ({ id, name, connected: expiresAt === null })),
      ...(lobby.bots ?? []).map((bot) => ({ ...bot, connected: true })),
    ],
    match: lobby.match && matchView(lobby.match, seatId),
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
        return this.reject(socket, 'Your seat has expired.', seatExpiredCode);
      }

      if (command.type === 'leave') {
        lobby.players = lobby.players.filter(({ id }) => id !== peer.seatId);
        if (lobby.match) forfeitSeats(lobby.match, [peer.seatId], Date.now());
        socket.serializeAttachment(null);
        await this.saveAndBroadcast(lobby, undefined, Boolean(lobby.match));
        send(socket, { type: 'left' });
        socket.close(1000);
        return;
      }
      if (command.type === 'emote') {
        const emoteEvent: RoomEvent = {
          type: 'emote',
          seatId: peer.seatId,
          emote: command.emote,
          timestamp: Date.now(),
        };
        for (const s of this.ctx.getWebSockets()) {
          const p = attachment(s);
          if (p?.type === 'seat') {
            send(s, emoteEvent);
          }
        }
        return;
      }
      if ('revision' in command) return this.applyMatchAction(socket, lobby, peer.seatId, command);
      if (command.type !== 'lock') return this.reject(socket, 'You already have a seat.');
      if (lobby.match) return this.reject(socket, 'Room access is locked during the match and rematch.');
      if (lobby.hostSeatId !== peer.seatId) return this.reject(socket, 'Only the host can change lobby access.');
      if (command.locked && lobby.players.filter(({ expiresAt }) => expiresAt === null).length + (lobby.bots?.length ?? 0) < 2) {
        return this.reject(socket, 'Invite a player or add a bot first.');
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
        if (this.expireMatchAndSeats(lobby, now)) await this.saveAndBroadcast(lobby, undefined, Boolean(lobby.match));
        for (const { expiresAt } of lobby.players) {
          if (expiresAt !== null) deadlines.push(expiresAt);
        }
        if (lobby.match?.turn) deadlines.push(lobby.match.turn.deadline);
      }
      if (deadlines.length) await this.scheduleCleanup(Math.min(...deadlines));
    });
  }

  private expireMatchAndSeats(lobby: Lobby, now: number) {
    const expired = lobby.players.filter(({ expiresAt }) => expiresAt !== null && expiresAt <= now);
    if (expired.length) {
      lobby.players = lobby.players.filter((seat) => !expired.includes(seat));
      if (lobby.match) forfeitSeats(lobby.match, expired.map(({ id }) => id), now);
    }
    const turnExpired = lobby.match ? expireTurn(lobby.match, now) : false;
    return expired.length > 0 || turnExpired;
  }

  private async applyMatchAction(socket: WebSocket, lobby: Lobby, seatId: string,
    command: Extract<RoomCommand, { revision: number }>) {
    const now = Date.now();
    const isMove = command.type === 'play' || command.type === 'draw' || command.type === 'pass' ||
      command.type === 'respond-pounce' || command.type === 'call-uno' || command.type === 'roulette-color';
    const turnExpired = isMove && lobby.match?.turn?.seatId === seatId && lobby.match.turn.deadline <= now;
    if (this.expireMatchAndSeats(lobby, now)) await this.saveAndBroadcast(lobby, undefined, Boolean(lobby.match));
    if (turnExpired) return this.reject(socket, 'Time ran out before that move reached the table.');
    const revision = isMove ? lobby.matchRevision ?? lobby.revision : lobby.revision;
    if (command.revision !== revision) return this.reject(socket, 'The table changed. Try again.');

    if (command.type === 'add-bot' || command.type === 'remove-bot') {
      if (lobby.hostSeatId !== seatId || lobby.match) return this.reject(socket, 'Only the host can change bots before a match.');
      const bots = lobby.bots ??= [];
      if (command.type === 'add-bot') {
        if (lobby.players.length + bots.length >= roomCapacity) return this.reject(socket, 'This room is full.');
        bots.push({ id: crypto.randomUUID(), name: `Bot ${bots.length + 1}`, bot: true });
      } else if (!bots.pop()) {
        return this.reject(socket, 'There are no bots to remove.');
      }
    } else if (command.type === 'return-lobby') {
      if (lobby.hostSeatId !== seatId || !lobby.match?.result) {
        return this.reject(socket, 'Only the host can reopen a finished table.');
      }
      delete lobby.match;
      delete lobby.matchRevision;
      lobby.locked = false;
    } else if (command.type === 'start' || command.type === 'rematch') {
      if (lobby.hostSeatId !== seatId) return this.reject(socket, 'Only the host can start a match.');
      const previous = lobby.match;
      if (command.type === 'start' ? previous : !previous?.result) {
        return this.reject(socket, 'A match cannot start from this table state.');
      }
      const connected = lobby.players.filter(({ expiresAt }) => expiresAt === null);
      const roster = [...connected, ...(lobby.bots ?? [])];
      if (roster.length < 2) return this.reject(socket, 'Invite a player or add a bot first.');
      lobby.players = connected;
      lobby.locked = true;
      lobby.match = startMatch(roster, previous ? rematchOpener(previous, roster) : seatId, now, undefined, { noMercyRules: true, unoRules: true });
    } else if (isMove) {
      if (!lobby.match) return this.reject(socket, 'Start a match first.');
      const error = applyTurn(lobby.match, seatId, command, now);
      if (error) return this.reject(socket, error);
    }
    await this.saveAndBroadcast(lobby, undefined, Boolean(lobby.match));
  }

  private async admit(
    socket: WebSocket,
    peer: Extract<Attachment, { type: 'pending' }>,
    command: RoomCommand,
    lobby: Lobby | undefined,
  ) {
    const now = Date.now();
    if (peer.expiresAt <= now) return this.reject(socket, 'Join request expired.', true);
    // An alarm can run after a resume arrives, so settle expired choices and seats before sending a snapshot.
    if (lobby && this.expireMatchAndSeats(lobby, now)) {
      await this.saveAndBroadcast(lobby, undefined, Boolean(lobby.match));
      if (!lobby.players.length) lobby = undefined;
    }
    if (command.type === 'resume' && lobby && !peer.create) {
      const seat = lobby.players.find(({ token }) => token === command.token);
      if (!seat) return this.reject(socket, 'Your seat has expired.', seatExpiredCode);
      for (const previous of this.ctx.getWebSockets()) {
        const oldPeer = attachment(previous);
        if (oldPeer?.type === 'seat' && oldPeer.seatId === seat.id) {
          previous.serializeAttachment(null);
          previous.close(seatReplacedCode, 'Seat resumed');
        }
      }
      seat.expiresAt = null;
      return this.establishSession(socket, lobby, seat);
    }

    if (command.type !== 'enter') return this.reject(socket, 'Your seat has expired.', seatExpiredCode);
    if (!peer.create && !lobby) return this.reject(socket, 'Room not found.', true);
    if (lobby?.locked) return this.reject(socket, 'This lobby is locked.', true);
    if (lobby && lobby.players.length + (lobby.bots?.length ?? 0) >= roomCapacity) {
      return this.reject(socket, 'This room is full.', true);
    }

    const seat: Seat = { id: crypto.randomUUID(), name: command.name, token: crypto.randomUUID(), expiresAt: null };
    const current = lobby ?? { code: peer.code, hostSeatId: seat.id, locked: false, revision: 0, players: [] };
    current.players.push(seat);
    return this.establishSession(socket, current, seat);
  }

  private async establishSession(socket: WebSocket, lobby: Lobby, seat: Seat) {
    socket.serializeAttachment({ type: 'seat', seatId: seat.id } satisfies Attachment);
    await this.saveAndBroadcast(lobby, socket);
    send(socket, { type: 'session', seatId: seat.id, token: seat.token, room: view(lobby, seat.id) });
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

  private async saveAndBroadcast(lobby: Lobby, except?: WebSocket, matchChanged = false) {
    const remaining = lobby.players[0];
    if (!remaining) {
      await this.ctx.storage.delete(lobbyKey);
      return;
    }
    if (!lobby.players.some(({ id }) => id === lobby.hostSeatId)) {
      lobby.hostSeatId = (lobby.players.find(({ expiresAt }) => expiresAt === null) ?? remaining).id;
    }
    if (lobby.match) lobby.matchRevision = matchChanged ? lobby.revision + 1 : lobby.matchRevision ?? lobby.revision;
    lobby.revision++;
    await this.ctx.storage.put(lobbyKey, lobby);
    if (lobby.match?.turn) await this.scheduleCleanup(lobby.match.turn.deadline);
    for (const socket of this.ctx.getWebSockets()) {
      const peer = attachment(socket);
      if (socket !== except && peer?.type === 'seat') {
        send(socket, { type: 'room', room: view(lobby, peer.seatId) });
      }
    }
  }

  private async scheduleCleanup(deadline: number) {
    const scheduled = await this.ctx.storage.getAlarm();
    if (scheduled === null || deadline < scheduled) await this.ctx.storage.setAlarm(deadline);
  }

  private reject(socket: WebSocket, message: string, close: boolean | number = false) {
    send(socket, { type: 'error', message });
    if (close) {
      socket.serializeAttachment(null);
      socket.close(typeof close === 'number' ? close : 1008);
    }
  }
}
