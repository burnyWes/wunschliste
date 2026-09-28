export type Route = 'wishlists' | 'settings';

const DEFAULT_ROUTE: Route = 'wishlists';

const HASHES: Record<Route, string> = {
  wishlists: '#/',
  settings: '#/einstellungen',
};

const PAGE_TITLES: Record<Route, string> = {
  wishlists: 'Wunschlisten',
  settings: 'Einstellungen',
};

function isRoute(candidate: string): candidate is Route {
  return Object.hasOwn(HASHES, candidate);
}

export function resolveRoute(hash: string): Route {
  const matchingRoute = Object.keys(HASHES)
    .filter(isRoute)
    .find((route) => HASHES[route] === hash);
  return matchingRoute ?? DEFAULT_ROUTE;
}

export function hashFor(route: Route): string {
  return HASHES[route];
}

export function pageTitleFor(route: Route): string {
  return PAGE_TITLES[route];
}
