# Contributing to Meow Table

Game bugs, accessibility fixes, documentation, and improvements to tests are welcome. For changes to rules, room behavior, shared messages, hosting, or the project identity, open an issue describing the proposed behavior and how you would verify it. [Product and gameplay](docs/product-and-gameplay.md) · [Game rules](docs/game-rules.md) · [Architecture](docs/architecture.md)

## Get started

1. Fork the repository if needed and create a focused branch from `main`.
2. Use the Node.js version in [`.nvmrc`](.nvmrc). Run `npm ci` and `npm run dev` from the repository root.
3. Open [localhost:5173](http://localhost:5173). For multiplayer work, use two independent browser sessions and try both a copied invite and a typed room code.
4. Run `npm test`, `npm run check`, and `npm run build` before opening a pull request.

## Send a pull request

- Open the pull request against `main`. Explain the player-visible change, link the issue if there is one, and list the checks you ran.
- Keep server-owned game rules in `backend/`, shared messages in `packages/protocol/`, and rendering in `frontend/`.
- For UI changes, include a screenshot or short recording and check a narrow viewport, keyboard focus, and reduced motion when applicable. [Frontend playbook](docs/frontend-playbook.md)
- Use original or properly licensed contributions and document the source of third-party material. Keep credentials, room invite links, seat tokens, and private reference files out of commits and screenshots. [Legal and licensing](LEGAL.md)
- Wait for the **Verify Meow Table** check and review before merging. A successful Cloudflare build from `main` publishes to the live site. [Release workflow](docs/deployment.md)

See the [contributor workflow](docs/contributor-workflow.md) for multiplayer and release checks. Follow the [Code of Conduct](CODE_OF_CONDUCT.md) and use the [Security Policy](SECURITY.md) for vulnerability reports.
