# Deploy Meow Table from the Cloudflare website

**Cloudflare Workers Free is the only hosting platform you need.** One Worker serves the React frontend and multiplayer endpoints from one HTTPS address. Cloudflare Durable Objects store room state. Connect GitHub to Cloudflare Workers Builds with `main` as the production branch. Each push to `main`, including a merged pull request, triggers a build. A successful build deploys automatically. [Cloudflare branch control](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/#change-production-branch)

In Cloudflare, choose the **GitHub** import option. You enter the build settings in your browser. Cloudflare runs the commands on its own servers, so you can publish without opening a terminal. [Cloudflare dashboard guide](https://developers.cloudflare.com/workers/get-started/dashboard/)

## 1. Prepare the release in GitHub

1. Open the Meow Table repository on [GitHub](https://github.com/visionarycoder7/Meow-Table-Card-Game). If you are deploying from your own fork, use that repository for every step below.
2. Select **main** in the branch picker. On the **Actions** tab, look for a green **Verify Meow Table** run for the commit you intend to publish.
3. Copy the repository's browser address from its **Code** tab. Keep the base URL, such as `https://github.com/your-account/your-repository`, with no trailing slash or `.git`. Open it in a signed-out window to confirm the source is public. The game links players to the exact deployed commit. [Release and licensing notes](release-and-licensing.md)

## 2. Set up your Cloudflare Free account

1. Sign in to the [Cloudflare dashboard](https://dash.cloudflare.com/), or create an account and verify your email.
2. Select the account that will own the game. Open **Workers & Pages** and stay on **Workers Free**. Use its included `workers.dev` address for this playtest.
3. On **Workers & Pages**, look for **Your subdomain**. If prompted to set one up, choose an available name. Cloudflare also documents the **Change** control next to **Your subdomain**. The Meow Table account subdomain is `meow2004`. Use [meow-table.meow2004.workers.dev](https://meow-table.meow2004.workers.dev/) as the game address. For a separate deployment, substitute your account subdomain. [Configure workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/#configure-workersdev)

## 3. Import the GitHub repository as a Worker

1. In **Workers & Pages**, select **Create application** and choose **GitHub** or **Connect to GitHub** under the Worker creation options. If prompted to choose between **Workers** and **Pages**, select **Workers**. The project uses a Worker with static assets, WebSockets, and Durable Objects. [Connect a new Worker](https://developers.cloudflare.com/workers/ci-cd/builds/#connect-a-new-worker)
2. Sign in to GitHub if prompted. For the **Cloudflare Workers & Pages** GitHub App, choose **Only select repositories** and grant access to the Meow Table repository. If the repository is missing, ask its owner to install or configure the GitHub App for that repository. Then return to Cloudflare and select the repository. [GitHub App permissions](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/#manage-access)
3. If you've already created the intended `meow-table` Worker in this account, open it and use **Settings → Builds → Connect** instead of creating a duplicate. The settings below apply to either route. [Connect an existing Worker](https://developers.cloudflare.com/workers/ci-cd/builds/#connect-an-existing-worker)

## 4. Fill in the build and deploy settings

### Replace the three defaults on Create an app

After selecting the GitHub repository, Cloudflare opens **Create an app**. Start with the three fields visible above the blue **Deploy** button. [Workers Builds settings](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/#build-settings)

| Field | Prefilled value you may see | What to enter |
| --- | --- | --- |
| **Project name** | `meow-table-card-game` | `meow-table` |
| **Build command** | `npm run build` | Paste the hosted build command below, even though the form marks this field optional |
| **Deploy command** | `npx wrangler deploy` | Paste the workspace deploy command below |

**Build command**

```sh
cd .. && npm ci && VITE_PUBLIC_SOURCE_URL="$MEOW_PUBLIC_SOURCE_REPO/tree/$WORKERS_CI_COMMIT_SHA" npm run build:hosted
```

**Deploy command**

```sh
cd .. && npm exec --workspace @meow-table/web -- wrangler deploy
```

### Set the preview and access options

Below **Deploy command** on the **Create an app** screen, set these options before selecting **Deploy**.

| Dashboard field | Value |
| --- | --- |
| **Preview command** | Keep `npx wrangler preview`. Cloudflare only runs it when preview builds are enabled. |
| **Enable Preview builds** | Turn it **off**. Only the production branch needs a build for this playtest. |
| **Protect with Cloudflare Access** | Leave it **off** so friends can open the game link without a Cloudflare sign-in. |

[Cloudflare preview build settings](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/#configure-preview-builds) · [Access on workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/#manage-access-to-workersdev)

### Scroll inside the setup panel for the other settings

Scroll the form itself, then expand **Advanced settings** if present. For a Worker already created, open **Workers & Pages → meow-table → Settings → Build**. Some dashboards label the tab **Builds**. [Workers Builds settings](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/#build-settings)

| Dashboard field | Value |
| --- | --- |
| **Root directory** or **Path** | `backend`. Both commands above assume this starting directory. |
| **Production branch** | Select `main` if the import screen offers a branch picker. Otherwise, Cloudflare uses the GitHub repository's default branch. |
| **API token** | Select **Create new token** if prompted. For **API token name**, enter `meow-table-builds`. Cloudflare generates the token automatically. |
| **Framework preset**, if shown | **None** or the custom option |
| **Build watch paths** | Under **Settings → Build → Build watch paths**, include `*` and leave excludes empty. This covers every file, including documentation. [Cloudflare watch paths](https://developers.cloudflare.com/workers/ci-cd/builds/build-watch-paths/#configure-paths) |

**If you see no production branch field**, continue with the import if GitHub's default branch is `main`. Once the Worker exists, go to **Workers & Pages → meow-table → Settings → Build → Branch control** and verify `main`. Change it there if needed. [Cloudflare branch settings](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/#change-production-branch)

The `backend` setting lets Workers Builds find the committed Wrangler configuration and match its Worker name. Both commands then go up to the repository root, where the npm workspace and lockfile live. The build generates one Worker package containing the frontend assets and backend. On the first deployment, Wrangler applies the SQLite-backed `Room` migration and configures `ROOMS`, `LOBBY_LIMIT`, and the asset routing from the repo. [Worker name requirement](https://developers.cloudflare.com/workers/ci-cd/builds/troubleshoot/#workers-name-requirement) · [Durable Object migrations](https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/)

### Add the build variables

Use **Build variables and secrets**, under **Settings → Build** if the form has already closed. Add these as plain text values. They belong to the build because Vite reads them when compiling the frontend. [Cloudflare build variables](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/#overriding-default-versions)

| Variable name | Value |
| --- | --- |
| `VITE_PUBLIC_SITE_URL` | `https://meow-table.meow2004.workers.dev` |
| `MEOW_PUBLIC_SOURCE_REPO` | `https://github.com/visionarycoder7/Meow-Table-Card-Game`. Use your fork's public URL if deploying a fork. Leave off the trailing slash. |
| `NODE_VERSION` | `24.22.1`, the version in the repo's `.nvmrc` |
| `SKIP_DEPENDENCY_INSTALL` | `1`, because the build command installs from the root lockfile |

Cloudflare supplies `WORKERS_CI_COMMIT_SHA` automatically. The build uses it to point the game's **Source** link at the revision being deployed. The two example URLs above are public values. This app requires no runtime variables, application secrets, custom domain, or separate database setup for the playtest. [Default Workers Builds variables](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/#default-variables)

## 5. Deploy and find the game URL

1. Before clicking **Deploy**, confirm that the project is named `meow-table`, the root is `backend`, both toggles are off, and all four build variables are saved. If the branch picker is visible, confirm `main`. Select **Save and Deploy** or **Deploy**, then verify `main` in **Branch control** if the picker was absent. If the Worker already exists and no build starts, the next push or pull request merge to `main` will trigger one. If an earlier attempt failed because fields were missing, save the settings and retry the build for the intended branch from **Deployments → View build history**.
2. Open **Workers & Pages → meow-table → Deployments**. Select **View build history** to follow the build and inspect errors. Confirm there is an **Active Deployment** for the intended commit.
3. From the Worker overview, use **Visit** or copy the address under **Settings → Domains & Routes**. Confirm it matches `VITE_PUBLIC_SITE_URL`. If the `workers.dev` route is inactive, check the account subdomain and enable the route.
4. Record the public URL, Git commit, and active version ID in your ignored `deployment.local.md`. [Build history](https://developers.cloudflare.com/workers/ci-cd/builds/#view-build-and-preview-url) · [Workers routes](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)

## 6. Verify the hosted game

1. Open the Workers URL in a private browser window. Check that the game and favicon load. Open **Source** in the toolbar and compare the commit with the active deployment. In **Card guide**, use **License** and confirm it opens the repository's AGPL license tab on GitHub.
2. Add `/healthz` to the game address. It should return `{"status":"ok"}`.
3. Create a room and send its invite link to a friend on a different network, such as mobile data. Check that both players see the same roster, can play cards, and can finish a match and start a rematch. Refresh one player's tab during a match and confirm that their hand returns. Try a wild suit choice, Tail Spin, and Pounce.
4. Keep that room open and start a separate room in another browser profile. Check that the rosters and moves stay independent. Try a solo match with bots and return to the lobby.
5. In Cloudflare, open the Worker's **Metrics** and check for errors. Check account usage under **Workers & Pages** during the test. Worker, Durable Object, and build quotas have separate Free limits. [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) · [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/) · [Workers Builds limits](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/)

## 7. Publish another version from the websites

1. Open a pull request into `main`. Review the changes and confirm the **Verify Meow Table** check passes before merging.
2. Merge when the change is ready to go live. Cloudflare starts a production build for the merge or any direct push to `main`. Keep **Enable Preview Builds** off under **Settings → Build → Branch control** to limit Cloudflare builds to `main`.
3. In **Deployments → View build history**, confirm the build succeeded and its commit is active. Repeat the health and multiplayer checks. [Cloudflare branch control](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/)

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
