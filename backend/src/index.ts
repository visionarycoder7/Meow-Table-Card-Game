import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const webBuild = fileURLToPath(new URL('../../frontend/dist/', import.meta.url));
const port = Number(process.env.PORT ?? '3001');
const host = process.env.HOST ?? '127.0.0.1';

app.get('/healthz', (_request, response) => {
  response.json({ status: 'ok' });
});

app.use(express.static(webBuild));
new Server(httpServer);

httpServer.listen(port, host, () => {
  console.log(`Meow Table listening on http://${host}:${port}`);
});
