<p align="center">
  <img src="assets/branding/mark.svg" width="104" height="104" alt="" />
</p>

<h1 align="center">Meow Table</h1>

<p align="center">A private, open-source card table for friends. Host a room, invite your group, or pull up a seat with bots.</p>

<p align="center">
  <strong><a href="https://meow-table.meow2004.workers.dev/">Play Meow Table online</a></strong>
  · <a href="docs/game-rules.md">Game rules</a>
  · <a href="CONTRIBUTING.md">Contribute</a>
</p>

<p align="center">
  <img alt="React and TypeScript" src="https://img.shields.io/badge/React%20%2B%20TypeScript-2d7048" />
  <img alt="Tailwind CSS v4" src="https://img.shields.io/badge/Tailwind_CSS-v4-2d7048" />
  <img alt="Cloudflare Workers" src="https://img.shields.io/badge/Cloudflare-Workers-ffd23f" />
  <a href="LICENSE"><img alt="License AGPLv3" src="https://img.shields.io/badge/license-AGPLv3-0e1a14" /></a>
</p>

## Play a match

| What you want to do | How to do it |
| --- | --- |
| Play with friends | Enter a name, choose **Create room**, and share the invite link or room code. The host starts the match when everyone is seated. Rooms support up to six seats. |
| Play solo | Create a room, choose **Add bot**, then **Start match**. You can also use bots to fill empty seats in a room with friends. |
| Take a turn | Play a highlighted card that matches the suit, rank, or action, or draw from the face-down pile. When you have no legal card, **Deep Draw** can search up to three cards. If you draw a playable card, play it or choose **Pass and keep card**. |
| Continue after a disconnect | Use **Reconnect** or refresh the same tab while your seat is held for up to 60 seconds. The server’s turn or choice timer continues. |
| Play again | After a match, the host can choose **Rematch** or **Back to lobby** to change the seats. |

Open **Card guide** to see the six original action cards and the publisher reference. Use **F11** to enter fullscreen and **Escape** to exit. Outside fullscreen, **Escape** closes the guide or cancels an open card choice. The home screen’s cat mark settles once, blinks periodically, and lifts slightly when you focus a field. Its motion follows the device’s reduced-motion preference. [Game rules](docs/game-rules.md) · [Motion details](docs/frontend-playbook.md#meow-table-home-motion)

## Run locally

Use the Node.js version in [`.nvmrc`](.nvmrc), currently **24.22.1**, and run these commands from the repository root.

```sh
npm ci
npm run dev
```

Open [localhost:5173](http://localhost:5173). One Vite session starts the React frontend and the local Cloudflare Worker. No Cloudflare credentials are needed for local play. To test two players on one computer, open the invite in a private window or a second browser profile.

| Command | What it does |
| --- | --- |
| `npm test` | Runs the protocol and game-engine tests. |
| `npm run check` | Generates Worker binding types and checks TypeScript across the workspace. |
| `npm run build` | Builds the frontend and Worker together in `frontend/dist/`. |
| `npm start` | After a build, previews the compiled app at [localhost:4173](http://localhost:4173). |

## Architecture and hosting

React and Tailwind CSS v4 render the table. The Cloudflare Worker handles room admission, and one SQLite-backed Durable Object per room runs the game and sends each player their own view over WebSockets.

| Directory | Responsibilities |
| --- | --- |
| [`frontend/`](frontend/) | Screens, shared UI, and the browser WebSocket client. |
| [`backend/`](backend/) | Worker routing, room state, game rules, and bots. |
| [`packages/protocol/`](packages/protocol/) | Shared message types and command validation. |
| [`assets/`](assets/) | Reusable branding and card artwork. |

Cloudflare Workers Free hosts both parts at the [live game URL](https://meow-table.meow2004.workers.dev/). Pushes to `main` trigger Workers Builds, and successful builds deploy automatically. The hosted toolbar’s **Source** link points to the deployed Git revision. [Browser deployment guide](docs/deployment.md) · [Architecture](docs/architecture.md) · [Product scope](docs/product-and-gameplay.md)

## Contribute and report issues

- [Contributing](CONTRIBUTING.md) covers setup, PRs, and verification.
- [Code of Conduct](CODE_OF_CONDUCT.md) sets expectations for project spaces and explains how to report a concern.
- [Security Policy](SECURITY.md) explains how to request a private channel for a vulnerability report.
- [Legal and licensing](LEGAL.md) covers the project license, branding, and third-party references.

Ordinary defects and feature requests belong in [GitHub Issues](https://github.com/visionarycoder7/Meow-Table-Card-Game/issues). The original project software and artwork are distributed under [GNU AGPLv3](LICENSE).
