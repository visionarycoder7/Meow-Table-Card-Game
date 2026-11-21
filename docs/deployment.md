# Deploy Meow Table from the Cloudflare website

**Cloudflare Workers Free is the only hosting platform you need.** One Worker serves the React frontend and multiplayer endpoints from one HTTPS address. Cloudflare Durable Objects store room state. GitHub stores the source code and sends the selected release branch to Cloudflare.

In Cloudflare, choose the **GitHub** import option. You enter the build settings in your browser. Cloudflare runs the commands on its own servers, so you can publish without opening a terminal. [Cloudflare dashboard guide](https://developers.cloudflare.com/workers/get-started/dashboard/)

## 1. Prepare the release in GitHub

1. Open the Meow Table repository on [GitHub](https://github.com/visionarycoder7/Meow-Table-Card-Game). If you are deploying from your own fork, use that repository for every step below.
2. Select **main** in the branch picker. On the **Actions** tab, look for a green **Verify Meow Table** run for the commit you intend to publish.
3. Return to the **Code** tab. Open the branch picker, type **playtest**, and choose **Create branch: playtest from main**. If `playtest` already exists, check its latest commit before connecting it to Cloudflare. This guide uses `playtest` as the deployment branch so you decide when to publish from GitHub.
4. Copy the repository's browser address from its **Code** tab. Keep the base URL, such as `https://github.com/your-account/your-repository`, with no trailing slash or `.git`. Open it in a signed-out window to confirm the source is public. The game links players to the exact deployed commit. [Release and licensing notes](release-and-licensing.md)

## 2. Set up your Cloudflare Free account

1. Sign in to the [Cloudflare dashboard](https://dash.cloudflare.com/), or create an account and verify your email.
2. Select the account that will own the game. Open **Workers & Pages** and stay on **Workers Free**. Use its included `workers.dev` address for this playtest.
3. On **Workers & Pages**, look for **Your subdomain**. If prompted to set one up, choose an available name. Cloudflare also documents the **Change** control next to **Your subdomain**. If the account subdomain is `example-player`, your game address will be `https://meow-table.example-player.workers.dev`. Copy your own address for the build settings. [Configure workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/#configure-workersdev)

## 3. Import the GitHub repository as a Worker

1. In **Workers & Pages**, select **Create application** and choose **GitHub** or **Connect to GitHub** under the Worker creation options. If prompted to choose between **Workers** and **Pages**, select **Workers**. The project uses a Worker with static assets, WebSockets, and Durable Objects. [Connect a new Worker](https://developers.cloudflare.com/workers/ci-cd/builds/#connect-a-new-worker)
2. Sign in to GitHub if prompted. For the **Cloudflare Workers & Pages** GitHub App, choose **Only select repositories** and grant access to the Meow Table repository. If the repository is missing, ask its owner to install or configure the GitHub App for that repository. Then return to Cloudflare and select the repository. [GitHub App permissions](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/#manage-access)
3. If you've already created the intended `meow-table` Worker in this account, open it and use **Settings → Builds → Connect** instead of creating a duplicate. The settings below apply to either route. [Connect an existing Worker](https://developers.cloudflare.com/workers/ci-cd/builds/#connect-an-existing-worker)

## 4. Fill in the build and deploy settings

Enter these values on the import screen. Open **Advanced settings** if the form groups any fields there. For an existing Worker, use **Settings → Build** or **Settings → Builds**. [Workers Builds settings](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/#build-settings)

| Dashboard field | Value |
| --- | --- |
| Worker name / Project name | `meow-table` |
| Production branch | `playtest` |
| Root directory / Path | `backend` |
| Build command | Paste the first line below |
| Deploy command | Paste the second line below |
| API token | Use the dashboard's default generated token, or select **Create new token** if prompted |
| Enable Preview Builds | Off for this first playtest |
| Framework preset, if shown | **None** or the custom option, then enter the commands below |
| Build watch paths, if shown | Leave the defaults so changes anywhere in the repository can trigger a build |

Paste this into **Build command**.

```sh
cd .. && npm ci && VITE_PUBLIC_SOURCE_URL="$MEOW_PUBLIC_SOURCE_REPO/tree/$WORKERS_CI_COMMIT_SHA" npm run build:hosted
```

Paste this into **Deploy command**.

```sh
cd .. && npm exec --workspace @meow-table/web -- wrangler deploy
```

The `backend` setting lets Workers Builds find the committed Wrangler configuration and match its Worker name. Both commands then go up to the repository root, where the npm workspace and lockfile live. The build generates one Worker package containing the frontend assets and backend. On the first deployment, Wrangler applies the SQLite-backed `Room` migration and configures `ROOMS`, `LOBBY_LIMIT`, and the asset routing from the repo. [Worker name requirement](https://developers.cloudflare.com/workers/ci-cd/builds/troubleshoot/#workers-name-requirement) · [Durable Object migrations](https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/)

### Add the build variables

Use **Build variables and secrets**, under **Settings → Build** if the form has already closed. Add these as plain text values. They belong to the build because Vite reads them when compiling the frontend. [Cloudflare build variables](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/#overriding-default-versions)

| Variable name | Value |
| --- | --- |
| `VITE_PUBLIC_SITE_URL` | Your real game address from step 2, such as `https://meow-table.example-player.workers.dev` |
| `MEOW_PUBLIC_SOURCE_REPO` | Your public GitHub repository URL from step 1, with no trailing slash |
| `NODE_VERSION` | `24.22.1`, the version in the repo's `.nvmrc` |
| `SKIP_DEPENDENCY_INSTALL` | `1`, because the build command installs from the root lockfile |

Cloudflare supplies `WORKERS_CI_COMMIT_SHA` automatically. The build uses it to point the game's **Source** link at the revision being deployed. The two example URLs above are public values. This app requires no runtime variables, application secrets, custom domain, or separate database setup for the playtest. [Default Workers Builds variables](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/#default-variables)

## 5. Deploy and find the game URL

1. Select **Save and Deploy** or **Deploy**. Cloudflare builds the selected branch and deploys the result. If you connected an existing Worker and no build starts, merge a release into `playtest` from GitHub to trigger one.
2. Open **Workers & Pages → meow-table → Deployments**. Select **View build history** to follow the build and inspect errors. Confirm there is an **Active Deployment** for the intended commit.
3. From the Worker overview, use **Visit** or copy the address under **Settings → Domains & Routes**. Confirm it matches `VITE_PUBLIC_SITE_URL`. If the `workers.dev` route is inactive, check the account subdomain and enable the route.
4. Record the public URL, Git commit, and active version ID in your ignored `deployment.local.md`. [Build history](https://developers.cloudflare.com/workers/ci-cd/builds/#view-build-and-preview-url) · [Workers routes](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)

## 6. Verify the hosted game

1. Open the Workers URL in a private browser window. Check that the game and favicon load. Open **Source** and compare the commit with the active deployment. Open **License** and confirm it loads the AGPL license.
2. Add `/healthz` to the game address. It should return `{"status":"ok"}`.
3. Create a room and send its invite link to a friend on a different network, such as mobile data. Check that both players see the same roster, can play cards, and can finish a match and start a rematch. Refresh one player's tab during a match and confirm that their hand returns. Try a wild suit choice, Tail Spin, and Pounce.
4. Keep that room open and start a separate room in another browser profile. Check that the rosters and moves stay independent. Try a solo match with bots and return to the lobby.
5. In Cloudflare, open the Worker's **Metrics** and check for errors. Check account usage under **Workers & Pages** during the test. Worker, Durable Object, and build quotas have separate Free limits. [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) · [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/) · [Workers Builds limits](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/)

## 7. Publish another version from the websites

1. On GitHub, open **Pull requests → New pull request**. Select **base: playtest** and **compare: main**.
2. Review the commits, open the pull request, and merge it when you want to publish. Changes merged into `playtest` trigger the Cloudflare build. Keep **Enable Preview Builds** off under **Settings → Build → Branch control** if you only want release-branch builds.
3. Confirm the new deployment is active in Cloudflare and repeat the health and multiplayer checks. [Cloudflare branch control](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/)

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Repository is missing from the picker | In GitHub, check **Settings → Applications → Installed GitHub Apps → Cloudflare Workers & Pages → Configure**. The repository owner can grant the app access to this repository. |
| Cloudflare suggests an automatic setup pull request, or reports a Worker name mismatch | Check **Root directory** is `backend` and the Worker name is `meow-table`. This repo already has a Wrangler configuration and Vite integration. |
| npm cannot find the workspace or lockfile | Check both commands start with `cd .. &&` and that `SKIP_DEPENDENCY_INSTALL` is `1`. The build starts in `backend` and installs from the repository root. |
| The build asks for public URLs | Put both URL inputs in **Build variables and secrets** as text. Verify the game origin starts with `https://` and the GitHub base URL has no trailing slash. |
| The home page loads but rooms fail | Open `/healthz` and check the active deployment has the `ROOMS` and `LOBBY_LIMIT` bindings. In browser DevTools, inspect **Network → WS** for the socket on the same hostname. Check deployment logs for errors. |
| You corrected a failed build setting | Open **Deployments → View build history**, select the failed build and choose **Retry build**. Check that it targets the intended revision before retrying. |
| A release breaks the live game | In **Deployments**, choose the previous known-good version and use **Rollback** if available. This restores a Worker version. Room data has its own lifecycle, and a Durable Object migration can prevent rolling back to an older version. [Cloudflare rollback guide](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/) |

[Cloudflare build troubleshooting](https://developers.cloudflare.com/workers/ci-cd/builds/troubleshoot/)
