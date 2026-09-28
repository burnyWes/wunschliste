import { requestHeadingFocus } from '../../shared/ui/pageFocus';
import { hashFor, pageKeyOf, resolveRoute, type Route } from './routes';

export class CurrentRoute {
  route = $state.raw<Route>(resolveRoute(location.hash));

  constructor() {
    this.#showCanonicalHash();
  }

  followHashChanges(): () => void {
    const followHash = () => this.#navigateTo(resolveRoute(location.hash));
    window.addEventListener('hashchange', followHash);
    return () => window.removeEventListener('hashchange', followHash);
  }

  #navigateTo(route: Route): void {
    const isPageChange = pageKeyOf(route) !== pageKeyOf(this.route);
    this.route = route;
    this.#showCanonicalHash();
    if (isPageChange) {
      requestHeadingFocus();
    }
  }

  #showCanonicalHash(): void {
    const canonicalHash = hashFor(this.route);
    if (location.hash !== canonicalHash) {
      history.replaceState(history.state, '', canonicalHash);
    }
  }
}
