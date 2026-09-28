let isPageFocusRequested = false;

export function requestPageFocus(): void {
  isPageFocusRequested = true;
}

export function takePageFocusRequest(): boolean {
  const wasRequested = isPageFocusRequested;
  isPageFocusRequested = false;
  return wasRequested;
}
