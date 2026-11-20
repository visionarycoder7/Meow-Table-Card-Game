# Working on Meow Table

Read [README.md](README.md) for the current project state. Use [product and gameplay](docs/product-and-gameplay.md) for scope and theme, [architecture](docs/architecture.md) for boundaries and build commands, and the [contributor workflow](docs/contributor-workflow.md) for milestones, acceptance checks, and agent handoffs.

Start by checking Git status and reading the files the task touches. Keep your changes within the assigned slice. The root `index.html` is the existing prototype. The planned app will use `apps/web/`, `apps/server/`, and `packages/protocol/`.

Put game rules on the server, render the authorized player view in the browser, and reuse the existing green, gold, and suit colors when building the new interface. Use the approved original rules when implementing the engine.

Write straightforward code. Use names that match the project vocabulary, such as `roomCode`, `activeSeatId`, and `applyTurn`. Keep rule functions separate from socket delivery and React rendering. Follow an accepted action from validation to state change to the per-player view in one readable flow. Prefer ordinary functions and existing helpers. Extract shared code when reuse makes the callers easier to understand, and use comments to explain why a rule or ordering constraint exists.

For UI tasks, read the [frontend playbook](docs/frontend-playbook.md), the [component-first layout](docs/architecture.md#component-first-frontend), and the [visual baseline](docs/product-and-gameplay.md#visual-baseline). Use Tailwind CSS v4 for the planned React app. Apply Impeccable and Unslop to the rendered design, and use the locally available skills in the playbook as the task requires. Review rendered screens before marking UI work complete. Product-authored UI uses text and consistent icons without emoji.

Use Meow Table in public material and follow the [release and licensing notes](docs/release-and-licensing.md) when adding assets or deploying. At each feature handoff, update the affected status and evidence in the ignored `progress.local.md` if present. Report the affected ID, status, and checks you ran in the handoff so the tracker can be updated across checkouts.
