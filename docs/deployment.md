# Deploy the first Meow Table playtest

Use **Cloudflare Workers Free** for the React frontend and the multiplayer Worker. Cloudflare serves the compiled Vite files and the WebSocket endpoint from one HTTPS origin. The first deploy creates the app's SQLite-backed `Room` Durable Object namespace from the committed Wrangler migration. One object per room holds that room's game state. [Cloudflare Vite guide](https://developers.cloudflare.com/workers/vite-plugin/tutorial/) [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)

| Setting | Use for this release |
| --- | --- |
| Product and plan | **Workers & Pages**, **Workers Free** |
| Worker name | `meow-table` from `backend/wrangler.jsonc` |
| Public address | `https://meow-table.<your-subdomain>.workers.dev` |
| Deploy method | Manual Wrangler CLI from the repository root |
| Storage and rate limiting | Wrangler provisions the `Room` migration and uses the committed `LOBBY_LIMIT` binding |
| GitHub integration and custom domain | Optional after the first hosted playtest |

The repository tracks `frontend/index.html`, frontend and Worker source, public assets, the Wrangler config, package manifests and lockfile, CI, and the license. Git ignores the root prototype, local deployment records, credentials, dependencies, generated Worker types, and build output. The local build regenerates everything Wrangler uploads.

## 1. Prepare the release revision

1. Install Node.js **24.22.1**, the version in `.nvmrc`, and open PowerShell in the repository root.
2. Review the local release commit and push it to the public source repository. If the branch requires a pull request, merge it and build from the resulting commit. The hosted **Source** link must open the exact deployed revision in a signed-out window. The **License** link downloads the bundled AGPL license. [Release and licensing](release-and-licensing.md)
3. Install and verify the workspace.

   ```powershell
   npm ci
   npm test
   npm run check
   ```

GitHub's **Verify Meow Table / verify** job runs the equivalent checks, hosted build, and Wrangler dry run. If a GitHub ruleset requires the old **Verify static app** or a Vercel status, have the repository owner replace that release check with the new verification job. The checked-in `vercel.json` disables new automatic Vercel Git deployments so the previous static deployment can remain available during this playtest. [Vercel Git configuration](https://vercel.com/docs/project-configuration/git-configuration#turning-off-all-automatic-deployments)

## 2. Set up Cloudflare Free

1. Sign in to the Cloudflare dashboard and select the account you intend to use. Open **Workers & Pages** and confirm that the account uses **Workers Free**.
2. Set a **workers.dev** account subdomain if one has not been set. The page shows it beside **Your subdomain**.
3. Check that **meow-table** is available, or that an existing Worker with that name is the intended Meow Table project. If it belongs to something else, select an unused name in `backend/wrangler.jsonc`, commit that change, and use the corresponding origin below.
4. Sign in with the repository's Wrangler version and verify the active account.

   ```powershell
   npm exec --workspace @meow-table/web -- wrangler login
   npm exec --workspace @meow-table/web -- wrangler whoami
   ```

The CLI creates the Worker on the first deploy. Use the CLI and committed bindings for this pilot. The dashboard is where you check the plan, name, route, and usage. [Configure workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/#configure-workersdev)

## 3. Build, dry-run, and publish

Run these PowerShell commands in the same terminal. Replace the example account subdomain and source repository URL.

```powershell
$env:VITE_PUBLIC_SITE_URL = 'https://meow-table.your-subdomain.workers.dev'
$sourceRepo = 'https://github.com/your-account/your-public-repo'
$releaseRevision = (git rev-parse HEAD).Trim()
$env:VITE_PUBLIC_SOURCE_URL = "$sourceRepo/tree/$releaseRevision"

npm run build:hosted
npm run deploy:dry-run
```

Confirm that Wrangler selects the generated configuration in `frontend/dist/meow_table/` and lists `ROOMS`, `LOBBY_LIMIT`, and static assets. If the dry run fails, fix the problem before publishing. Then deploy from the same terminal:

```powershell
npm run deploy
```

This command builds the hosted bundle again with those two public values, then deploys it through Wrangler. They are baked into the frontend. The setup uses no application secrets. Wrangler prints the HTTPS URL and version ID. Save them with the Git revision in `deployment.local.md`.

To inspect the compiled candidate locally before publishing, run `npm start` after `npm run build:hosted` and open [localhost:4173](http://localhost:4173/).

## 4. Test the deployed game

1. Open the printed HTTPS URL in a signed-out browser. Check that the game, favicon, **Source**, and **License** load and that `/healthz` returns `{"status":"ok"}`.
2. Create a private room and invite a friend on another network, such as mobile data. Confirm that joining shows the same roster. DevTools **Network → WS** should show the socket connected on the same hostname.
3. Play to a result and start a rematch. Exercise a wild suit choice, Tail Spin, and Pounce. Refresh one player's tab during a pending choice and check that their private hand returns.
4. Start a separate room at the same time. Confirm the two rosters are independent. Run a solo game with bots and try **Back to lobby** after the result.
5. Check **Workers & Pages → meow-table → Metrics** and note errors, Worker requests, and Durable Object usage. Free limits apply across the account. When a quota is exhausted, affected operations fail until the quota resets. [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)

Check these common failures before sharing the link widely:

| Symptom | Check |
| --- | --- |
| Wrong Cloudflare account | Run `wrangler whoami` and select the intended account. |
| Wrong share address or Source link | Set the two `VITE_PUBLIC_*` values in the build terminal. Rebuild and deploy from the intended commit. |
| Home loads but room creation fails | Check `/healthz`, the same-origin socket, and the `ROOMS` and `LOBBY_LIMIT` bindings. Confirm that Wrangler used the Vite-generated configuration. |
| Empty or stale Source link | Check the commit URL while signed out and confirm the release commit is pushed to the source repository. |
| A later release fails | Inspect **Deployments** for the last known-good Worker version. Rollback restores code, while Durable Object state has its own lifecycle. [Cloudflare rollback guide](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/) |

Keep the existing Vercel URL available until the hosted playtest passes. Use the Workers URL for this round of testing before deciding on a custom domain or moving the old public address.
