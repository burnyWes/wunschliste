export type HistoryEntry = 'start' | 'inApp';

export type BackTarget = 'back' | 'fallback';

function isEntryCreatedInApp(historyState: unknown): boolean {
  return (
    typeof historyState === 'object' &&
    historyState !== null &&
    'entry' in historyState &&
    historyState.entry === 'inApp'
  );
}

export function backTargetFor(historyState: unknown): BackTarget {
  return isEntryCreatedInApp(historyState) ? 'back' : 'fallback';
}

export function isHistoryEntryMarked(): boolean {
  return history.state !== null;
}

export function markHistoryEntry(entry: HistoryEntry): void {
  history.replaceState({ entry }, '');
}

export function replaceWith(hash: string): void {
  location.replace(hash);
}

export function goBack(fallbackHash: string): void {
  if (backTargetFor(history.state) === 'back') {
    history.back();
  } else {
    replaceWith(fallbackHash);
  }
}
