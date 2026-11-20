# Meow Table

A browser card game for friends who want to create a private room, share a code or link, and play a full match together.

**Current state.** Phase 1 is verified. The server-backed workspace has a React shell and a Node service. Phase 2 adds private rooms and lobby presence.

The React/Vite workspace is in `frontend/` and the Express/Socket.IO workspace is in `backend/`. The repository root holds the npm scripts and shared lockfile.

[Vercel deployment setup](.github/vercel-autodeploy-general-guide.md)

## What we’re building

Friends open one URL, create or join a private room, and play on phones or desktops. A shared server manages the deck and turns, so a browser refresh can restore the player’s seat and the lobby host can disconnect without taking the service down. The dark green table, gold turn accents, and subtle Meow touches carry into an original game and card design.

## Local development and the live site

Test the upgraded app on localhost during development. The live Vercel site continues to publish the [root prototype](index.html) using [`vercel.json`](vercel.json). Its browser-hosted rooms, bots, and same-device play stay available during the transition.

**Codex owns the cutover.** When the replacement passes local multiplayer and release checks and the production target is ready, Codex removes the root `index.html` and updates `vercel.json` and the affected CI checks in one coordinated change. Antigravity works on assigned phases and leaves the prototype and Vercel configuration in place. The owner pushes the cutover manually. [Codex-only cutover gate](docs/implementation-phases.md#codex-only-prototype-cutover)

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

To exercise the production build locally, stop development and run `npm run check`, `npm run build`, then `npm start`. Open [the compiled app](http://127.0.0.1:3001). Use `PORT` to change the server port. Until cutover, use these local URLs for the upgraded app.

## Future hosting

For the first release, one Node web service can serve the frontend build and host live rooms on the same origin. A Vercel frontend with a separate backend is also possible. The owner’s local `deployment.local.md`, if present, has the dashboard settings and compares a Node host, Cloudflare Durable Objects, and Vercel Functions. See the [architecture](docs/architecture.md#alternatives-and-when-to-reconsider) for the trade-offs.

## License

Meow Table uses the [GNU Affero General Public License, version 3](LICENSE) (`AGPL-3.0-only`) for the project’s original software. Third-party dependencies retain their own licenses. See the [release and licensing notes](docs/release-and-licensing.md) for attribution, branding, and source availability.

The [branding notes](docs/release-and-licensing.md#branding-files-and-share-metadata) identify the editable artwork, icon exports, and public URL setting for social previews.
