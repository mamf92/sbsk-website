import { isInternalLink } from './internalLinks';
import { safeExternalUrl } from './safeUrl';

type PostLink = { label: string; url: string };
export type ResolvedLink = { label: string; internal: string | null; external: string | null };

/**
 * Only links that will work: trimmed, and either ours or a safe http(s) URL. A CMS URL that is
 * neither is dropped, so a post whose links are all unsafe gets no buttons at all.
 */
export function resolvePostLinks(links: PostLink[] | null | undefined): ResolvedLink[] {
  return (links ?? []).flatMap((link): ResolvedLink[] => {
    if (typeof link?.url !== 'string') return [];
    const url = link.url.trim();
    if (isInternalLink(url)) return [{ label: link.label, internal: url, external: null }];
    const external = safeExternalUrl(url);
    return external ? [{ label: link.label, internal: null, external }] : [];
  });
}
