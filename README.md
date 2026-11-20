# Meow Table

A browser card game for friends who want to create a private room, share a code or link, and play a full match together.

**Current state.** The [single-page prototype](index.html) contains browser-hosted rooms, same-device play, bots, card rules, and audiovisual effects. The server-backed app is at the planning stage.

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

Start with the [owner decisions](docs/product-and-gameplay.md#decisions-for-the-owner) and then the [workspace milestone](docs/contributor-workflow.md#milestones). Each milestone has a gate that tells the next contributor what they can build on.

## License

Meow Table uses the [GNU Affero General Public License, version 3](LICENSE) (`AGPL-3.0-only`) for the project’s original software. Third-party dependencies retain their own licenses. See the [release and licensing notes](docs/release-and-licensing.md) for attribution, branding, and source availability.
