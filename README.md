<p align="center"><img src="assets/branding/mark.svg" width="104" height="104" alt="" /></p>
<h1 align="center">Meow Table</h1>
<p align="center">An open-source card table for friends.</p>
<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-frontend-2d7048" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-workspaces-2d7048" />
  <img alt="Tailwind CSS v4" src="https://img.shields.io/badge/Tailwind_CSS-v4-2d7048" />
  <img alt="Cloudflare Workers Free target" src="https://img.shields.io/badge/Cloudflare-Workers_Free-ffd23f" />
  <img alt="AGPLv3 license" src="https://img.shields.io/badge/license-AGPLv3-0e1a14" />
</p>

## What works now

Create a private room for up to six seats. Share an invite to play with friends, or add bots to play solo or fill empty seats. Match the discard by suit, rank, or action and try to empty your hand. The deck includes six original action cards. A refreshed tab can reclaim its seat during the reconnect grace period, and the host can start a rematch once a game ends.

## Run locally

Use Node.js 24.22.1 from `.nvmrc` and run these commands from the repository root:

```sh
npm ci
npm run dev
```

Open [localhost:5173](http://localhost:5173). Vite runs the React frontend and local Cloudflare runtime on the same origin. Local development needs no Cloudflare login or secrets.

Enter a name and select **Create room**. Copy the invite into a private window or another browser profile, enter a different name, and select **Join room**. In the host window, select **Start match**. Play a highlighted card or click the face-down draw pile. When a drawn card matches, you can play it or select **Pass and keep card**. Try a rematch to see the opening turn rotate.

For a solo game, select **Add bot** in the lobby and then **Start match**. A host can mix bots and friends in the same room, up to six seats total. **Remove bot** removes the last bot added before the match starts.

| Command | What it does |
| --- | --- |
| `npm test` | Runs the room protocol and server match tests. |
| `npm run check` | Generates Worker binding types and checks TypeScript in all workspaces. |
| `npm run build` | Builds the frontend assets and Worker together in `frontend/dist/`. |
| `npm start` | Previews the built app locally at [localhost:4173](http://localhost:4173). Run the build first. |

## Project layout

| Directory | Responsibilities |
| --- | --- |
| `frontend/` | React screens, Tailwind v4 styles, and the client WebSocket connection. |
| `backend/` | Worker routing, a Durable Object per room, and SQLite-backed lobby state. |
| `packages/protocol/` | Shared messages and validation. |
| `assets/` | Reusable branding exports, app metadata, and card artwork. |

## Hosting and release

The upgraded app targets **Cloudflare Workers Free**. It serves static files and the room backend on the same origin. Hibernating sockets and one Durable Object per room keep independent lobbies from sharing state. Capacity is still subject to free daily quotas and must be measured before release. [Architecture and free-tier plan](docs/architecture.md)

Test the upgraded app on localhost during development. The existing Vercel project still serves the [root prototype](index.html) using [`vercel.json`](vercel.json). Codex verifies and prepares the eventual switch. The owner pushes manually. The owner's ignored `deployment.local.md`, if present, contains the dashboard settings and release checklist. [Cutover gate](docs/implementation-phases.md#codex-only-prototype-cutover)

## Contribute

- [Phase guide](docs/implementation-phases.md) — scopes, agent handoffs, and verification.
- [Product and gameplay](docs/product-and-gameplay.md) — original rules direction and release scope.
- [Game rules](docs/game-rules.md) — playable rules, test cases, and proposed effects.
- [Frontend playbook](docs/frontend-playbook.md) — components, styling, and accessibility.
- [Contributor workflow](docs/contributor-workflow.md) — development sequence and playtest checks.
- [Branding and release notes](docs/release-and-licensing.md) — asset sources, metadata, and licensing.

## License

The project’s original software and artwork are provided under [GNU AGPLv3](LICENSE). Third-party dependencies retain their own licenses.
