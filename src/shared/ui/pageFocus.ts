let isHeadingFocusRequested = false;

export function requestHeadingFocus(): void {
  isHeadingFocusRequested = true;
}

export function takeHeadingFocusRequest(): boolean {
  const wasRequested = isHeadingFocusRequested;
  isHeadingFocusRequested = false;
  return wasRequested;
}
