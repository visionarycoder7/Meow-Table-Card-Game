# Release and licensing

## Meow Table identity

Use **Meow Table** in the UI, project descriptions, release notes, screenshots, and public links. Use original card faces, back designs, rules wording, names, and sounds. Keep a record of where third-party assets and dependencies came from, what licenses apply, and what attribution they require.

Use the brand as a working name until the owner checks similar names and logos in the markets where the game will be offered. Review the public repository name, live domain, and older public artifacts at release. The existing remote and domain are managed by the owner.

The local match uses original cream ticket panels over full-color suits. Numbered cards, actions, and wilds each have their own panel silhouette. Card backs use the Meow Table wordmark and cat mark. The editable templates are in `assets/cards/faces/`. Brand and visual similarity still require review before a public release. [U.S. Copyright Office guidance on games](https://www.copyright.gov/register/tx-games.html) [USPTO guidance on likelihood of confusion](https://www.uspto.gov/trademarks/search/likelihood-confusion)

### Branding files and share metadata

The upgraded app serves its [original SVG mark](../assets/branding/mark.svg), [editable social card](../assets/branding/social-card.svg), and raster exports from `assets/branding/`. Keep reusable suit marks in `assets/cards/suits/`, effect symbols in `assets/cards/actions/`, and card-back art in `assets/cards/backs/`. The browser combines the back pattern with the primary mark and the Meow Table name. Numbered and action faces share a React component and use these SVGs for the symbols. The artwork ships under [AGPLv3](../LICENSE). Vite serves the files from the site root and copies them into the production client output. [Vite public directory](https://vite.dev/config/shared-options.html#publicdir)

| Asset | Export |
| --- | --- |
| Browser favicon | `mark.svg` and `favicon.ico` with 16, 32, and 48 px entries |
| Table direction icon | `assets/table/turn-track.svg`, mirrored on a reverse turn |
| Apple touch icon | `apple-touch-icon.png` at 180 × 180 with a solid evergreen background |
| Web app icons | 192 and 512 px PNGs, plus a 512 px maskable export with the mark scaled to 75% around the center |
| Social card | `social-card.png` at 1200 × 630, exported from `social-card.svg` |

When exporting icons, keep the square canvas. Fill the touch and app icon backgrounds with `#0e1a14`. Leave generous space inside the maskable icon so platform crops preserve the mark. Inspect the favicon at 16 px and the social card at thumbnail size before replacing the exports. Keep image dimensions and references in `site.webmanifest` and the HTML head in sync. [Web app icon guidance](https://web.dev/learn/pwa/web-app-manifest)

For a hosted build, set `VITE_PUBLIC_SITE_URL` to its HTTPS origin and `VITE_PUBLIC_SOURCE_URL` to the public source for the deployed commit. Run `npm run build:hosted`. Vite writes the canonical and absolute social-image URLs into the HTML. Verify the public page and PNG while signed out. [Deployment guide](deployment.md) [Open Graph protocol](https://ogp.me/)

## Applying AGPLv3

The [LICENSE file](../LICENSE) contains GNU AGPL version 3. Before publishing the licensed release, the repository owner should confirm that the existing contributors and any other copyright holders have authorized distribution of their work under these terms. Dependencies keep their upstream licenses and required notices. [GNU licensing guidance](https://www.gnu.org/licenses/gpl-howto.html)

Keep **Source** in the hosted toolbar and **License** in the Card guide. The Source link should lead to the exact deployed revision or a source archive that includes the game server, browser app, and scripts needed to build and run that version. The License link downloads the bundled repository license. Check both links in a signed-out browser. Modified versions used over a network must prominently offer the corresponding source under Section 13. [GNU AGPLv3](https://www.gnu.org/licenses/agpl-3.0.html#section13)

Keep personal reference notes in `*.local.md` files and discuss implementation and playtest results in public pull requests using the Meow Table terminology.
