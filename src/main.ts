import { mount } from 'svelte';
import App from './app/App.svelte';
import { applyColorScheme, loadColorScheme } from './app/theme/colorSchemeStorage';
import './app/theme/colorSchemes.css';
import './app/global.css';
import './shared/ui/buttons.css';
import './shared/ui/checkOption.css';
import './shared/ui/entryList.css';

function requireAppRoot(): HTMLElement {
  const appRoot = document.getElementById('app');
  if (appRoot === null) {
    throw new Error('Missing element #app in index.html to mount the application into.');
  }
  return appRoot;
}

// iOS Safari only applies :active styles once a touch listener is registered, see
// https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html
document.addEventListener('touchstart', () => {}, { passive: true });

applyColorScheme(loadColorScheme());

mount(App, { target: requireAppRoot() });
