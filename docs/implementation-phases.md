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
Do not push or deploy. Report changed files, commands actually run,
results, and anything Codex still needs to verify.
```

## Working agreement

1. Check Git status and the base commit. If both agents work at once, use separate branches or worktrees and agree on path ownership. Merge changes to the shared protocol before assigning dependent UI and server work.
2. Read the files and contracts for the phase. Use the project’s current scripts and versions. Verify configuration syntax in official documentation when changing it.
3. Keep the diff in the phase. Prefer concrete modules, descriptive names, and simple component props. Add tests where a rule, privacy boundary, or failure case needs proof. Preserve the prototype and its publishing path until a cutover is approved.
4. Report changed files, exercised paths, commands and results, assumptions, and remaining issues. An Antigravity handoff is ready for Codex review once it has that evidence.
5. **Codex verifies independently.** Read the diff, check normal entry points, and rerun the phase checks. Reproduce behavior rather than relying on screenshots or a written handoff. Mark only verified rows complete. Update `progress.local.md` if present. Otherwise put the same tracker ID and evidence in the handoff.
6. **Commit after verification.** Use one local commit per phase, or at most two when a clean split helps review. If Antigravity already made a phase commit, Codex uses the remaining slot for corrections and evidence. The owner pushes manually. Keep any authorized hosting changes separate.

## Phase 1 — Workspace and service foundation

**Tracker:** A02. **Commit:** `feat: scaffold the Meow Table workspace`

1. Set up npm workspaces and a root lockfile. Record the Node version. Provide root `dev`, `check`, `build`, and `start` scripts that run the actual apps.
2. Build a small React/Vite shell with Tailwind v4 and the existing green and gold palette. Start with a visual component and a screen that composes it. Add room controls in Phase 2 when they work.
3. Attach Socket.IO to the Express HTTP listener. Add `GET /healthz` returning `{"status":"ok"}`. Configure Vite to proxy health and socket requests locally. Serve the compiled web app from the production server.
4. Keep the root prototype and its publish path available. Introduce `packages/protocol/` in Phase 2 when the first room messages need it.

**Codex checks:** Run `npm ci`, `npm run check`, and `npm run build`. Run `npm start` and confirm the compiled app, its JS/CSS, the health endpoint, and a Socket.IO handshake work through one URL. Run `npm run dev` and confirm Vite serves the app and proxies health and the socket path. Check the shell at phone and desktop widths.

## Phase 2 — Rooms and lobby

**Tracker:** A03–A04. **Commit:** `feat: add private rooms and lobby presence`

1. Define the room commands and lobby snapshots needed now. Validate input on the server. Generate room codes and private seat credentials on the server. Keep credentials out of invites and public snapshots.
2. Implement create, join, presence, leave, and host-controlled start eligibility. Keep room state in memory. Use the same admission logic for typed codes and invite links.
3. Compose guest entry, create and join forms, roster, and invite controls. Cover loading, invalid input, full rooms, and lost connections. Keep the pilot separate from the prototype.

**Codex checks:** Use independent browser contexts to create and join by invite and by code. Verify two to six seats, full and unknown rooms, unauthorized start, and isolation between two rooms. Verify the hosted lobby on two real devices using separate networks. Keep the hosted check pending if access is unavailable.

## Phase 3 — Complete match and original card effects

**Tracker:** A05–A07. **Commit:** `feat: add the server-authoritative match loop`. A second commit can be `feat: add approved card effects and match outcomes`.

1. Start after A01 has an owner-approved original rules reference. Implement one complete deal, turn, play or draw, and result loop. Add the remaining approved effects with deterministic tests.
2. Process commands in order per room. Validate turn, match, card ownership, and pending decisions. Apply one change, enforce command IDs and expected revisions, and derive per-seat views after accepting the action.
3. Connect the table, hand, turn status, and choices to those views. Show the result and allow a rematch with a fresh deck and hands for the expected seats.

**Codex checks:** Finish and rematch a game in two independent sessions. Test two-player turns, deck exhaustion, approved effects, choice expiry, and match endings. Verify wrong-turn, stale, invalid, duplicate, and simultaneous commands. Inspect client payloads for leakage of hidden hands, deck order, or credentials.

## Phase 4 — Recovery and finished UI

**Tracker:** A08–A09. **Commit:** `feat: restore player seats and refine the match UI`

1. Rebind an authorized reconnect to its seat. Send the latest revision and pending choice. Invalidate any previous connection for that seat.
2. Handle host transfer, explicit leave, expired seats, and unavailable rooms. Check timers against reconnects and rematches so stale callbacks cannot affect newer state.
3. Finish the responsive table, large hands, long names, keyboard focus, reduced motion, original card visuals, and optional audio controls. Review the rendered UI with Impeccable and Unslop where available.

**Codex checks:** Refresh during a pending choice, drop and restore a network connection, let a seat expire, and leave as host. Confirm the shown hand stays correct and the room can continue or end under the approved rules. Finish and rematch on phone and desktop. Verify keyboard controls and reduced motion.

## Phase 5 — Pilot release

**Tracker:** A10. **Commit:** `ci: verify the Meow Table multiplayer release`

1. Add the workspace checks to the existing CI workflow. Run type checks, the build, rule and room tests, and the relevant browser flows.
2. Verify the owner-approved pilot when access is available. Document process restarts, room expiry, rollback, and how the hosted Source and License links point to the shipped release.
3. Use the [hosted playtest](contributor-workflow.md#hosted-playtest) before a public URL cutover. Record the build revision, devices, networks, and results.

**Codex checks:** Finish, reconnect, and rematch on two different networks. Check a larger table and signed-out Source and License links. Mark the phase verified once the hosted evidence is recorded.

## Phase status

| Phase | State | Evidence |
| --- | --- | --- |
| 1. Workspace | Verified | `npm ci`, `npm run check`, and `npm run build` passed. `npm start` served the compiled app, CSS and JS, `/healthz`, and a Socket.IO handshake. `npm run dev` served the app and proxied health and WebSockets. Chrome rendered the shell at 390 and 1280 CSS pixels. |
| 2. Rooms | Planned | Requires Phase 1. |
| 3. Match | Planned | Requires the lobby and approved original rules. |
| 4. Recovery and UI | Planned | Requires the match loop. |
| 5. Pilot | Planned | Requires the earlier phases and hosting access. |
