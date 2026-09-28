const KEYBOARD_MIN_HEIGHT = 150;

export type ViewportHeights = { layoutHeight: number; visibleHeight: number; scale: number };

export function isOnScreenKeyboardOpen({
  layoutHeight,
  visibleHeight,
  scale,
}: ViewportHeights): boolean {
  return layoutHeight - visibleHeight * scale > KEYBOARD_MIN_HEIGHT;
}

export class OnScreenKeyboard {
  isOpen = $state(false);

  follow(): () => void {
    const viewport = window.visualViewport;
    if (viewport === null) {
      return () => {};
    }
    const update = () => {
      this.isOpen = isOnScreenKeyboardOpen({
        layoutHeight: window.innerHeight,
        visibleHeight: viewport.height,
        scale: viewport.scale,
      });
    };
    update();
    viewport.addEventListener('resize', update);
    return () => viewport.removeEventListener('resize', update);
  }
}
