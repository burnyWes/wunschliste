import { mount } from 'svelte';
import App from './app/App.svelte';
import './app/theme/colorSchemes.css';
import './app/global.css';
import './shared/ui/buttons.css';
import './shared/ui/entryList.css';

function requireAppRoot(): HTMLElement {
  const appRoot = document.getElementById('app');
  if (appRoot === null) {
    throw new Error('Missing element #app in index.html to mount the application into.');
  }
  return appRoot;
}

mount(App, { target: requireAppRoot() });
