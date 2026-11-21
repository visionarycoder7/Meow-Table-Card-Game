import type { HtmlTagDescriptor, Plugin } from 'vite';

const imageAlt = 'Meow Table wordmark next to a gold cat-shaped playing card on green felt.';

export function shareMetadata(siteUrl: string | undefined, sourceUrl: string | undefined, hosted: boolean): Plugin {
  if (hosted && (!siteUrl || !sourceUrl)) {
    throw new Error('Set VITE_PUBLIC_SITE_URL and VITE_PUBLIC_SOURCE_URL before building for hosting.');
  }
  if (sourceUrl) {
    const source = new URL(sourceUrl);
    if (source.protocol !== 'https:' || source.username || source.password) {
      throw new Error('VITE_PUBLIC_SOURCE_URL must be a public HTTPS URL to the deployed revision.');
    }
  }
  return {
    name: 'meow-table-share-metadata',
    transformIndexHtml() {
      const revision: HtmlTagDescriptor[] = sourceUrl
        ? [{ tag: 'meta', attrs: { name: 'meow-table-source', content: sourceUrl }, injectTo: 'head' }]
        : [];
      if (!siteUrl) return revision;

      const canonical = new URL(siteUrl);
      if (
        canonical.protocol !== 'https:' || canonical.pathname !== '/' ||
        canonical.search || canonical.hash || canonical.username || canonical.password
      ) {
        throw new Error('VITE_PUBLIC_SITE_URL must be a public HTTPS origin, for example https://game.example.');
      }

      const imageUrl = new URL('/branding/social-card.png', canonical).href;
      const openGraph: Record<string, string> = {
        'og:url': canonical.href,
        'og:image': imageUrl,
        'og:image:type': 'image/png',
        'og:image:width': '1200',
        'og:image:height': '630',
        'og:image:alt': imageAlt,
      };

      const tags: HtmlTagDescriptor[] = [
        { tag: 'link', attrs: { rel: 'canonical', href: canonical.href } },
        ...Object.entries(openGraph).map(([property, content]) => ({
          tag: 'meta',
          attrs: { property, content },
        })),
        { tag: 'meta', attrs: { name: 'twitter:image', content: imageUrl } },
        { tag: 'meta', attrs: { name: 'twitter:image:alt', content: imageAlt } },
      ];
      return [...revision, ...tags.map((tag): HtmlTagDescriptor => ({ ...tag, injectTo: 'head' }))];
    },
  };
}
