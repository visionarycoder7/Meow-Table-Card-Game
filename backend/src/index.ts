import { createRoomCode, normalizeRoomCode } from '@meow-table/protocol';

export { Room } from './room';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/healthz' && request.method === 'GET') {
      return Response.json({ status: 'ok' });
    }

    const match = /^\/ws\/rooms\/([^/]+)$/.exec(url.pathname);
    if (!match) return new Response('Not found', { status: 404 });
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('WebSocket upgrade required', { status: 426 });
    }
    if (request.headers.get('Origin') !== url.origin) {
      return new Response('Origin not allowed', { status: 403 });
    }

    const { success } = await env.LOBBY_LIMIT.limit({ key: request.headers.get('CF-Connecting-IP') ?? 'local' });
    if (!success) return new Response('Try again in a minute', { status: 429 });

    if (match[1] === 'new') {
      for (let attempt = 0; attempt < 3; attempt++) {
        const code = createRoomCode();
        const target = new URL(`/create/${code}`, url);
        const response = await env.ROOMS.getByName(code).fetch(new Request(target, request));
        if (response.status !== 409) return response;
      }
      return new Response('Cannot create a room right now', { status: 503 });
    }

    const code = normalizeRoomCode(match[1]);
    if (!code) return new Response('Invalid room code', { status: 400 });
    return env.ROOMS.getByName(code).fetch(new Request(new URL(`/join/${code}`, url), request));
  },
} satisfies ExportedHandler<Env>;
