# Contributor workflow

Keep personal rulebook PDFs and comparison notes under `references/local/` or use the ignored `*.local.pdf` and `*.local.md` suffixes. The tracked game rules describe Meow Table in its own wording.

**Status:** Proposed implementation sequence

## Before implementation

Review the [product](product-and-gameplay.md) and [architecture](architecture.md) with the owner. Pin the working branch and milestone before editing. Use the ignored root prototype or `git show 0e78756:index.html` for reference and test the tracked app on localhost.

## Milestones

| Milestone | Work | Ready for review when |
| --- | --- | --- |
| 1. Workspace setup | Set up npm workspaces, the React browser app, and local backend tooling. Add the root commands from the [build contract](architecture.md#build-and-deployment-contract) as their features land. | From a clean checkout, run `npm ci`, `npm run check`, `npm run build`, and `npm start`. The app shell loads and `/healthz` responds. |
| 2. Online room flow | Build guest entry, room creation, invites, presence, and host-controlled locking. Use the Worker and one Durable Object per room. | Independent browser sessions join the same localhost lobby. A second room stays isolated, admission and capacity are enforced, and the production preview runs locally. |
| 3. Playable match | Implement one complete game loop first, including deal, legal play or draw, turn advance, result, and rematch. Then add each approved original card effect in a small change with its rule tests. | Two independent sessions finish a full game and rematch. The engine tests cover each approved action and edge case. Each browser receives only its own hand. |
| 4. Recovery and Meow identity | Handle refresh, disconnect, seat expiry, and host transfer. Add original card visuals and owner-approved Meow touches. Check phone layout, keyboard use, and audio controls. | A reconnect restores the correct hand and any pending decision. Friends can finish a game on separate devices. |
| 5. Release | Run workspace checks in CI and verify the compiled app locally. Document rollback and room lifecycle. Codex handles [hosted release verification](implementation-phases.md#hosted-release-verification) after the owner publishes the candidate. | Local release checks pass first. Codex verifies the hosted checks before the owner shares the public URL. |

Use focused branches and pull requests against `main`. Link each PR to the agreed milestone. Include reproduction steps and test results. For UI changes, add a short recording or screenshots of the affected flow. Ask the owner to review player-facing rule and theme decisions before merge.

## Working with Codex and Antigravity

Use the [phase implementation guide](implementation-phases.md) to assign a specific phase, record Codex's independent verification, and commit locally. The owner pushes the commits manually.

Give each agent one independently reviewable milestone slice. If both are working at once, use separate branches or worktrees and agree on which paths each agent owns. Merge changes to the shared protocol before assigning dependent server or browser changes. Both agents should read the current checkout and Git status at the start so they pick up work already in progress.

Start a handoff with a self-contained brief. Use exact file paths and commands once they exist. Copy the acceptance checks for that slice into the brief so the receiving agent can verify the work without reading the conversation.

| Brief section | What to include |
| --- | --- |
| Goal | One player-visible outcome or one repository deliverable. Name the milestone and tracker ID. |
| Starting point | Branch or base commit, files to read, current behavior, and any dependencies already merged. |
| Scope | Files or directories the agent can edit, interfaces to preserve, and decisions that are still open. |
| Implementation | Ordered steps with the expected behavior at the normal entry point. Point to the approved rules and architecture whenever the task depends on them. |
| Acceptance | Commands to run, expected output, and manual steps if the change touches a browser flow. Include the failure paths relevant to the task. |
| Return | Changed files, checks actually run and their results, and open issues. Record the tracker ID, current status, and evidence in `progress.local.md` if present. Include the same details in the handoff or pull request. |

## Release checks

- Two, three, and six players can start valid matches. Invalid codes, full rooms, and closed lobbies produce clear messages.
- A player sees only their own hand. A second room's presence, turns, and results never appear in the first.
- Wrong-turn commands and illegal moves leave state intact. Duplicate commands take effect once. Two simultaneous requests cannot advance the same turn twice.
- Refresh and temporary network loss restore the same seat, hand, and pending choice. A departing host triggers a lobby handover or follows the same in-match disconnect rules as any other player.
- Every approved card effect has rule coverage. The full-room flow reaches a result and starts a fresh rematch with the expected participants and fresh hands.
- The hosted build works on a phone and a desktop on different networks. Expired rooms and service restarts show a clear recovery path.
- The hosted Source and License links work from a signed-out browser and match the shipped version. Review branding and asset provenance against the [release notes](release-and-licensing.md).

## Hosted playtest

Run this after the owner publishes the candidate using the [deployment guide](deployment.md). Codex owns verification before the owner shares the public URL. Antigravity can provide local evidence from its assigned phase.

1. Open the same pilot URL on a laptop over Wi-Fi and a phone on mobile data. Create a room on one device and join it from the other using the invite. Repeat once with a typed code.
2. Start a match, take turns on both devices, and confirm the discard, order, and hand counts agree after each move. Confirm each browser sees its own cards and that a full or started room rejects new guests.
3. Refresh during a turn or pending choice. Confirm the same hand and choice return. Temporarily take one device offline and reconnect before the grace period. Run a separate test past the deadline and confirm play can continue or end according to the approved rules.
4. Finish the match and rematch in the same room. Run a separate test where the host leaves and another eligible guest gains lobby control. Repeat the full match with a larger table before release.
5. Record the pilot URL, commit, devices, networks, and outcome by tracker ID. If the test fails, record the first failed step and whether it was a hosting, connection, room, or rule issue.
