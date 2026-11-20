# Vercel deployment setup

The production site uses Vercel’s native Git integration on `main` for owner and contributor pushes. GitHub Actions runs **Verify static app** on pushes to `main` or `dev` and on pull requests targeting either branch. The intended checks on production pushes are **Verify static app** and the deployment status from the Vercel project that owns the live domain. [Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github)

## Multiple Vercel checks on a commit

GitHub shows a status for each connected Vercel project. To stop an unused project from reporting on future commits, its owner can open **Settings → Git → Connected Git Repository → Disconnect** in that project. Keep the project that owns the live domain connected. [Vercel Git settings](https://vercel.com/docs/project-configuration/git-settings)
