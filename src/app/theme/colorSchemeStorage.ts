import { DEFAULT_COLOR_SCHEME, parseColorScheme, type ColorScheme } from './colorScheme';

const STORAGE_KEY = 'wunschliste.colorScheme';

export function loadColorScheme(): ColorScheme {
  try {
    return parseColorScheme(localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_COLOR_SCHEME;
  }
}

export function saveColorScheme(scheme: ColorScheme): void {
  try {
    localStorage.setItem(STORAGE_KEY, scheme);
  } catch {
    // Storage can be unavailable (e.g. blocked site data); the scheme then lasts only for this
    // session. https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage#exceptions
  }
}

export function applyColorScheme(scheme: ColorScheme): void {
  document.documentElement.dataset.colorScheme = scheme;
}
