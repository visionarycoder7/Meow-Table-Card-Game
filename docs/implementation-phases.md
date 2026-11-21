# Meow Table implementation guide

Use this guide to assign one phase to Codex or Antigravity and review the result. Meow Table is an original browser card game for two to six friends in a private room. The [architecture](architecture.md), [product plan](product-and-gameplay.md), and [frontend playbook](frontend-playbook.md) apply throughout.

## Copy this brief to assign a phase

```text
Implement only Phase [number] in docs/implementation-phases.md for Meow Table.
Use branch or worktree [name] at base [commit]. Own only [paths].
The approved rules and decisions for this task are [list or document links].
Read AGENTS.md, the assigned phase, and the source files affected before editing.
Work through the implementation steps and acceptance checks for this phase.
Preserve existing behavior outside scope. Do not invent rules, APIs,
credentials, deployment settings, test results, or completed features.
If a prerequisite is missing, finish independent work and name the blocker.
Write straightforward TypeScript. Reuse existing components and helpers.
Keep rules and complete state on the server. Render approved views in React.
Follow the Meow Table palette and keep emoji out of product-authored UI.
Test the app on localhost. Use frontend/index.html as the entry point.
Read the ignored root prototype or git show 0e78756:index.html for reference.
If you are Antigravity, leave hosted release verification to Codex.
Do not push or deploy. Report changed files, commands actually run,
results, and anything Codex still needs to verify.
```

## Working agreement

1. Check Git status and the base commit. If both agents work at once, use separate branches or worktrees and agree on path ownership. Merge changes to the shared protocol before assigning dependent UI and server work.
2. Read the files and contracts for the phase. Use the project’s current scripts and versions. Verify configuration syntax in official documentation when changing it.
3. Keep the diff in the phase. Prefer concrete modules, descriptive names, and simple component props. Add tests where a rule, privacy boundary, or failure case needs proof. Test the app on localhost and keep the prototype as local reference material.
4. Report changed files, exercised paths, commands and results, assumptions, and remaining issues. An Antigravity handoff is ready for Codex review once it has that evidence.
5. **Codex verifies independently.** Read the diff, check normal entry points, and rerun the phase checks. Reproduce behavior rather than relying on screenshots or a written handoff. Mark only verified rows complete. Update `progress.local.md` if present. Otherwise put the same tracker ID and evidence in the handoff.
6. **Commit after verification.** Use one local commit per phase, or at most two when a clean split helps review. If Antigravity already made a phase commit, Codex uses the remaining slot for corrections and evidence. The owner pushes manually. Keep any authorized hosting changes separate.

## Phase 1 — Workspace and service foundation

**Tracker:** A02. **Commit:** `feat: scaffold the Meow Table workspace`

1. Use the root npm workspaces `frontend/` and `backend/` and the root lockfile. Record the Node version. Provide root `dev`, `check`, `build`, and `start` scripts that run the actual apps.
2. Build a small React/Vite shell with Tailwind v4 and the existing green and gold palette. Start with a visual component and a screen that composes it. Add room controls in Phase 2 when they work.
3. Establish a local backend with `GET /healthz` returning `{"status":"ok"}`. Phase 1 used an Express and Socket.IO scaffold. Phase 2 replaces that runtime with the Worker and preserves the local health and WebSocket checks.
4. Keep the root prototype and its publish path available. Introduce `packages/protocol/` in Phase 2 when the first room messages need it.

**Codex checks:** Run `npm ci`, `npm run check`, and `npm run build`. Run `npm start` and confirm the compiled app, its JS/CSS, health, and the current WebSocket endpoint work through one URL. Check the shell at phone and desktop widths.

## Phase 2 — Rooms and lobby

**Tracker:** A03–A04. **Commit:** `feat: add private rooms and lobby presence`

1. Define the room commands and lobby snapshots needed now. Validate input on the server. Generate room codes and private seat credentials on the server. Keep credentials out of invites and public snapshots.
2. Implement create, join, presence, leave, and host-controlled admission. Route the native WebSocket to a SQLite-backed Durable Object by room code. Use hibernating sockets, persist accepted state, and let alarms expire disconnected seats. Only the host can lock or open the lobby. Actual match start belongs to Phase 3.
3. Compose guest entry, create and join forms, roster, and invite controls. Cover loading, invalid input, full rooms, and lost connections. Run the app locally through the Cloudflare Vite integration.

**Codex checks:** Use independent browser contexts on localhost to create and join by invite and by code. Verify two to six seats, full and unknown rooms, host-only locking, and isolation between two rooms. Verify the local production preview and protect private session tokens from public snapshots. Hosted checks belong to release preparation.

## Phase 3 — Complete match and original card effects

**Tracker:** A05–A07. **Commit:** `feat: add the server-authoritative match loop`. A second commit can be `feat: add approved card effects and match outcomes`.

