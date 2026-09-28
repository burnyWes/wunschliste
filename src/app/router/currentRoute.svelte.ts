import { focusPageHeading } from './focusPageHeading';
import { hashFor, pageTitleFor, resolveRoute, type Route } from './routes';

export class CurrentRoute {
  route = $state<Route>(resolveRoute(location.hash));

  constructor() {
    this.#showRoute();
  }

  followHashChanges(): () => void {
    const followHash = () => this.#navigateTo(resolveRoute(location.hash));
    window.addEventListener('hashchange', followHash);
    return () => window.removeEventListener('hashchange', followHash);
  }

  #navigateTo(route: Route): void {
    const isPageChange = route !== this.route;
    this.route = route;
    this.#showRoute();
    if (isPageChange) {
      void focusPageHeading();
    }
  }

  #showRoute(): void {
    const canonicalHash = hashFor(this.route);
    if (location.hash !== canonicalHash) {
      history.replaceState(history.state, '', canonicalHash);
    }
    document.title = `${pageTitleFor(this.route)} – Wunschliste`;
  }
}
