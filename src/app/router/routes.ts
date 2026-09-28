import {
  hashOf,
  parseWishlistAddress,
  type WishlistAddress,
} from '../../wishlist/infrastructure/ui/wishlistAddresses';

export type Route = WishlistAddress | { page: 'settings' };

export type MainPage = 'wishlists' | 'settings';

const SETTINGS_HASH = '#/einstellungen';

const DEFAULT_ROUTE: Route = { page: 'wishlists' };

export function resolveRoute(hash: string): Route {
  if (hash === SETTINGS_HASH) {
    return { page: 'settings' };
  }
  return parseWishlistAddress(hash) ?? DEFAULT_ROUTE;
}

export function hashFor(route: Route): string {
  return route.page === 'settings' ? SETTINGS_HASH : hashOf(route);
}

export function pageKeyOf(route: Route): string {
  return route.page === 'wishlist' ? hashFor({ ...route, filter: 'open' }) : hashFor(route);
}

export function mainPageOf(route: Route): MainPage | undefined {
  return route.page === 'wishlists' || route.page === 'settings' ? route.page : undefined;
}
