import { describe, expect, it } from 'vitest';
import { InstallOffer } from './installOffer.svelte';

type Outcome = 'accepted' | 'dismissed';

function installPromptAnswering(outcome: Outcome): Event & { wasPrompted: () => boolean } {
  let prompted = false;
  return Object.assign(new Event('beforeinstallprompt'), {
    prompt: async () => {
      prompted = true;
    },
    userChoice: Promise.resolve({ outcome }),
    wasPrompted: () => prompted,
  });
}

function followedOffer(): { offer: InstallOffer; browser: EventTarget } {
  const browser = new EventTarget();
  const offer = new InstallOffer();
  offer.follow(browser);
  return { offer, browser };
}

describe('InstallOffer', () => {
  it('is unavailable until the browser offers the installation', () => {
    const { offer } = followedOffer();

    expect(offer.state).toBe('unavailable');
  });

  it('becomes available when the browser offers the installation', () => {
    const { offer, browser } = followedOffer();

    browser.dispatchEvent(installPromptAnswering('accepted'));

    expect(offer.state).toBe('available');
  });

  it('shows the install prompt of the browser', async () => {
    const { offer, browser } = followedOffer();
    const installPrompt = installPromptAnswering('accepted');
    browser.dispatchEvent(installPrompt);

    await offer.install();

    expect(installPrompt.wasPrompted()).toBe(true);
  });

  it.each<Outcome>(['accepted', 'dismissed'])(
    'remembers that the installation was %s',
    async (outcome) => {
      const { offer, browser } = followedOffer();
      browser.dispatchEvent(installPromptAnswering(outcome));

      await offer.install();

      expect(offer.state).toBe(outcome);
    },
  );

  it('becomes available again when the browser offers the installation after a dismissal', async () => {
    const { offer, browser } = followedOffer();
    browser.dispatchEvent(installPromptAnswering('dismissed'));
    await offer.install();

    browser.dispatchEvent(installPromptAnswering('accepted'));

    expect(offer.state).toBe('available');
  });

  it('becomes unavailable once the app is installed from the browser menu', () => {
    const { offer, browser } = followedOffer();
    browser.dispatchEvent(installPromptAnswering('accepted'));

    browser.dispatchEvent(new Event('appinstalled'));

    expect(offer.state).toBe('unavailable');
  });

  it('keeps the accepted installation when the app is installed afterwards', async () => {
    const { offer, browser } = followedOffer();
    browser.dispatchEvent(installPromptAnswering('accepted'));
    await offer.install();

    browser.dispatchEvent(new Event('appinstalled'));

    expect(offer.state).toBe('accepted');
  });

  it('stops following the browser when unsubscribed', () => {
    const browser = new EventTarget();
    const offer = new InstallOffer();
    const stopFollowing = offer.follow(browser);

    stopFollowing();
    browser.dispatchEvent(installPromptAnswering('accepted'));

    expect(offer.state).toBe('unavailable');
  });
});
