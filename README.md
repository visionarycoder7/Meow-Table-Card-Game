# No Mercy: online multiplayer

React (Vite) client, Node.js + Express + Socket.IO server. The server runs all the rules, so players can't cheat and each player only ever receives their own hand.

## Run it (development)
```bash
npm run install:all
npm run dev:server     # http://localhost:3001
npm run dev:client     # http://localhost:5173  (proxies /socket.io to the server)
```
Open the client in two browser windows, create a room in one, join with the 4-letter code in the other.

## Run it (one server, production)
```bash
npm run install:all
npm run build          # builds client/dist
npm start              # serves the game and sockets on http://localhost:3001
```
Friends on the same Wi-Fi can join at `http://<your-computer-ip>:3001`. To play over the internet, deploy this to any Node host (Render, Railway, Fly.io) or expose it with a tunnel.

## Tests
```bash
cd server && npm test   # 500 full bot games, card-count and rule checks
```
(`npm run e2e` runs a socket test; start the server first with `PORT=3055 BOT_DELAY=5 node index.js`.)

## Layout
- `server/game.js`: rules engine (stacking, 7/0, Discard All, Skip Everyone, Roulette, UNO call, Mercy rule)
- `server/index.js`: rooms, lobby, reconnect, bots, Socket.IO events
- `client/src/App.jsx`: lobby and table UI, throw and draw animations
- `client/src/sound.js`: synthesised sound effects

## Behaviour notes
- Rooms hold 2–6 seats; the host can add bots. Refreshing the page rejoins your seat.
- If a player disconnects mid-game, a bot plays for them until they return.
- State is in memory, so a server restart ends all games. PostgreSQL and Redis from your diagram can be added later for accounts, match history and persistence.