1. Use the [original rules](game-rules.md#9-rules-decisions-and-playtest-topics). Phase 3A covers the numbered-card loop. Phase 3B covers original effects and choices after review of the baseline and effect rules. Add deterministic tests for each slice.
2. Process commands in order per room. Validate turn, match, card ownership, and pending decisions. Moves carry the expected match revision and each accepted move advances it once. Presence changes only advance the room revision. Send only the view for the receiving seat.
3. Connect the table, hand, turn status, and choices to those views. Show the result and allow a rematch with a fresh deck and hands for the expected seats.

**Codex checks:** Finish and rematch a game in two independent sessions. Test two-player turns, deck exhaustion, approved effects, choice expiry, and match endings. Verify wrong-turn, stale, invalid, duplicate, and simultaneous commands. Inspect client payloads for leakage of hidden hands, deck order, or credentials.

## Phase 4 — Recovery and finished UI

**Tracker:** A08–A09. **Commit:** `feat: restore player seats and refine the match UI`

1. Extend the verified lobby resume flow to matches. Rebind the authorized seat and return the latest revision, private hand, and pending choice. Invalidate any previous connection for that seat.
2. Handle host transfer, explicit leave, expired seats, and unavailable rooms. Check timers against reconnects and rematches so stale callbacks cannot affect newer state.
3. Finish the responsive table, large hands, long names, keyboard focus, reduced motion, original card visuals, and optional audio controls. Review the rendered UI with Impeccable and Unslop where available.

**Codex checks:** Refresh during a pending choice, drop and restore a network connection, let a seat expire, and leave as host. Confirm the shown hand stays correct and the room can continue or end under the approved rules. Finish and rematch on phone and desktop. Verify keyboard controls and reduced motion.

## Phase 5 — Release readiness

**Tracker:** A10. **Commit:** `ci: verify the Meow Table multiplayer release`

1. Run tests, type checks, a hosted build, and Wrangler's dry run in the existing verification workflow. Verify relevant browser flows on the locally compiled candidate.
2. Follow the [deployment guide](deployment.md) for release setup, source and license links, and rollback. Test the chosen Cloudflare Free architecture with simultaneous rooms, reconnects, and idle hibernation. Measure request, duration, and storage use. The ignored `deployment.local.md` records provider settings and pilot evidence.
3. Once local release checks pass and the owner is ready to test hosting, Codex validates the production target with the [hosted playtest](contributor-workflow.md#hosted-playtest). Record the build revision, devices, networks, and results. Local readiness and hosted verification can be recorded separately.

**Codex checks:** Finish, reconnect, and rematch on localhost first. Repeat these checks across two different networks on the owner-approved release target. Check a larger table and verify the deployed source revision and License link while signed out. Mark the phase verified once the hosted evidence is recorded.

### Hosted release verification

The root `index.html` is ignored local reference material. `frontend/index.html` is the tracked Vite entry. The owner publishes the Cloudflare Worker using the [dashboard guide](deployment.md). Codex verifies the hosted release before the owner shares the public URL.

1. The compiled localhost build passes the complete release flow. Verify room creation, joining by code and link, a full match under the approved rules, private hands, reconnect, and rematch. Record any prototype-only modes the owner approved deferring.
2. Verify that the Cloudflare address serves the game and accepts WebSocket connections. Record the active Worker version and the Git commit.
3. Verify the deployed build, CI, and the deployed source revision and the user-facing License link. Record the hosted smoke test before sharing the public URL.
4. After the first successful playtest, use its Cloudflare Worker version as the rollback point for later releases.

## Phase status

| Phase | State | Evidence |
| --- | --- | --- |
| 1. Workspace | Verified | The original scaffold passed clean install and runtime checks. Phase 2 rechecked the workspace with the Cloudflare dev runtime and production preview. |
| 2. Rooms | Verified locally | Clean `npm ci`, protocol tests, type checks, and build passed. Dev and preview verified room isolation, six-seat capacity, host-only locking, and private sessions. Independent Chrome contexts verified copied invites, typed codes, live rosters, and refresh. The room alarm expired a disconnected seat and removed empty state. |
| 3. Match | Verified locally | Numbered cards, six action effects, private hands, bots, and rematches are available for playtesting. |
| 4. Recovery and UI | Verified locally | Seat recovery, lobby reopening, direction, solo rematch, and keyboard choices are checked. A 13-card hand with long names fits a phone viewport. Motion effects are gated by the user's preference. |
| 5. Release | Hosted smoke test passed | The public Worker served the app, health endpoint, source revision, and license. Independent WebSocket clients verified room isolation, private hands, reconnect, a finished match, and rematch from one network. A two-network browser test and usage measurements remain open. |
