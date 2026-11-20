# Vercel deployment setup

Use the production URL listed in the Vercel project dashboard. GitHub Actions verifies pushes to `main` or `dev` and pull requests targeting either branch. Vercel’s native Git integration handles production deploys for owner-authored commits and also deployed a contributor push to the live site during verification. [Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github)

## Automatic contributor deploys through GitHub Actions

To enable the separate Actions deploy job for contributor changes, configure the production project and repository together:

1. In **Vercel → Settings → Git**, create a Deploy Hook for `main` in the project that owns the live domain. [Vercel Deploy Hooks](https://vercel.com/docs/deploy-hooks)
2. In GitHub, restrict the `production` environment to `main` and add the hook URL as the environment secret `VERCEL_DEPLOY_HOOK_URL`. Then set the repository Actions variable `VERCEL_AUTO_DEPLOY_HOOK` to `true`. The secret authorizes the request. The variable enables it on pushes. [GitHub deployment environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments) · [GitHub Actions variables](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#vars-context)
3. After the next push with a contributor-authored tip commit, confirm that **Verify and deploy to Vercel** passes verification and queues the hook. Then confirm Vercel reports **Ready**. A push with an owner-authored tip commit skips the hook. GitHub determines the tip author even when someone else pushed the commit.

The hook builds the latest tip of `main`. When both the hook and native Git integration deploy contributor pushes, Vercel can queue both builds. Leave the Actions variable unset if native Git alone is sufficient. To manually request a redeploy, run **Actions → Verify and deploy to Vercel** from `main` with the hook secret configured.

## Multiple Vercel checks on a commit

GitHub shows a status for each connected Vercel project. Identify the project that owns the live domain before investigating failures. If another connected project fails, the Vercel owner can inspect its deployment logs and fix it if it is in use, or disconnect its Git integration if it is obsolete. [Vercel Git settings](https://vercel.com/docs/project-configuration/git-settings)
