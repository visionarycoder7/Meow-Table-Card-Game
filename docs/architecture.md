# Architecture and stack

**Status:** Proposed for a small friends-only release

## Recommendation

Use a single TypeScript repository and deploy one Node.js service. In production, it serves the built React app and accepts Socket.IO connections on the same origin. The server owns the room, deck, hands, turn order, and results. The person who creates the room controls the lobby. Their browser can close without taking the server down.

| Layer | Proposed choice | Reason |
| --- | --- | --- |
| Browser | React, Vite, TypeScript, and Tailwind CSS v4 | Compose feature components with token-based utilities and keep complex card or table styles local. Use the official Tailwind Vite plugin when scaffolding the app. [Tailwind Vite setup](https://tailwindcss.com/docs/installation/using-vite) |
| Server | Node.js LTS, a small Express app, and Socket.IO | Serve the browser build and handle room connections, acknowledgements, and reconnection on one service. Choose a supported Node.js release compatible with Vite at setup. [Node.js release schedule](https://nodejs.org/en/about/previous-releases) · [How Socket.IO works](https://socket.io/docs/v4/how-it-works) |
| Game engine | Framework-independent TypeScript module inside the server | Run one set of rule functions for every player. Given the same initial state, command sequence, and injected randomness, engine tests can reproduce a match. Extract a workspace package when another runtime needs it. |
| State | In-memory room store on one instance | Straightforward for temporary rooms and a small pilot. Active rooms disappear when that instance restarts or is replaced. |
| Verification | Vitest, Playwright, and GitHub Actions | Test rules and room behavior in Vitest. Use isolated Playwright browser contexts to act as different players in CI. [Vitest guide](https://vitest.dev/guide/) · [Playwright browser contexts](https://playwright.dev/docs/browser-contexts) |
| Hosting | Render Web Service as the pilot candidate | Supports public WebSockets. Free instances can idle off, and instance replacement closes live connections. Confirm the deploy owner and hosting budget before selecting a plan. [Render WebSockets](https://render.com/docs/websocket) · [Render free service limits](https://render.com/docs/free) |

## From clicking Play to a shared table

The browser sends an intent such as “play this card.” The server looks up the seat attached to that socket and checks the active match, turn, requested card, and any pending choice. It commits an accepted change once, then sends a tailored snapshot to each seat. Your browser renders your hand and the shared table. A second browser can receive the same table with a different private hand.

Keep the game engine separate from sockets and browser code. It computes rules from state and a command. The room handler owns authentication, serialization, timers, and delivery. The React client owns display, input, and animation. A failed animation or a dropped browser connection cannot advance a turn.

## Room and match state

1. **Create or join.** The server assigns a unique room code, seat, and private resume credential. The code admits guests to an open lobby. The credential authorizes a particular seat and stays out of invite links, public room messages, and logs. Validate inputs and limit repeated create and join attempts. New seats close once a match begins.
2. **Apply a command.** A browser requests an action such as playing one card, choosing a target, or drawing. The server identifies the seat from its authenticated connection, validates the current phase and action, and applies one ordered change at a time per room. Host-only actions receive the same authorization check.
3. **Send each player a view.** Build each snapshot from public table state and that seat's private hand and pending choices. Send it to the verified connection for the seat. Keep deck order, other players' hands, and credentials out of all client views. Use a monotonically increasing room revision so browsers can discard stale updates, including updates from before a rematch.
4. **Recover after a disconnect.** The browser can present its resume credential after a refresh or network interruption. The server rebinds the seat, invalidates any previous connection for that seat, and returns a fresh snapshot. Acknowledgements can also be lost, so include a unique command ID and return the previous result for a retry with the same ID before checking the action's revision. Socket.IO's default delivery guarantee makes application-level recovery necessary. [Socket.IO delivery guarantees](https://socket.io/docs/v4/delivery-guarantees/)
5. **End or expire.** When a match ends, keep the room available for a rematch. Clean up inactive or empty rooms after the agreed timeout. If the hosting process restarts or the room expires, show a clear room-unavailable state and offer a return to the home screen.

Player-visible states include lobby, active turn, pending player choice, match finished, and reconnecting. A pending choice may belong to a specific seat even when someone else played the card that triggered it.

### Contract for the first implementation

| Topic | Proposed contract |
| --- | --- |
| Room identity | Generate an unambiguous room code on the server and retry collisions. Normalize case when joining. Give each seat a separate opaque resume credential generated with cryptographic randomness. Store it per room in session storage so a refresh in the same tab can recover. |
| Commands | Create, join, and resume establish the room or seat. Once joined, mutating commands carry a command ID and expected room revision. Validate payloads at the boundary. Authorize against the current seat, phase, and match rules. |
| Ordering and retries | Process player commands and timers in one sequence per room. Check connection identity before looking up a prior command result. Deduplicate by seat and command ID before checking revision, and bind a reused ID to its original payload. |
| Responses | Successful changes advance the room revision. Rejections leave game state intact and give a stable reason, such as room full, wrong turn, stale revision, or expired seat. On a stale revision or reconnect, fetch a fresh view before enabling input. |
| Privacy | Public views contain seat names, hand sizes, turn and discard state, and approved public events. Private views contain only the receiving seat’s cards and choices. Cut down the snapshot before emitting it, including any activity messages. |
| Disconnects | While a seat is within its grace period, the player can reclaim it with the resume credential. An explicit leave forfeits immediately. At grace expiry, remove the seat in the lobby or forfeit it in a match. Resolve pending choices through a server-owned default from the approved rules, then advance play. Timers check the current room and action state before applying an expiry. |
| Lifecycle defaults | Start with a 60-second reconnect grace period and a 15-minute empty-room timeout. Transfer lobby or rematch host control to the earliest joined connected player when the current host leaves or their grace expires. Set a finite turn and choice deadline before the hosted playtest so a permanently idle seat cannot stall the room. |

## Proposed repository layout

- **`apps/web/`** — Vite entry HTML and React screens, styles, original visual assets, and socket client.
- **`apps/server/`** — HTTP service, socket handlers, guest sessions, room lifecycle, and per-seat views. Keep card definitions, turn transitions, outcomes, and rule tests together in `apps/server/src/game/`.
- **`packages/protocol/`** — Shared command and snapshot shapes, runtime validation, and error definitions.
- **`tests/e2e/`** — Multi-player browser flows and reconnect checks.
- **`docs/`** — Product decisions, game rules, architecture, and contributor workflow.

Use npm workspaces from the repository root. Keep the root prototype available as a reference during the rollout. After the replacement passes the multiplayer acceptance checks, the owner can choose whether to archive it or rely on Git history.

### Component-first frontend

| Folder | Responsibility |
| --- | --- |
| `apps/web/src/app/` | App shell, screen composition, and connection lifecycle. |
| `apps/web/src/features/rooms/` | Home and lobby flows, room code, invite controls, player roster, and room errors. |
| `apps/web/src/features/match/` | Table, card face, hand, draw and discard piles, player seats, turn status, pending choices, and results. |
| `apps/web/src/components/` | Shared controls used across features, such as buttons, fields, and dialogs. |
| `apps/web/src/styles/` | Tailwind v4 CSS entry and semantic theme tokens for palette, spacing, typography, focus, and motion. Put component-specific styles next to their components. |

Build and review the individual controls and game pieces before composing the full screens. Keep feature components with their feature and extract a shared component when another feature has the same need. Give visual components typed props and callbacks so they can render representative states without a live server. A feature controller handles the authorized snapshot, connection state, and command submission. The game engine stays in `apps/server/src/game/`.

Follow the [frontend playbook](frontend-playbook.md) for Tailwind setup, component design, motion, and verification. The [Meow Table visual baseline](product-and-gameplay.md#visual-baseline) supplies the project palette.

## Build and deployment contract

These are the commands the workspace milestone must make available from the repository root. Record the pinned Node.js version and commit the npm lockfile when the workspace is scaffolded.

| Command | Expected result |
| --- | --- |
| `npm ci` | Installs the root workspace from the committed lockfile. |
| `npm run dev` | Runs Vite and the Node service locally. Vite proxies game connections to the service. |
| `npm run check` | Checks TypeScript across the workspace. |
| `npm test` | Runs rules and room integration tests once those suites exist. |
| `npm run build` | Builds the shared protocol, server, and browser in dependency order. |
| `npm start` | Starts the compiled service and serves the browser build. |
| `npm run test:e2e` | Starts a disposable local production build and exercises it with isolated browser sessions. |

1. **Prototype.** The existing Vercel URL serves the current static build. Its Deploy Hook workflow applies to that site. Keep the prototype available while the new app passes a hosted playtest. [Prototype deployment guide](../.github/vercel-autodeploy-general-guide.md)
2. **Pilot.** Start dedicated hosting on a separate URL. For Render, use one web-service instance, build with `npm ci && npm run build`, start with `npm start`, bind to `0.0.0.0` using the provided `PORT`, and configure `GET /healthz` as the service health check. Serve the UI and Socket.IO from the same origin. Deploy during a quiet period because replacing the process drops in-memory matches. [Render web services](https://render.com/docs/web-services) · [Render WebSockets](https://render.com/docs/websocket)
3. **Public URL decision.** After the pilot passes, the owner can share the pilot URL or keep Vercel as the public frontend with a separate socket service. If split hosting is required, explicitly configure the frontend's HTTPS socket endpoint and allow only the approved frontend origins on the service. Repeat the invite, reconnect, and mobile-network checks against that split deployment.

Vercel’s WebSocket support is in public beta. Connections are pinned to a function instance and close when it reaches its maximum duration. Vercel’s own multi-client example uses Redis to coordinate instances. The pilot uses one long-running process so room state and sockets can stay together. [Vercel WebSocket announcement](https://vercel.com/changelog/websocket-support-is-now-in-public-beta) · [Vercel multi-client example](https://vercel.com/kb/guide/real-time-chat-websockets)

## Alternatives and when to reconsider

| Option | When it fits | Trade-off |
| --- | --- | --- |
| Keep the browser-hosted PeerJS model | Static-only hosting is the primary constraint and guests can accept that the creator must stay online. | The host's browser holds all hands and the deck. Closing it ends play. |
| Add durable storage behind the Node service | A release must recover active matches after restarts or deploys. | Persist state and seat identity with each accepted command, and restore pending choices and deadlines when the service comes back. |
| Cloudflare Workers with Durable Objects | The team prefers a managed per-room runtime with built-in storage. | Adds Cloudflare-specific deployment and room lifecycle design. [Durable Objects overview](https://developers.cloudflare.com/durable-objects/) |

GitHub Pages can serve the prototype or a separately built frontend. The proposed Node service needs a host that runs a server and accepts WebSocket connections. [GitHub Pages overview](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
