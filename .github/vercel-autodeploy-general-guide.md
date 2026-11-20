# Vercel deployment setup

Use the production URL listed in the Vercel project dashboard. Every push to `main` runs verification regardless of which files changed. Once verification passes, GitHub Actions requests a Vercel deployment if the author of the new tip commit differs from the GitHub repository owner or has no GitHub username in the push event. When the tip commit is authored by the repository owner, Vercel's Git integration handles the deployment.

The hook builds the latest tip of its configured branch. Its response confirms the request was accepted. The Vercel dashboard shows whether the deployment finished successfully.

## Owner setup

1. In the Vercel project serving the production URL, open **Settings → Git**. Confirm the connected repository and the production branch. Keep native Git deployments enabled for the repository owner's commits and create a Deploy Hook for `main`. [Vercel Deploy Hooks](https://vercel.com/docs/deploy-hooks)
2. In GitHub, create or select the `production` environment under **Settings → Environments**. Limit deployments to `main` and add the hook URL as the environment secret `VERCEL_DEPLOY_HOOK_URL`. Treat the URL as a credential. [GitHub deployment environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)
3. Merge the workflows. Check **Actions → Deploy to Vercel** after a push to `main`, or manually run it from `main`. Check that the resulting deployment in Vercel is **Ready** and serves the expected changes at the production URL.

For a push containing multiple commits, the workflow checks the author of the final commit. This handles a contributor-authored commit merged or pushed by the owner. A manual run from `main` always requests the hook after verification passes. Pull requests run verification, and previews depend on the project's Vercel Git settings.
