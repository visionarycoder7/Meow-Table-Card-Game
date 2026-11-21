# Architecture and stack

**Status:** Cloudflare Workers Free is the sole hosting target. The game runs locally and the hosted playtest is pending.

## Recommendation

Use one TypeScript repository with Cloudflare Static Assets, a Worker, and one SQLite-backed Durable Object per room. The frontend and WebSocket endpoint share an origin. The Worker routes each code to its own room object. The room controls access and stores its roster independently of any player's browser. The same room object will own authoritative deck, hands, and turns when gameplay lands.

| Layer | Proposed choice | Reason |
| --- | --- | --- |
| Browser | React, Vite, TypeScript, and Tailwind CSS v4 | Compose feature components with token-based utilities and keep complex card or table styles local. Use the official Tailwind Vite plugin when scaffolding the app. [Tailwind Vite setup](https://tailwindcss.com/docs/installation/using-vite) |
| Server | Cloudflare Worker and native WebSockets | The Worker handles health, origin validation, connection throttling, and routing. The room object handles commands and broadcasts. [Cloudflare React and Vite](https://developers.cloudflare.com/workers/framework-guides/web-apps/react/) |
| Game engine | Framework-independent TypeScript module inside the server | Run one set of rule functions for every player. Given the same initial state, command sequence, and injected randomness, engine tests can reproduce a match. Extract a workspace package when another runtime needs it. |
| State | SQLite-backed Durable Objects | Each room stores its own state. WebSocket attachments carry the socket’s seat identity through hibernation. A Durable Object alarm handles expiring seats. [Durable Object WebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/) |
| Verification | Node test runner, Wrangler, local browser sessions, GitHub Actions | Unit-test the protocol, check the generated Worker types, and exercise room behavior through the real local runtime. Add release CI coverage as the flows mature. |
| Hosting | Cloudflare Workers Free and Static Assets | Keep the frontend and backend together and measure real usage before opening access. [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) · [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/) |

### Free-tier budget

Cloudflare Free has separate daily limits for Worker invocations and Durable Object requests, duration, and storage operations. Run the Worker only for health and socket routes. Ordinary page and asset requests go straight to Static Assets. Use hibernating sockets and event-driven updates so idle rooms can sleep. Keep the account on Free and use its `workers.dev` hostname for the first candidate. Before release, measure concurrent rooms, reconnects, alarm work, and storage writes. If usage approaches the limit, restrict new-room creation and communicate the temporary capacity limit. Cloudflare rejects affected operations when its free limit is exhausted. [Static asset billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) · [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)

## From clicking Play to a shared table

The browser sends an intent such as “play this card.” The server looks up the seat attached to that socket and checks the active match, turn, requested card, and any pending choice. It commits an accepted change once, then sends a tailored snapshot to each seat. Your browser renders your hand and the shared table. A second browser can receive the same table with a different private hand.

The room revision orders snapshots. The match revision orders moves. Joining, resuming, and connection updates advance the room revision while leaving an unchanged match revision valid. A move, timeout, or forfeit advances the match revision. The client derives its remaining time from the server snapshot and uses the browser’s monotonic clock to count down from receipt.

Bots occupy seats in the same match state as human players and count toward capacity. They have no sockets or session credentials. The room's existing alarm wakes the Worker for a bot turn, and the engine validates its move through the same functions used for humans. Bot decisions use their own hand and the public discard. [Durable Objects Alarms API](https://developers.cloudflare.com/durable-objects/api/alarms/)

Keep the game engine separate from sockets and browser code. It computes rules from state and a command. The room handler owns authentication, serialization, timers, and delivery. The React client owns display, input, and animation. A failed animation or a dropped browser connection cannot advance a turn.

## Room and match state

1. **Create or join.** The server assigns a unique room code, seat, and private resume credential. The code admits guests to an open lobby. The credential authorizes a particular seat and stays out of invite links, public room messages, and logs. Validate inputs and limit repeated create and join attempts. New seats close once a match begins.
2. **Apply a command.** A browser requests an action such as playing one card, choosing a target, or drawing. The server identifies the seat from its authenticated connection, validates the current phase and action, and applies one ordered change at a time per room. Host-only actions receive the same authorization check.
3. **Send each player a view.** Build each snapshot from public table state and that seat's private hand and pending choices. Send it to the verified connection for the seat. Keep deck order, other players' hands, and credentials out of all client views. Use a monotonically increasing room revision so browsers can discard stale updates, including updates from before a rematch.
4. **Recover after a disconnect.** The browser can present its resume credential after a refresh or network interruption. The server rebinds the seat, invalidates any previous connection for that seat, and returns a fresh snapshot. When match commands land, use a command ID and retain the result for duplicate delivery.
5. **End or expire.** When a match ends, keep the room available for a rematch. Currently the lobby removes disconnected seats after 60 seconds and deletes its state after the last seat leaves or expires. Hibernation keeps the room resumable within its deadlines.

Player-visible states include lobby, active turn, pending player choice, match finished, and reconnecting. A pending choice may belong to a specific seat even when someone else played the card that triggered it.

### Lobby contract

| Route or action | Current behavior |
| --- | --- |
| `GET /healthz` | Returns `{"status":"ok"}`. |
| `/ws/rooms/new` | A browser WebSocket opens on the app origin. The Worker generates an eight-character code and retries collisions. The first `enter` command establishes the host seat. |
| `/ws/rooms/<code>` | The first command is `enter` with a display name or `resume` with the tab’s private token. Invites carry only `?room=<code>`. |
| `lock` or `leave` | Only the host can change admission, and locking requires at least two connected players. An explicit leave releases the seat and transfers host control if needed. |
| Room updates | Each accepted change increases the revision. A lobby snapshot carries the host, roster, and lock state. The private token is sent only in the owning socket’s session message. |

### Match contract

| Topic | Contract |
| --- | --- |
| Room identity | Generate an unambiguous room code on the server and retry collisions. Normalize case when joining. Give each seat a separate opaque resume credential generated with cryptographic randomness. Store it per room in session storage so a refresh in the same tab can recover. |
| Commands | Create, join, and resume establish the room or seat. Game moves carry the expected match revision. Lobby roster and match lifecycle commands carry the expected room revision. The server validates authorization and turn rules. |
| Ordering and retries | Process player commands and timers in one sequence per room. An accepted move advances the match revision, so a duplicate using the old revision is rejected. Presence changes only advance the room revision. |
| Responses | Successful changes advance the room revision. Rejections leave game state intact and give a stable reason, such as room full, wrong turn, stale revision, or expired seat. On a stale revision or reconnect, fetch a fresh view before enabling input. |
| Privacy | Public views contain seat names, hand sizes, turn and discard state, and approved public events. Private views contain only the receiving seat’s cards and choices. Cut down the snapshot before emitting it, including any activity messages. |
| Disconnects | While a seat is within its grace period, the player can reclaim it with the resume credential. An explicit leave forfeits immediately. At grace expiry, remove the seat in the lobby or forfeit it in a match. Resolve pending choices through a server-owned default from the approved rules, then advance play. Timers check the current room and action state before applying an expiry. |
| Lifecycle defaults | Hold disconnected seats for 60 seconds. Transfer host control to the earliest joined connected player when the host leaves or expires. The rules define turn and choice deadlines and rematch behavior. |

## Repository layout

- **`frontend/`** — Vite entry HTML, React screens, styles, branding, and the browser lobby WebSocket client.
- **`backend/`** — Worker entry point, room Durable Object, game engine, rule tests, and Wrangler configuration.
- **`packages/protocol/`** — Shared lobby commands, views, normalization, and validation tests.
- **`assets/`** — Branding, card art, and table assets used by the frontend.
- **`docs/`** — Product decisions, game rules, architecture, and contributor workflow.

Use npm workspaces from the repository root. The Vite entry is `frontend/index.html`. The root `index.html` is ignored local reference material. Use `git show 0e78756:index.html` to inspect the prototype in a clean checkout.

### Component-first frontend

| Folder | Responsibility |
| --- | --- |
| `frontend/src/app/` | App shell, screen composition, and connection lifecycle. |
| `frontend/src/features/rooms/` | Home and lobby flows, room code, invite controls, player roster, and room errors. |
| `frontend/src/features/match/` | Table, card face, hand, draw and discard piles, player seats, turn status, pending choices, and results. |
| `frontend/src/components/` | Shared controls used across features, such as buttons, fields, and dialogs. |
| `frontend/src/styles/` | Tailwind v4 CSS entry and semantic theme tokens for palette, spacing, typography, focus, and motion. Put component-specific styles next to their components. |

Build and review the individual controls and game pieces before composing the full screens. Keep feature components with their feature and extract a shared component when another feature has the same need. Give visual components typed props and callbacks so they can render representative states without a live server. A feature controller handles the authorized snapshot, connection state, and command submission. The game engine stays in `backend/src/game.ts`.

Follow the [frontend playbook](frontend-playbook.md) for Tailwind setup, component design, motion, and verification. The [Meow Table visual baseline](product-and-gameplay.md#visual-baseline) supplies the project palette.

## Build and deployment contract

Run these commands from the repository root. Node.js tooling is pinned in `.nvmrc` and the npm lockfile. Wrangler generates the binding types locally.

| Command | Expected result |
| --- | --- |
| `npm ci` | Installs the root workspace from the committed lockfile. |
| `npm run dev` | Runs Vite and the local Worker runtime together at `http://localhost:5173`. |
| `npm run check` | Generates binding types and checks TypeScript across the workspace. |
| `npm test` | Runs the protocol and gameplay tests. |
| `npm run build` | Builds browser assets and the Worker into `frontend/dist/`. |
| `npm start` | Runs a local preview of the built Worker and assets at `http://localhost:4173`. |
| `npm run build:hosted` | Requires the public site and source URLs, then builds the hosted Worker and client. |
| `npm run deploy:dry-run` | Checks the generated Cloudflare package after the build. |
| `npm run deploy` | Builds the hosted app and publishes through Wrangler. |

1. **Development.** Use localhost. GitHub Actions runs tests, type checks, the hosted build, and a Worker dry run.
2. **Release candidate.** The owner selects a release in GitHub. Cloudflare Workers Builds uses the Vite plugin to build the Worker and assets together from the `playtest` branch. Test invitations and WebSockets across networks. [Deployment steps](deployment.md) [Cloudflare Vite guide](https://developers.cloudflare.com/workers/vite-plugin/tutorial/)
3. **Public URL decision.** After the hosted candidate passes, agree on the public URL and record the rollback point.

The ignored `deployment.local.md` records the owner's account subdomain, candidate URL, and playtest evidence.
