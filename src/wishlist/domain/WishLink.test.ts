import { describe, expect, it } from 'vitest';
import { requireValid } from './parsed';
import { WishLink } from './WishLink';

function hrefOf(raw: string): string | undefined {
  return requireValid(WishLink.parse(raw))?.href;
}

describe('WishLink.parse', () => {
  it.each(['', '   '])('treats %j as no link', (raw) => {
    expect(WishLink.parse(raw)).toEqual({ ok: true, value: undefined });
  });

  it('adds https to an address without scheme', () => {
    expect(hrefOf(' amazon.de/x ')).toBe('https://amazon.de/x');
  });

  it('adds https in front of a port', () => {
    expect(hrefOf('amazon.de:8080/x')).toBe('https://amazon.de:8080/x');
  });

  it('keeps http', () => {
    expect(hrefOf('http://a.de')).toMatch(/^http:\/\/a\.de/);
  });

  it('keeps an upper case https', () => {
    expect(hrefOf('HTTPS://A.DE')).toMatch(/^https:\/\/a\.de/);
  });

  it.each([
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    'mailto:a@b.de',
    'data:text/html,x',
    'ftp://a.de',
    'foo',
    'https://',
  ])('rejects %j', (raw) => {
    expect(WishLink.parse(raw)).toEqual({ ok: false, problem: 'invalid' });
  });

  it('names the site without www', () => {
    expect(requireValid(WishLink.parse('https://www.amazon.de/x'))?.siteName).toBe('amazon.de');
  });
});
