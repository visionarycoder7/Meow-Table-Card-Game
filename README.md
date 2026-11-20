# Meow Table

A browser card game for friends who want to create a private room, share a code or link, and play a full match together.

**Current state.** The [single-page prototype](index.html) contains browser-hosted rooms, same-device play, bots, card rules, and audiovisual effects. The server-backed app currently has a local workspace and browser shell.

[Vercel deployment setup](.github/vercel-autodeploy-general-guide.md)

## What we’re building

Friends open one URL, create or join a private room, and play on phones or desktops. A shared server manages the deck and turns, so a browser refresh can restore the player’s seat and the lobby host can disconnect without taking the service down. The dark green table, gold turn accents, and subtle Meow touches carry into an original game and card design.

The recommended pilot is one Node.js service serving the browser app and the live rooms. The first hosted milestone is a lobby that two people can join from different networks. The release milestone is a complete match, seat recovery, and rematch on that same hosted build.

## Where to start

| Document | What to review |
| --- | --- |
| [Product and gameplay](docs/product-and-gameplay.md) | The first-release player journey, original game direction, Meow theme, and decisions the owner should make. |
| [Architecture and stack](docs/architecture.md) | Why one service is enough, room and message rules, build commands, and deployment options. |
| [Frontend playbook](docs/frontend-playbook.md) | Reusable brief for component-first UI, Tailwind v4, typography, motion, and visual review. |
| [Contributor workflow](docs/contributor-workflow.md) | Milestones, dependencies, release checks, and a task brief for Codex or Antigravity. |
| [Phase implementation guide](docs/implementation-phases.md) | Copyable task brief, scope and checks per phase, and Codex review and commit rules. |

## Run locally

Use Node.js 24.22.1 from `.nvmrc`.

```sh
npm ci
npm run dev
```

Open [the Vite app](http://localhost:5173). The Express service and Socket.IO listen on port 3001. Vite forwards `/healthz` and `/socket.io` to that service.

To exercise the production server locally, stop development and run `npm run check`, `npm run build`, then `npm start`. Open [the compiled app](http://127.0.0.1:3001). Use `PORT` to change the server port and `HOST` to change the bind address. A hosted Node service sets `HOST=0.0.0.0`. The root prototype deploys separately through Vercel.

## License

Meow Table uses the [GNU Affero General Public License, version 3](LICENSE) (`AGPL-3.0-only`) for the project’s original software. Third-party dependencies retain their own licenses. See the [release and licensing notes](docs/release-and-licensing.md) for attribution, branding, and source availability.
