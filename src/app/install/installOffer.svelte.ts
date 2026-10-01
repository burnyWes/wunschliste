type InstallOutcome = 'accepted' | 'dismissed';

export type InstallOfferState = 'unavailable' | 'available' | InstallOutcome;

// Chromium-only event, missing from the TypeScript DOM library, see
// https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent
type BeforeInstallPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: InstallOutcome }>;
};

export class InstallOffer {
  state = $state<InstallOfferState>('unavailable');
  #installPrompt: BeforeInstallPromptEvent | null = null;

  follow(browser: EventTarget): () => void {
    const keepInstallPrompt = (event: Event) => {
      this.#installPrompt = event as BeforeInstallPromptEvent;
      this.state = 'available';
    };
    const forgetInstallPrompt = () => {
      this.#installPrompt = null;
      if (this.state === 'available') {
        this.state = 'unavailable';
      }
    };
    browser.addEventListener('beforeinstallprompt', keepInstallPrompt);
    browser.addEventListener('appinstalled', forgetInstallPrompt);
    return () => {
      browser.removeEventListener('beforeinstallprompt', keepInstallPrompt);
      browser.removeEventListener('appinstalled', forgetInstallPrompt);
    };
  }

  async install(): Promise<void> {
    const installPrompt = this.#installPrompt;
    if (installPrompt === null) {
      return;
    }
    this.#installPrompt = null;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    this.state = outcome;
  }
}

export const installOffer = new InstallOffer();
