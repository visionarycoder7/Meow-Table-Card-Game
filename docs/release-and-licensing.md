# Release and licensing

## Meow Table identity

Use **Meow Table** in the UI, project descriptions, release notes, screenshots, and public links. Use original card faces, back designs, rules wording, names, and sounds. Keep a record of where third-party assets and dependencies came from, what licenses apply, and what attribution they require.

Use the brand as a working name until the owner checks similar names and logos in the markets where the game will be offered. Review the public repository name, live domain, and older public artifacts at release. The existing remote and domain are managed by the owner.

### Branding files and share metadata

The upgraded app serves its [original SVG mark](../apps/web/public/branding/mark.svg), [editable social card](../apps/web/public/branding/social-card.svg), and their raster exports from `apps/web/public/branding/`. The artwork ships with the project under [AGPLv3](../LICENSE). It uses original geometry and system type with no bundled font files. Use the SVGs as the editable sources.

| Asset | Export |
| --- | --- |
| Browser favicon | `mark.svg` and `favicon.ico` with 16, 32, and 48 px entries |
| Apple touch icon | `apple-touch-icon.png` at 180 × 180 with a solid evergreen background |
| Web app icons | 192 and 512 px PNGs, plus a 512 px maskable export with the mark scaled to 75% around the center |
| Social card | `social-card.png` at 1200 × 630, exported from `social-card.svg` |

When exporting icons, keep the square canvas. Fill the touch and app icon backgrounds with `#0e1a14`. Leave generous space inside the maskable icon so platform crops preserve the mark. Inspect the favicon at 16 px and the social card at thumbnail size before replacing the exports. Keep image dimensions and references in `site.webmanifest` and the HTML head in sync. [Web app icon guidance](https://web.dev/learn/pwa/web-app-manifest)

For the upgraded app's public build, set `VITE_PUBLIC_SITE_URL` to its final HTTPS origin before running `npm run build`. Vite writes the canonical and absolute social-image URLs into the HTML. Local builds include the branding assets, title, and description. At cutover, verify the public page and PNG URLs can be fetched by a signed-out visitor. [Open Graph protocol](https://ogp.me/)

## Applying AGPLv3

The [LICENSE file](../LICENSE) contains GNU AGPL version 3. Before publishing the licensed release, the repository owner should confirm that the existing contributors and any other copyright holders have authorized distribution of their work under these terms. Dependencies keep their upstream licenses and required notices. [GNU licensing guidance](https://www.gnu.org/licenses/gpl-howto.html)

Keep **Source** and **License** links visible in the hosted game. The static prototype serves its editable HTML directly. When the server-backed app ships, the Source link should lead to the exact deployed revision or a source archive that includes the game server, browser app, and scripts needed to build and run that version. Check those links from a signed-out browser. Modified versions used over a network must prominently offer the corresponding source under Section 13. [GNU AGPLv3](https://www.gnu.org/licenses/agpl-3.0.html#section13)

Keep personal reference notes in `*.local.md` files and discuss implementation and playtest results in public pull requests using the Meow Table terminology.
