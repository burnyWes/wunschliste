import { invalid, valid, type Parsed } from './parsed';

export type WishLinkProblem = 'invalid';

const HAS_SCHEME_WITH_AUTHORITY = /^[a-z][a-z0-9+.-]*:\/\//i;
const HAS_SCHEME_WITHOUT_AUTHORITY = /^(javascript|data|vbscript|mailto|tel|file):/i;
const WEB_PROTOCOLS = ['http:', 'https:'];

function withAssumedScheme(address: string): string {
  const hasScheme =
    HAS_SCHEME_WITH_AUTHORITY.test(address) || HAS_SCHEME_WITHOUT_AUTHORITY.test(address);
  return hasScheme ? address : `https://${address}`;
}

function urlOf(address: string): URL | undefined {
  try {
    return new URL(address);
  } catch {
    return undefined;
  }
}

function webAddressOf(address: string): URL | undefined {
  const url = urlOf(withAssumedScheme(address));
  const isWebAddress =
    url !== undefined && WEB_PROTOCOLS.includes(url.protocol) && url.hostname.includes('.');
  return isWebAddress ? url : undefined;
}

export class WishLink {
  private constructor(private readonly url: URL) {}

  static parse(raw: string): Parsed<WishLink | undefined, WishLinkProblem> {
    const address = raw.trim();
    if (address === '') {
      return valid(undefined);
    }
    const url = webAddressOf(address);
    return url ? valid(new WishLink(url)) : invalid('invalid');
  }

  get href(): string {
    return this.url.href;
  }

  get siteName(): string {
    return this.url.hostname.replace(/^www\./, '');
  }
}
