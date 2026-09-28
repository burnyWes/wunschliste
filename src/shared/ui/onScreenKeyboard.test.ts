import { describe, expect, it } from 'vitest';
import { isOnScreenKeyboardOpen } from './onScreenKeyboard.svelte';

const LAYOUT_HEIGHT = 800;

describe('isOnScreenKeyboardOpen', () => {
  it('stays closed while the whole layout is visible', () => {
    expect(
      isOnScreenKeyboardOpen({ layoutHeight: LAYOUT_HEIGHT, visibleHeight: 800, scale: 1 }),
    ).toBe(false);
  });

  it('stays closed while no more than 150 pixels are hidden', () => {
    expect(
      isOnScreenKeyboardOpen({ layoutHeight: LAYOUT_HEIGHT, visibleHeight: 650, scale: 1 }),
    ).toBe(false);
  });

  it('opens once a keyboard hides more than 150 pixels', () => {
    expect(
      isOnScreenKeyboardOpen({ layoutHeight: LAYOUT_HEIGHT, visibleHeight: 500, scale: 1 }),
    ).toBe(true);
  });

  it('stays closed while the page is only zoomed in', () => {
    expect(
      isOnScreenKeyboardOpen({ layoutHeight: LAYOUT_HEIGHT, visibleHeight: 400, scale: 2 }),
    ).toBe(false);
  });
});
